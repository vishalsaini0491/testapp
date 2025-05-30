# Testing Strategy for Embedding and RAG Utilities

## Table of Contents
- [Overview](#overview)
- [General Testing Approach](#general-testing-approach)
- [Embedding Utility (`embedding.js`)](#embedding-utility-embeddingjs)
  - [Test Categories](#test-categories)
  - [Key Test Case Examples](#key-test-case-examples)
- [RAG Query Utility (`ragQueryUtility.js`)](#rag-query-utility-ragqueryutilityjs)
  - [Test Categories](#test-categories-1)
  - [Key Test Case Examples](#key-test-case-examples-1)
- [Mocking and Isolation](#mocking-and-isolation)
- [Schema Consistency](#schema-consistency)
- [Error and Fallback Handling](#error-and-fallback-handling)
- [Production Robustness](#production-robustness)

---

## Overview
This document describes the comprehensive testing strategy for the core utilities in this project:
- `embedding.js`: Handles OpenAI embedding generation and BLOB conversion.
- `ragQueryUtility.js`: Handles retrieval-augmented generation (RAG) logic, including DB vector search, context assembly, and OpenAI completions.

The tests are designed to:
- Cover real-life scenarios and edge cases.
- Ensure robust error handling and fallback logic.
- Validate schema consistency between code, DB, and tests.
- Prevent regressions and ensure production reliability.

---

## General Testing Approach
- **Unit tests** are written using [Vitest](https://vitest.dev/).
- **All external dependencies** (OpenAI API, DB) are mocked to ensure tests are deterministic and fast.
- **Edge cases** (invalid input, empty/malformed responses, etc.) are explicitly tested.
- **Realistic scenarios** (multiple tasks, deduplication, missing/extra fields, etc.) are covered.
- **Error and fallback paths** are validated to ensure user-friendly and safe behavior.

---

## Embedding Utility (`embedding.js`)

### Test Categories
1. **Valid Input:**
   - Returns a `Uint8Array` for valid string input and valid embedding arrays.
2. **OpenAI API Failures:**
   - Handles API errors, missing/empty/undefined data, and returns `null`.
3. **Input Validation:**
   - Handles non-string, null, undefined, array, function, symbol, etc. as input.
4. **Embedding Array Validation:**
   - Handles arrays with non-numbers, nested arrays, objects, booleans, strings, `Infinity`, `-Infinity`, `NaN`, etc.
   - Only allows numbers and `null` (for padding) as valid elements.
5. **Edge Cases:**
   - Very large/small numbers, all zeros, all nulls, empty arrays, etc.

### Key Test Case Examples

#### Valid Embedding
```js
it('returns Uint8Array on success', async () => {
  openaiInstance.embeddings.create.mockResolvedValueOnce({
    data: [{ embedding: Array(1536).fill(0.5) }]
  });
  const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
  expect(result).toBeInstanceOf(Uint8Array);
  expect(result.length).toBe(1536 * 4);
});
```

#### Handles NaN, Infinity, -Infinity
```js
it('returns null for embedding array with Infinity and NaN', async () => {
  openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [Infinity, -Infinity, NaN] }] });
  const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
  expect(result).toBeNull();
});
```

#### Handles Non-string Input
```js
it('returns null if input is a non-string (object)', async () => {
  openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [0.1, 0.2] }] });
  const result = await embeddingModule.generateTaskEmbeddingBlob({ foo: 'bar' }, openaiInstance);
  expect(result).toBeNull();
});
```

#### Handles Nested Arrays
```js
it('returns null for deeply nested embedding array', async () => {
  openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [[0.1, 0.2]] }] });
  const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
  expect(result).toBeNull();
});
```

#### Handles All Nulls
```js
it('returns Uint8Array for embedding array of all nulls', async () => {
  openaiInstance.embeddings.create.mockResolvedValueOnce({ data: [{ embedding: [null, null, null] }] });
  const result = await embeddingModule.generateTaskEmbeddingBlob('test input', openaiInstance);
  expect(result).toBeInstanceOf(Uint8Array);
  expect(result.length).toBe(3 * 4);
});
```

---

## RAG Query Utility (`ragQueryUtility.js`)

### Test Categories
1. **Happy Path:**
   - Returns a string response when all dependencies succeed.
2. **No Context:**
   - Handles empty, null, or filtered-out context and returns a fallback message.
3. **OpenAI API Failures:**
   - Handles API errors, missing/invalid/empty choices, and returns a fallback message.
4. **DB Failures:**
   - Handles DB errors, missing/invalid results, and returns a fallback message.
5. **Input Validation:**
   - Handles invalid user queries (null, boolean, symbol, etc.).
6. **Edge Cases:**
   - Multiple tasks, deduplication, missing/extra fields, empty context, special characters, etc.
7. **OpenAI Response Validation:**
   - Handles all possible invalid/malformed OpenAI responses (null, undefined, empty, non-string, etc.).

### Key Test Case Examples

#### Happy Path
```js
it('returns a string response on success', async () => {
  embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
  mockDb.query
    .mockResolvedValueOnce({ values: [
      { id: '1', type: 'task', distance: 0.1 },
      { id: '2', type: 'historic_task', distance: 0.2 }
    ] })
    .mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc', status: 'pending', priority: 'high', due_date: '2024-01-01', created_at: '2024-01-01' }] })
    .mockResolvedValueOnce({ values: [{ id: '2', title: 'Hist', description: 'HistDesc', priority: 'low', due_date: '2023-01-01', completion_date: '2023-01-02', created_at: '2023-01-01' }] });
  openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: [{ message: { content: 'Mocked OpenAI Response' } }] });
  const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
  expect(typeof result).toBe('string');
  expect(result).toBe('Mocked OpenAI Response');
});
```

#### Handles No Context
```js
it('returns no context found if no relevant entries', async () => {
  embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
  mockDb.query.mockResolvedValueOnce({ values: [] });
  const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
  expect(result).toMatch(/no relevant context/i);
});
```

#### Handles OpenAI API Error
```js
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
```

#### Handles Invalid OpenAI Response
```js
it('returns error if OpenAI returns choices as null', async () => {
  embedding.generateTaskEmbeddingBlob.mockResolvedValueOnce(mockEmbedding);
  mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', type: 'task', distance: 0.1 }] });
  mockDb.query.mockResolvedValueOnce({ values: [{ id: '1', title: 'Test', description: 'Desc' }] });
  openaiInstance.chat.completions.create.mockResolvedValueOnce({ choices: null });
  const result = await ragModule.generateRefinedResponse('test query', embedding.generateTaskEmbeddingBlob, openaiInstance);
  expect(result).toMatch(/error/i);
});
```

#### Handles Special Characters
```js
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
```

---

## Mocking and Isolation
- **OpenAI API** is always mocked to avoid real API calls and control the returned data.
- **Database** is mocked to simulate all possible DB states (success, error, empty, etc.).
- **Dependency injection** is used to pass mocked instances into the utility functions.
- **No real network or DB access** occurs during tests, ensuring speed and reliability.

---

## Schema Consistency
- All test data (mocked DB rows, etc.) use the exact field names and types as defined in the real DB schema (`initDB.js`).
- This prevents bugs due to mismatched field names or missing/extra columns.

---

## Error and Fallback Handling
- All error paths (API, DB, input validation, etc.) are explicitly tested.
- The code always returns a user-friendly fallback message, never throws or leaks stack traces to the user.
- Tests assert that these fallback messages are returned in all error/edge cases.

---

## Production Robustness
- The tests ensure that the utilities:
  - Never crash on bad input or external failures.
  - Always return a valid, user-friendly result.
  - Handle all real-world and edge-case scenarios.
  - Are safe for production use, with no reliance on test-only logic.
- Any future code changes that break these guarantees will cause test failures, preventing regressions.

---

For further details, see the test files:
- [`src/utils/__tests__/embedding.test.js`](src/utils/__tests__/embedding.test.js)
- [`src/utils/__tests__/ragQueryUtility.test.js`](src/utils/__tests__/ragQueryUtility.test.js) 