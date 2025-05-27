// Importing React hooks and styles
import { useEffect, useState } from 'react';
import './App.css';

// Importing database helper functions
import {
  initSQLite,
  saveUserToDB,
  fetchAllUsers,
  loginUser,
  addTaskToDB,
  fetchTasksForUser,
  fetchAgentHistoryForUser,
  updateTaskInDB
} from './dbService';

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

  // Register a new user
  const handleRegister = async () => {
    if (!username || !email || !password) return alert("Enter all fields");
    await saveUserToDB(username, email, password);
    setUsername(''); setEmail(''); setPassword('');
    alert("✅ User registered!");
  };

  // Log in an existing user
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) return alert("Enter login credentials");
    const user = await loginUser(loginEmail, loginPassword);
    if (user) {
      setLoggedInUser(user);
      setLoginEmail('');
      setLoginPassword('');
      alert("✅ Login successful!");
    } else {
      alert("❌ Invalid credentials");
    }
  };

  // Fetch all registered users
  const handleFetchUsers = async () => {
    const result = await fetchAllUsers();
    setUsers(result);
  };

  // Add a new task for the logged-in user
  const handleAddTask = async () => {
    if (!taskTitle || !loggedInUser) return alert("Enter task and login");
    await addTaskToDB(loggedInUser.id, taskTitle, taskDesc, taskDueDate);
    setTaskTitle('');
    setTaskDesc('');
    setTaskDueDate('');
    alert("✅ Task added");
  };

  // Fetch tasks for the current user
  const handleFetchTasks = async () => {
    if (!loggedInUser) return;
    const result = await fetchTasksForUser(loggedInUser.id);
    setTasks(result);
  };

  // Fetch agent action history for current user
  const handleFetchHistory = async () => {
    if (!loggedInUser) return;
    const result = await fetchAgentHistoryForUser(loggedInUser.id);
    setAgentHistory(result);
  };

  // Update a task (prompt for new title/desc)
  const handleUpdateTask = async (taskId) => {
    const newTitle = prompt("New title:");
    const newDesc = prompt("New description:");
    if (!newTitle || !newDesc) return;
    await updateTaskInDB(loggedInUser.id, taskId, newTitle, newDesc);
    alert("✅ Task updated");
    handleFetchTasks();
  };
    return (
    <div style={{ padding: '1rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>User Management</h2>
      {/* Registration fields */}
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleRegister}>Add new user</button>
      <button onClick={handleFetchUsers}>List of users</button>
      {/* List users */}
      {users.map(u => <li key={u.id}>{u.username} ({u.email})</li>)}

      <h3>Login</h3>
      <input placeholder="Login Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
      <input placeholder="Login Password" type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>

      {/* Task section only if logged in */}
      {loggedInUser && (
        <div>
          <h3>Welcome, {loggedInUser.username}</h3>
          <input placeholder="Task Title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
          <input placeholder="Task Description" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} />
          <input placeholder="Due Date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
          <button onClick={handleAddTask}>➕ Add Task</button>
          <button onClick={handleFetchTasks}>📋 List of tasks</button>

          {/* Render tasks */}
          {tasks.map(t => (
            <li key={t.id}>
              <strong>{t.title}</strong><br />
              {t.description}<br />
              Due: {t.due_date}<br />
              Status: {t.is_completed ? '✅' : '⏳'}<br />
              <button onClick={() => handleUpdateTask(t.id)}>✏️ Update</button>
            </li>
          ))}

          <button onClick={handleFetchHistory}>📜 Agent History</button>
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