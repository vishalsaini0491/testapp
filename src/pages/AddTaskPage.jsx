import React, { useState } from 'react';

export default function AddTaskPage() {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [subtasks, setSubtasks] = useState([
    { name: '', description: '', dateTime: '' },
  ]);

  const handleSubtaskChange = (index, field, value) => {
    const updated = [...subtasks];
    updated[index][field] = value;
    setSubtasks(updated);
  };

  const addSubtask = () => {
    setSubtasks([...subtasks, { name: '', description: '', dateTime: '' }]);
  };

  const removeSubtask = (index) => {
    const updated = subtasks.filter((_, i) => i !== index);
    setSubtasks(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const task = {
      taskName,
      description,
      dateTime,
      subtasks,
    };
    console.log("Submitted Task:", task);
    alert("Task Submitted Successfully!");
    // Reset form (optional)
    setTaskName('');
    setDescription('');
    setDateTime('');
    setSubtasks([{ name: '', description: '', dateTime: '' }]);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>➕ Add New Task</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          placeholder="Task Name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />

        <textarea
          style={styles.input}
          placeholder="Task Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <input
          style={styles.input}
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
        />

        <h3>Subtasks</h3>
        {subtasks.map((subtask, index) => (
          <div key={index} style={styles.subtask}>
            <input
              style={styles.input}
              type="text"
              placeholder="Subtask Name"
              value={subtask.name}
              onChange={(e) =>
                handleSubtaskChange(index, 'name', e.target.value)
              }
              required
            />
            <textarea
              style={styles.input}
              placeholder="Subtask Description"
              value={subtask.description}
              onChange={(e) =>
                handleSubtaskChange(index, 'description', e.target.value)
              }
              required
            />
            <input
              style={styles.input}
              type="datetime-local"
              value={subtask.dateTime}
              onChange={(e) =>
                handleSubtaskChange(index, 'dateTime', e.target.value)
              }
              required
            />
            {subtasks.length > 1 && (
              <button
                type="button"
                onClick={() => removeSubtask(index)}
                style={styles.removeBtn}
              >
                ❌ Remove
              </button>
            )}
          </div>
        ))}

        <button type="button" onClick={addSubtask} style={styles.addBtn}>
          ➕ Add More Subtasks
        </button>

        <button type="submit" style={styles.submitBtn}>
          ✅ Submit Task
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    maxWidth: 500,
    margin: 'auto',
    fontFamily: 'Arial',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: '1px solid #ccc',
    fontSize: 16,
    width: '100%',
  },
  subtask: {
    border: '1px solid #ddd',
    borderRadius: 8,
    padding: 12,
    background: '#f9f9f9',
    marginBottom: 10,
  },
  addBtn: {
    backgroundColor: '#17a2b8',
    color: '#fff',
    padding: 10,
    fontSize: 16,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },
  removeBtn: {
    backgroundColor: '#dc3545',
    color: '#fff',
    padding: 6,
    fontSize: 14,
    marginTop: 8,
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  submitBtn: {
    backgroundColor: '#28a745',
    color: '#fff',
    padding: 12,
    fontSize: 18,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    marginTop: 20,
  },
};
