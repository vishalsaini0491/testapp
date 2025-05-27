// src/pages/AI.jsx
import React, { useState } from 'react';
import OpenAI from "openai";

export default function AI() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!input.trim()) return;

    setLoading(true);
    try {
      const openai = new OpenAI({
        apikey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true, // ⚠️ ONLY for testing
      });
      
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: `Give me an outline in 5 lines to complete this task, ${input} ` }],
      });

      console.log("result",result)

      const message = result.choices[0]?.message?.content;
      setResponse(message || "No response.");
    } catch (err) {
      console.error(err);
      setResponse("Error getting response.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>AI Assistant 🤖</h3>
      <textarea
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask me anything..."
        style={{ width: '100%', padding: 10, marginBottom: 10 }}
      />
      <button onClick={handleAsk} disabled={loading} style={{ padding: '8px 16px' }}>
        {loading ? 'Loading...' : 'Submit'}
      </button>

      {response && (
        <div style={{ marginTop: 20, background: 'black', padding: 15 }}>
          <strong>Response:</strong>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}
