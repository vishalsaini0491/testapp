import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});
 
/**
 * Generates an embedding from OpenAI and returns it as a Uint8Array for BLOB storage
 */

export const generateTaskEmbeddingBlob = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    const floatArray = new Float32Array(response.data[0].embedding);
    const uint8Array = new Uint8Array(floatArray.buffer); // Convert for BLOB
    return uint8Array;
  } catch (error) {
    console.error("Embedding generation failed:", error);
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