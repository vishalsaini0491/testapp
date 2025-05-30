import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

/**
 * Generates an embedding from OpenAI and returns it as a Uint8Array for BLOB storage
 */

export const generateTaskEmbeddingBlob = async (text, openaiInstance = openai) => {
  try {
    if (typeof text !== 'string') {
      return null;
    }
    const response = await openaiInstance.embeddings.create({
      model: "text-embedding-ada-002",
      input: text
    });
    if (
      !response.data ||
      !response.data[0] ||
      !Array.isArray(response.data[0].embedding)
    ) {
      return null;
    }
    // Check for nested arrays or non-number elements
    const embeddingArr = response.data[0].embedding;
    if (!embeddingArr.every(x => typeof x === 'number' || (typeof x === 'object' && x === null))) {
      return null;
    }
    if (embeddingArr.some(x => Array.isArray(x))) {
      return null;
    }
    // Additional check for Infinity, -Infinity, or NaN
    if (embeddingArr.some(x => typeof x === 'number' && (!Number.isFinite(x) || Number.isNaN(x)))) {
      return null;
    }
    const floatArray = new Float32Array(embeddingArr);
    const uint8Array = new Uint8Array(floatArray.buffer); // Convert for BLOB
    return uint8Array;
  } catch {
    return null;
  }
};



/*
This function generates an embedding for a given text using OpenAI's text-embedding-ada-002 model.

Benefits of BLOB Storage:
-------------------------
Maintains the exact floating-point precision of the embedding.
Faster to load directly into memory for vector similarity searches in RAG applications.
Binary representation is more efficient for storage than using a TEXT column or JSON arrays.
*/


