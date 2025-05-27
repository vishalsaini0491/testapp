import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function HomePage() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome to Home</h1>
      <p>This is your home dashboard.</p>

       <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginTop: '40px',
        flexWrap: 'wrap',
      }}
    >
      <button onClick={() => navigate('/add-task')}style={buttonStyle}>Add Task</button>
      <button onClick={() => navigate('/fetch-task')}style={buttonStyle}>Fetch Task</button>
      <button onClick={() => navigate('/delete-task')}style={buttonStyle}>Delete Task</button>
    </div>
    </div>
  );
}


const buttonStyle = {
  padding: '12px 24px',
  margin: '10px 0',
  fontSize: '16px',
  cursor: 'pointer',
  width: '200px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  backgroundColor: '#007bff',
  color: '#fff',
};
