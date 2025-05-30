import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as embeddingModule from '../embedding';
import OpenAI from 'openai';

vi.mock('openai', () => {
  return {
    default: vi.fn(() => ({
      embeddings: {
        create: vi.fn()
      }
    }))
  };
});

const mockEmbedding = Array(1536).fill(0.5);

describe('generateTaskEmbeddingBlob', () => {
  let openaiInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    openaiInstance = new OpenAI();
  });

  it('returns Uint8Array on success', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({
      data: [{ embedding: mockEmbedding }]
    });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(1536 * 4); // Float32Array to Uint8Array
  });

  it('returns null on OpenAI API failure', async () => {
    openaiInstance.embeddings.create.mockRejectedValueOnce(new Error('API error'));
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null on empty input', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array); // Still returns embedding for empty string
  });

  it('returns null if OpenAI returns no embedding', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{}] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if OpenAI returns undefined for data', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: undefined });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if OpenAI returns empty array for data', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if OpenAI returns undefined for data[0]', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [undefined] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if OpenAI returns null for data[0].embedding', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: null }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array if OpenAI returns empty array for embedding', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it('returns null if input is null', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob(null, openaiInstance);
    // OpenAI API may throw, but our catch returns null
    expect(result).toBeNull();
  });

  it('returns null if input is undefined', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob(undefined, openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if input is a non-string (object)', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob({ foo: 'bar' }, openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if embedding is not an array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: 'not-an-array' }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if embedding is an array of non-numbers (NaN)', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [NaN, NaN] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for very large embedding array', async () => {
    const largeEmbedding = Array(10000).fill(1.23);
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: largeEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(10000 * 4);
  });

  it('returns Uint8Array for very small embedding array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [0.1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns null for embedding array with mixed types', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [0.1, 'bad', 0.2] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for deeply nested embedding array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [[0.1, 0.2]] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array of all nulls', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [null, null, null] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(3 * 4);
  });

  it('returns null for embedding array with Infinity and NaN', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [Infinity, -Infinity, NaN] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if input is a symbol', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob(Symbol('sym'), openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if input is a function', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob(() => {}, openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null if input is an array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob([1,2,3], openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for whitespace string input', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: mockEmbedding }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('   ', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
  });
});

describe('generateTaskEmbeddingBlob - additional edge cases', () => {
  let openaiInstance;
  beforeEach(() => {
    openaiInstance = new OpenAI();
  });

  it('returns null for embedding array with undefined values', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [undefined, 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with one value', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [42] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with very large and very small float values', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1e30, 1e-30] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns null for embedding array with all empty strings', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['', ''] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with all booleans', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [true, false] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with mixed valid and invalid types', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 'bad', 2] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with nulls and numbers', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [null, 1, 2] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(12);
  });

  it('returns null for embedding array with objects', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [{}, 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with deeply nested arrays', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [[1], 2] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with only whitespace strings', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['   ', '\t'] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with numbers as strings', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['1', '2'] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with valid numbers as strings and numbers', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['1', 2] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with empty array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it('returns Uint8Array for embedding array with all zeros', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [0, 0, 0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(12);
  });

  it('returns Uint8Array for embedding array with all negative zeros', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [-0, -0, -0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(12);
  });

  it('returns Uint8Array for embedding array with all positive zeros', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [+0, +0, +0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(12);
  });

  it('returns null for embedding array with all positive infinity', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [Infinity, Infinity] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with all negative infinity', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [-Infinity, -Infinity] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with all NaN', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [NaN, NaN] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with a single null', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [null] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns null for embedding array with a single undefined', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [undefined] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single object', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [{}] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single boolean', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [true] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single string', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['string'] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single whitespace string', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['   '] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single number as string', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['42'] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with a single valid number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [42] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single very large number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1e30] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single very small number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1e-30] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single negative number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [-42] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single positive number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [42] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single zero', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single negative zero', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [-0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single positive zero', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [+0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns null for embedding array with a single positive infinity', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [Infinity] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single negative infinity', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [-Infinity] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single NaN', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [NaN] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single deeply nested array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [[1]] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with a single empty array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });

  it('returns Uint8Array for embedding array with a single null and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [null, 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns null for embedding array with a single undefined and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [undefined, 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single object and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [{}, 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single boolean and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [true, 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single string and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['string', 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single whitespace string and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['   ', 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single number as string and a single number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: ['42', 1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with a single valid number and a single very large number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 1e30] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single very small number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 1e-30] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single negative number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, -1] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single positive number', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 2] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single zero', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single negative zero', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, -0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single positive zero', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, +0] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns null for embedding array with a single valid number and a single positive infinity', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, Infinity] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single negative infinity', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, -Infinity] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single NaN', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, NaN] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single deeply nested array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, [2]] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns Uint8Array for embedding array with a single valid number and a single empty array', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, ...[]] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(4);
  });

  it('returns Uint8Array for embedding array with a single valid number and a single null', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, null] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(8);
  });

  it('returns null for embedding array with a single valid number and a single undefined', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, undefined] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single object', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, {}] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single boolean', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, true] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single string', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, 'string'] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single whitespace string', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, '   '] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });

  it('returns null for embedding array with a single valid number and a single number as string', async () => {
    openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [1, '42'] }] });
    const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
    expect(result).toBeNull();
  });
}); 