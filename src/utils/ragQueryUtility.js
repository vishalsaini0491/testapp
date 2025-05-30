import { getDB } from '../db/initDB';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

const MAX_TASKS = 10;
const MAX_DESCRIPTION_LENGTH = 1000;

function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.substring(0, MAX_DESCRIPTION_LENGTH).replace(/[<>]/g, '');
}

/**
 * Safely extracts and validates task fields
 */
const sanitizeTaskFields = (task) => {
  if (!task || typeof task !== 'object') return null;

  return {
    id: task.id || task.task_id || task.historic_task_id,
    title: sanitizeString(task.title) || 'Untitled Task',
    description: sanitizeString(task.description) || 'No description provided.',
    status: sanitizeString(task.status) || 'unknown',
    priority: sanitizeString(task.priority) || 'none',
    due_date: sanitizeString(task.due_date) || 'not set',
    created_at: sanitizeString(task.created_at) || 'unknown',
    completion_date: sanitizeString(task.completion_date) || null,
    type: sanitizeString(task.type) || 'unknown'
  };
};

/**
 * Retrieves top N relevant tasks and historic tasks using SQLite VSS search.
 */
const retrieveRelevantTasks = async (queryEmbedding, topN = MAX_TASKS) => {
  try {
    const db = await getDB();
    // Execute vector search using SQLite VSS with parameterized query
    const vssResult = await db.query(
      `SELECT id, type, distance
       FROM task_embeddings
       WHERE vss_search(embedding, ?, ?)
       ORDER BY distance ASC
       LIMIT ?;`,
      [queryEmbedding, topN, topN]
    );
    
    if (!vssResult || !Array.isArray(vssResult.values)) return [];
    // Safely extract and validate task IDs
    const validResults = vssResult.values.filter(row => row && row.id && row.type);
    const taskIds = validResults.filter(row => row.type === 'task').map(row => row.id);
    const historicTaskIds = validResults.filter(row => row.type === 'historic_task').map(row => row.id);
    let tasks = [];
    let historicTasks = [];
    // Retrieve task details with parameterized queries
    if (taskIds.length) {
      const placeholders = taskIds.map(() => '?').join(',');
      if (placeholders) {
        const taskQuery = await db.query(
          `SELECT user_id, task_id as id, parent_task_id, title, description, status, priority, due_date, created_at 
           FROM tasks 
           WHERE task_id IN (${placeholders})`,
          taskIds
        );
        tasks = Array.isArray(taskQuery.values) ? taskQuery.values.map(sanitizeTaskFields).filter(Boolean) : [];
      }
    }
    if (historicTaskIds.length) {
      const placeholders = historicTaskIds.map(() => '?').join(',');
      if (placeholders) {
        const historicQuery = await db.query(
          `SELECT historic_task_id as id, original_task_id, original_parent_task_id, title, description, 
                  priority, due_date, completion_date, created_at 
           FROM historic_tasks 
           WHERE historic_task_id IN (${placeholders})`,
          historicTaskIds
        );
        historicTasks = Array.isArray(historicQuery.values) ? historicQuery.values.map(sanitizeTaskFields).filter(Boolean) : [];
      }
    }
    // Combine and preserve type information
    const allEntries = [
      ...tasks.map(task => ({ ...task, type: 'ongoing_task' })),
      ...historicTasks.map(task => ({ ...task, type: 'past_completed_task' }))
    ];
    // Maintain original VSS search order using a Map for O(1) lookup
    const taskMap = new Map(allEntries.map(entry => [entry.id, entry]));
    return validResults
      .map(row => taskMap.get(row.id))
      .filter(Boolean)
      .slice(0, MAX_TASKS);
  } catch (error) {
    console.error('Error in retrieveRelevantTasks:', error);
    return [];
  }
};

/**
 * Generates a refined response by querying OpenAI with enriched context.
 */
export const generateRefinedResponse = async (userQuery, generateTaskEmbeddingBlobImpl, openaiInstance) => {
  try {
    if (!userQuery || typeof userQuery !== 'string') {
      throw new Error('Invalid user query');
    }
    // Use injected or default implementation
    const generateTaskEmbeddingBlob = generateTaskEmbeddingBlobImpl || (await import('./embedding')).generateTaskEmbeddingBlob;
    const queryEmbeddingBlob = await generateTaskEmbeddingBlob(userQuery);
    if (!(queryEmbeddingBlob instanceof Uint8Array)) {
      throw new Error("Failed to generate embedding for user query.");
    }
    // Retrieve relevant tasks & historic tasks via VSS
    let relevantEntries;
    try {
      relevantEntries = await retrieveRelevantTasks(queryEmbeddingBlob, MAX_TASKS);
    } catch {
      return `An error occurred while processing your request.`;
    }
    if (!relevantEntries.length) {
      return "No relevant context found to answer your query.";
    }
    // Build enriched context for OpenAI
    const context = relevantEntries.map((entry, index) => {
      try {
        const numberedLabel = `(${index + 1})`;
        const typeLabel = `[${entry.type.toUpperCase()}]`;
        const sanitizedEntry = sanitizeTaskFields(entry);
        if (!sanitizedEntry) return '';
        const lines = [
          `${numberedLabel} ${typeLabel} Title: ${sanitizedEntry.title}`,
          `Description: ${sanitizedEntry.description}`,
          sanitizedEntry.status ? `Status: ${sanitizedEntry.status}` : '',
          `Priority: ${sanitizedEntry.priority}`,
          `Due Date: ${sanitizedEntry.due_date}`,
          `Created At: ${sanitizedEntry.created_at}`,
          sanitizedEntry.completion_date ? `Completion Date: ${sanitizedEntry.completion_date}` : ''
        ].filter(Boolean);
        return lines.join('\n');
      } catch (error) {
        console.error('Error formatting task entry:', error);
        return '';
      }
    }).filter(Boolean).join('\n\n');
    const enrichedPrompt = `You are an intelligent assistant tasked with answering user queries based on on_going_task and past_completed_task information.\n\n    User Query: ${userQuery}\n\n    Relevant Context:\n    ${context}\n\n    Please generate a helpful, concise, and actionable response.`.trim();
    // Call OpenAI with enriched context
    const openaiToUse = openaiInstance || openai;
    const completion = await openaiToUse.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful, context-aware assistant." },
        { role: "user", content: enrichedPrompt }
      ],
      max_tokens: 500
    });
    const content = completion?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Invalid response from OpenAI');
    }
    return content;
  } catch (error) {
    console.error("Error generating refined response:", error);
    return "An error occurred while processing your request.";
  }
};