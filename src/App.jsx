// Importing React hooks and styles
import { useEffect, useState } from 'react';
import './App.css';

// Importing database helper functions

import { handleRegister,handleLogin } from './utils//userHander';
import { handleAddTask, handleFetchHistory, handleFetchTasks, handleUpdateTask } from './utils/taskHandler';
import { initSQLite } from './dbService';

function App() {
  // State for registration
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [users, setUsers] = useState([]);

  // State for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggedInUser, setLoggedInUser] = useState(null);

  // State for task management
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [tasks, setTasks] = useState([]);
  const [agentHistory, setAgentHistory] = useState([]);

  // Initialize the SQLite DB on app load
  useEffect(() => {
    initSQLite();
  }, []);


 


 

  // Add a new task for the logged-in user


 



  

  return (
    <div style={{ padding: '1rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>User Management</h2>
      {/* Registration fields */}
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
    <button onClick={() => handleRegister(username, email, password, setUsername, setEmail, setPassword)}>Add new user</button>
      {/* List users */}
      {users.map(u => <li key={u.id}>{u.username}({u.password}) ({u.email})</li>)}

      <h3>Login</h3>
      <input placeholder="Login Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
      <input placeholder="Login Password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
      <button onClick={() => handleLogin(loginEmail, loginPassword, setLoggedInUser, setLoginEmail, setLoginPassword)}>Login</button>

      {/* Task section only if logged in */}
      {loggedInUser && (
        <div>
          <h3>Welcome, {loggedInUser.username}</h3>
          <input placeholder="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
          <input placeholder="Task Description" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
          <input placeholder="Due Date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
          <button onClick={()=>handleAddTask(loggedInUser.id,taskTitle,taskDesc,taskDueDate)}>➕ Add Task</button>
          <button onClick={() => handleFetchTasks(loggedInUser.id, setTasks)}>📋 List of tasks</button>

          {/* Render tasks */}
          {tasks.map(t => (
            <li key={t.id}>
              <strong>{t.title}</strong><br />
              {t.description}<br />
              Due: {t.due_date}<br />
              Status: {t.is_completed ? '✅' : '⏳'}<br />
             <button onClick={() => handleUpdateTask(loggedInUser.id, t.id, setTasks)}>✏️ Update</button>

            </li>
          ))}

          <button onClick={() => handleFetchHistory(loggedInUser.id, setAgentHistory)}>📜 Agent History</button>
          {/* Render history logs */}
          {agentHistory.map(a => (
            <li key={a.id}><strong>Log:</strong> {a.log}</li>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;