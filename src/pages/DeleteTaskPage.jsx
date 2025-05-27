import React, { useState } from 'react';

export default function DeleteTaskPage() {
  const [taskId, setTaskId] = useState('');
  const [status, setStatus] = useState('');

  const handleDelete = (e) => {
    e.preventDefault();

    if (!taskId.trim()) {
      setStatus('⚠️ Please enter a task ID or name.');
      return;
    }

    // Mock delete logic (you can replace this with an API call)
    console.log(`Deleting task: ${taskId}`);
    setStatus(`✅ Task "${taskId}" has been deleted.`);
    setTaskId('');
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🗑️ Delete Task</h2>
      <form onSubmit={handleDelete} style={styles.form}>
        <input
          type="text"
          placeholder="Enter Task ID or Name"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.deleteBtn}>Delete</button>
      </form>
      {status && <p style={styles.status}>{status}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 400,
    margin: '80px auto',
    fontFamily: 'Arial',
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#d9534f',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    padding: 12,
    fontSize: 16,
    border: '1px solid #ccc',
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#d9534f',
    color: '#fff',
    padding: 12,
    fontSize: 16,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  status: {
    marginTop: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
};
