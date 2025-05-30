import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as ragModule from '../ragQueryUtility';
import OpenAI from 'openai';
import * as embedding from './embedding';
import * as initDB from '../../db/initDB';

// Mock dependencies
vi.mock('./embedding', () => ({
  generateTaskEmbeddingBlob: vi.fn()
}));
vi.mock('../../database/dbService', () => ({
  sqlite: {
    retrieveConnection: vi.fn()
  }
}));
vi.mock('openai', () => {
  return {
    default: vi.fn(() => ({
      chat: {
        completions: {
          create: vi.fn()
        }
      }
    }))
  };
});

vi.stubGlobal('import', async (path) => {
  if (path === './embedding') {
    return embedding;
  }
  return await vi.importActual(path);
});

const mockEmbedding = new Uint8Array(1536 * 4); // Simulate Uint8Array blob
const mockOpenAIResponse = {
  choices: [
    { message: { content: 'Mocked OpenAI Response' } }
  ]
};

let openaiInstance;
let mockDb;

beforeEach(() => {
  vi.clearAllMocks();
  openaiInstance = new OpenAI();
  mockDb = { query: vi.fn() };
  embedding.generateTaskEmbeddingBlob.mockResolvedValue(mockEmbedding);
  vi.spyOn(initDB, 'getDB').mockResolvedValue(mockDb);
  openaiInstance.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
});

describe('generateRefinedResponse', () => {
  it('returns a string response on success', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 },
        { id: '2', type: 'historic_task', distance: 0.2 }
      ] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] })
      .mockResolvedValueOnce({ values: [{ id: '2', title: 'Hist', description: 'HistDesc', priority: 'low', due_date: '2023-01-01', completion_date: '2023-01-02', created_at: '2023-01-01' }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(typeof result).toBe('string');
    expect(result).toBe('Mocked OpenAI Response');
  });

  it('returns no context found if no relevant entries', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('returns error if embedding generation fails', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(null);
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if db query fails', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('No relevant context found to answer your query.');
  });

  it('returns error if OpenAI API fails', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] });
    openaiInstance.chat.completions.create.mockRejectedValueOnce(new Error('API error'));
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns no content', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error for invalid user query', async () => {
    const result = await ragModule.generateRefinedResponse(null, embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles tasks with missing fields gracefully', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [{ id: '1' }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(typeof result).toBe('string');
  });

  it('handles historic tasks with missing fields gracefully', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '2', type: 'historic_task', distance: 0.2 }
      ] })
      .mockResolvedValueOnce({ values: [{ id: '2' }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(typeof result).toBe('string');
  });

  it('handles empty context after filtering', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('returns error if OpenAI returns choices as null', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: null });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns choices as not an array', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: 123 });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns choices with null entries', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [null, undefined] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns message.content as a number', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 123 } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns message.content as an object', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
    mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: { foo: 'bar' } } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if retrieveRelevantTasks returns null', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce(null);
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('returns error if retrieveRelevantTasks returns array with null entries', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [null, undefined] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('returns error if input is a boolean', async () => {
    const result = await ragModule.generateRefinedResponse(true, embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if input is a symbol', async () => {
    const result = await ragModule.generateRefinedResponse(Symbol('sym'), embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if embedding function returns a promise that rejects with a string', async () => {
    embedding.generateTaskEmbeddingBlob.mockImplementationOnce(() => Promise.reject('string error'));
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles extremely long user queries', async () => {
    const longQuery = 'a'.repeat(10000);
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await ragModule.generateRefinedResponse(longQuery, embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('handles user queries with only whitespace', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await ragModule.generateRefinedResponse('   ', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('handles user queries with special characters', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await ragModule.generateRefinedResponse('!@#$%^&*()', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('handles tasks with all fields missing', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [ { id: '1', type: 'task', distance: 0.1 } ] })
      .mockResolvedValueOnce({ values: [ {} ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(typeof result).toBe('string');
  });

  it('handles tasks with only required fields', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [ { id: '1', type: 'task', distance: 0.1 } ] })
      .mockResolvedValueOnce({ values: [ { id: '1' } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(typeof result).toBe('string');
  });

  it('returns error if OpenAI returns whitespace content', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [ { id: '1', type: 'task', distance: 0.1 } ] })
      .mockResolvedValueOnce({ values: [ { id: '1', title: 'Test', description: 'Desc' } ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '   ' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns empty string content', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [ { id: '1', type: 'task', distance: 0.1 } ] })
      .mockResolvedValueOnce({ values: [ { id: '1', title: 'Test', description: 'Desc' } ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns array of empty messages', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [ { id: '1', type: 'task', distance: 0.1 } ] })
      .mockResolvedValueOnce({ values: [ { id: '1', title: 'Test', description: 'Desc' } ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: {} }, { message: { content: '' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('returns error if OpenAI returns choices with missing message field', async () => {
    embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
    mockDb.query
      .mockResolvedValueOnce({ values: [ { id: '1', type: 'task', distance: 0.1 } ] })
      .mockResolvedValueOnce({ values: [ { id: '1', title: 'Test', description: 'Desc' } ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ {} ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });
});

describe('generateRefinedResponse - real life scenarios', () => {
  let openaiInstance;
  let mockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    openaiInstance = new OpenAI();
    mockDb = { query: vi.fn() };
    embedding.generateTaskEmbeddingBlob.mockResolvedValue(mockEmbedding);
    vi.spyOn(initDB, 'getDB').mockResolvedValue(mockDb);
    openaiInstance.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
  });

  it('handles multiple ongoing and completed tasks', async () => {
    // Mock VSS search result
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 },
        { id: '2', type: 'historic_task', distance: 0.2 }
      ] })
      // Ongoing task
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Ongoing', description: 'OngoingDesc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] })
      // Completed task
      .mockResolvedValueOnce({ values: [
        { id: '2', user_id: 100, title: 'Completed', description: 'CompletedDesc', priority: 'low', due_date: '2023-01-01', completed_at: '2023-01-02', created_at: '2023-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Combined response' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Combined response');
  });

  it('handles deduplication of tasks', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 },
        { id: '1', type: 'task', distance: 0.2 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Dup', description: 'DupDesc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Deduped response' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Deduped response');
  });

  it('handles tasks with missing fields', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1' } // missing most fields
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Missing fields handled' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Missing fields handled');
  });

  it('handles empty context after filtering', async () => {
    mockDb.query.mockResolvedValueOnce({ values: [] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('handles OpenAI API error', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Test', description: 'Desc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockRejectedValueOnce(new Error('API error'));
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles DB error', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('DB error'));
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error|no relevant context/i);
  });

  it('handles OpenAI returning empty choices', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Test', description: 'Desc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning whitespace content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Test', description: 'Desc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '   ' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning valid content with special characters', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Test', description: 'Desc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '!@#$%^&*()' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('!@#$%^&*()');
  });
});

describe('generateRefinedResponse - additional edge cases', () => {
  let openaiInstance;
  let mockDb;
  beforeEach(() => {
    openaiInstance = new OpenAI();
    mockDb = { query: vi.fn() };
    embedding.generateTaskEmbeddingBlob.mockResolvedValue(mockEmbedding);
    vi.spyOn(initDB, 'getDB').mockResolvedValue(mockDb);
    openaiInstance.chat.completions.create.mockResolvedValue(mockOpenAIResponse);
  });

  it('handles VSS returning duplicate IDs of different types', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [
        { id: '1', type: 'task', distance: 0.1 },
        { id: '1', type: 'historic_task', distance: 0.2 }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Ongoing', description: 'OngoingDesc', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }
      ] })
      .mockResolvedValueOnce({ values: [
        { id: '1', user_id: 100, title: 'Completed', description: 'CompletedDesc', priority: 'low', due_date: '2023-01-01', completed_at: '2023-01-02', created_at: '2023-01-01' }
      ] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Deduped by type' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Deduped by type');
  });

  it('handles VSS returning more than MAX_TASKS results', async () => {
    const vssResults = Array(20).fill(0).map((_, i) => ({ id: String(i), type: 'task', distance: i }));
    mockDb.query
      .mockResolvedValueOnce({ values: vssResults })
      .mockResolvedValue({ values: [{ id: '0', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Truncated to MAX_TASKS' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Truncated to MAX_TASKS');
  });

  it('handles VSS returning empty array and null', async () => {
    mockDb.query.mockResolvedValueOnce({ values: [] });
    let result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
    mockDb.query.mockResolvedValueOnce(null);
    result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
  });

  it('handles tasks with all fields missing', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{}] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'All fields missing' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('No relevant context found to answer your query.');
  });

  it('handles historic tasks with all fields missing', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '2', type: 'historic_task', distance: 0.2 }] })
      .mockResolvedValueOnce({ values: [{}] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'All fields missing (historic)' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('No relevant context found to answer your query.');
  });

  it('handles tasks with extra fields', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D', extra: 'ignore me' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Extra fields ignored' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Extra fields ignored');
  });

  it('handles tasks with only required fields', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Only required fields' } }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Only required fields');
  });

  it('handles context with only whitespace or empty strings', async () => {
    mockDb.query.mockResolvedValueOnce({ values: [] });
    let result = await ragModule.generateRefinedResponse('   ', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/no relevant context/i);
    result = await ragModule.generateRefinedResponse('', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all null/undefined/empty message fields', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [null, undefined, { message: {} }] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all whitespace content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '   ' } }, { message: { content: '\t' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all empty string content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '' } }, { message: { content: '' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all objects as content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: {} } }, { message: { content: {} } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all numbers as content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: 1 } }, { message: { content: 2 } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all arrays as content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: [] } }, { message: { content: [] } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all booleans as content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: true } }, { message: { content: false } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all symbols as content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: Symbol('a') } }, { message: { content: Symbol('b') } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all functions as content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: () => {} } }, { message: { content: () => {} } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toMatch(/error/i);
  });

  it('handles OpenAI returning choices with all valid string content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: 'A' } }, { message: { content: 'B' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('A');
  });

  it('handles OpenAI returning choices with mixed valid and invalid content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: null } }, { message: { content: 'B' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: 'Only valid' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('Only valid');
  });

  it('handles OpenAI returning choices with only one valid string content and rest invalid', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: null } }, { message: { content: 'Valid' } }, { message: { content: undefined } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest empty', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '' } }, { message: { content: 'Valid' } }, { message: { content: '' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest whitespace', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: '   ' } }, { message: { content: 'Valid' } }, { message: { content: '\t' } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest null', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: null } }, { message: { content: 'Valid' } }, { message: { content: null } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest undefined', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: undefined } }, { message: { content: 'Valid' } }, { message: { content: undefined } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest objects', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: {} } }, { message: { content: 'Valid' } }, { message: { content: {} } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest numbers', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: 1 } }, { message: { content: 'Valid' } }, { message: { content: 2 } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest arrays', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: [] } }, { message: { content: 'Valid' } }, { message: { content: [] } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest booleans', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: true } }, { message: { content: 'Valid' } }, { message: { content: false } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest symbols', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: Symbol('a') } }, { message: { content: 'Valid' } }, { message: { content: Symbol('b') } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });

  it('handles OpenAI returning choices with only one valid string content and rest functions', async () => {
    mockDb.query
      .mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] })
      .mockResolvedValueOnce({ values: [{ id: '1', title: 'T', description: 'D' }] });
    openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [ { message: { content: () => {} } }, { message: { content: 'Valid' } }, { message: { content: () => {} } } ] });
    const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
    expect(result).toBe('An error occurred while processing your request.');
  });
}); 