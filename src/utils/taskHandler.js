import { addTaskToDB, fetchAgentHistoryForUser, fetchTasksForUser, updateTaskInDB } from "../dbService";
import {generateTaskEmbeddingBlob} from './embedding';


const getPriorityLabel = (value) => {
  if (value <= 1) return "High";
  if (value === 2) return "Medium";
  return "Low";
};

const status =(value)=>{
    if (value === 0) return "Pending";
    return "Completed";
}

const formatEmbeddingContext = ({ user_id, id, parent_task_id, title, description, is_completed, priority, created_at, due_date }) => {
  const priorityLabel = getPriorityLabel(priority || 3);
  const statusLabel = status(is_completed )
  const duration =
    created_at && due_date
      ? Math.ceil((new Date(due_date) - new Date(created_at)) / (1000 * 60 * 60 * 24))
      : "N/A";
 
  return `
    User ID: ${user_id}
    Task ID: ${id}
    Parent Task ID: ${parent_task_id || "None"}
    Task Title: ${title}
    Description: ${description || "No description"}
    Status: ${statusLabel || "pending"}
    Priority: ${priorityLabel}
    Duration (in days): ${duration}
  `.trim();
};

//  export const handleAddTask = async (task) => {
//   if (!taskTitle || !userId) return alert("Enter task and login");
//   await addTaskToDB(userId, taskTitle, taskDesc, taskDueDate);
//   alert("✅ Task added");
// };

export const createTask = async (task) => {
  const db = await sqlite.retrieveConnection("usersdb");
 
  const {
    user_id,
    parent_task_id,
    title,
    description,
    is_completed = 0,
    priority = 3,
    due_date,
  } = task;
 
  const created_at = new Date().toISOString(); // Optional: store or use actual timestamp if tracked separately
  
  await addTaskToDB(user_id, parent_task_id, title, description, is_completed, priority, created_at, due_date);
    alert("✅ Task added");
  
  const query = ` SELECT id FROM tasks ORDER BY ABS( strftime('%s', CURRENT_TIMESTAMP) - strftime('%s', created_at) ) LIMIT 1;`;

  const id = await db.query(query);

  const embeddingInput = formatEmbeddingContext({
    user_id,
    id,
    parent_task_id,
    title,
    description,
    is_completed,
    priority,
    created_at,
    due_date
  });
 
   const embeddingBlob = await generateTaskEmbeddingBlob(embeddingInput);

   await db.execute ('UPDATE tasks SET vector_embedding = ? WHERE id = ?', [embeddingBlob, id]);

   await db.run(`INSERT INTO tasks_embeddings (id, embedding) VALUES (?, ?)`,  [id, embeddingBlob] );
    
};


export const handleFetchTasks = async (userId, setTasks) => {
  if (!userId) return;
  const result = await fetchTasksForUser(userId);
  setTasks(result);
};

export const handleFetchHistory = async (userId, setAgentHistory) => {
  if (!userId) return;
  const result = await fetchAgentHistoryForUser(userId);
  setAgentHistory(result);
};

export const handleUpdateTask = async (userId, taskId, setTasks) => {

  const newTitle = prompt("New title:");
  const newDesc = prompt("New description:");
  if (!newTitle || !newDesc) return;
 
  const db = await sqlite.retrieveConnection("usersdb");

  const result = await db.execute(`SELECT *FROM tasks where id = ?`,[taskId])
  const task  = result?.[0];

  const {
    parent_task_id,
    is_completed,
    priority,
    due_date
  } = task;
  
  const created_at = new Date().toISOString();

  const embeddingInput = formatEmbeddingContext({
    user_id : userId,
    id :taskId,
    parent_task_id,
    title: newTitle,
    description:newDesc,
    is_completed,
    priority,
    created_at,
    due_date
  });
  
  const embeddingBlob = await generateTaskEmbeddingBlob(embeddingInput);
  await updateTaskInDB(userId, taskId, newTitle, newDesc,embeddingBlob);
  
  await db.run(
      `UPDATE tasks_embeddings SET embedding = ? WHERE id = ?`,
      [embeddingBlob, taskId]
    );

  alert("✅ Task updated");
  await handleFetchTasks(userId, setTasks);
};

export const handleCompletTask = async (userId, taskId, setTasks) => {
  const db = await sqlite.retrieveConnection("usersdb");

  // Fetch task details
  const result = await db.query(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
  const task = result?.[0];

  const {
    parent_task_id,
    title,
    description,
    priority,
    created_at,
    due_date
  } = task;

  const is_completed = 1; // Marking as completed

  // Generate new embedding after completion
  const embeddingInput = formatEmbeddingContext({
    user_id: userId,
    id: taskId,
    parent_task_id,
    title,
    description,
    is_completed,
    priority,
    created_at,
    due_date
  });

  const embeddingBlob = await generateTaskEmbeddingBlob(embeddingInput);
  await 
  // Update task completion and embedding
   await completTaskInDB(taskId,embeddingBlob)

  // Upsert embedding into tasks_embeddings table
  await db.run(
      `UPDATE task_embedding SET embedding = ? WHERE id = ?`,
      [embeddingBlob, taskId]
    );

  alert("✅ Task marked complete and embedding updated");
};
