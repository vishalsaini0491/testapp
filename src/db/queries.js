import { getDB } from './initDB';

// Enable Foreign Keys
async function enableForeignKeys() {
  const db = await getDB();
  await db.execute('PRAGMA foreign_keys = ON');
}
enableForeignKeys();

// Static User ID
const STATIC_USER_ID = 100;

// Generate a unique task ID
function generateTaskId() {
  return `TASK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Generate a unique subtask ID
function generateSubtaskId() {
  return `SUBTASK-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Add task with optional subtasks
export async function addTaskWithSubtasks({ title, description, due_date, priority, is_completed, subtasks }) {
  const db = await getDB();
  const taskId = generateTaskId();

  await db.run(
    `INSERT INTO tasks (id, user_id, title, description, due_date, priority, is_completed)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [taskId, STATIC_USER_ID, title, description, due_date? new Date(due_date).toISOString() : null, priority, is_completed === "Completed" ? 1 : 0]
  );

  if (subtasks && subtasks.length) {
    for (const st of subtasks) {
      if (!st.name) continue;
      const subtaskId = generateSubtaskId();
      await db.run(
        `INSERT INTO subtasks (id, task_id, title, description, due_date, priority, is_completed)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          subtaskId,
          taskId,
          st.name,
          st.description,
          st.dateTime,
          st.priority,
          st.status === "Completed" ? 1 : 0,
        ]
      );
    }
  }
}

// Fetch all tasks with subtasks
export async function fetchAllTasks() {
  const db = await getDB();
  const tasksResult = await db.query(
    `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`,
    [STATIC_USER_ID]
  );

  const tasks = tasksResult.values || [];
  const ret = [];

  for (const task of tasks) {
    const {
      id,
      title,
      description,
      is_completed,
      due_date,
      priority,
      created_at,
      updated_at,
    } = task;

    const subtasksResult = await db.query(
      `SELECT * FROM subtasks WHERE task_id = ?`,
      [id]
    );

    const subtasks = (subtasksResult.values || []).map(st => ({
      id: st.id,
      name: st.title,
      description: st.description,
      dateTime: st.due_date,
      priority: st.priority,
      status: st.is_completed ? "Completed" : "Not Completed",
    }));

    ret.push({
      id,
      name: title,
      description,
      dateTime: due_date,
      priority,
      status: is_completed ? "Completed" : "Not Completed",
      createdAt: created_at,
      updatedAt: updated_at,
      subtasks,
    });
  }

  return ret;
}

// Delete a task and its subtasks
export async function deleteTaskById(taskId) {
  const db = await getDB();
  await db.run(`DELETE FROM subtasks WHERE task_id = ?`, [taskId]);
  await db.run(`DELETE FROM tasks WHERE id = ?`, [taskId]);
}

export async function registerUser({ name, email, password }) {
  const db = await getDB();
  // const userId = `USER-${Date.now()}`;
  await db.run(
    `INSERT INTO Users ( username, email, password) VALUES (?, ?, ?)`,
    [ name, email, password]
  );
  return { email, password }; // Return user data or ID as needed
}

export async function loginUser({ email, password }) {
  const db = await getDB();
 
  // Query the user by email and password
  const result = await db.query(
    `SELECT * FROM USERS WHERE email = ? AND password = ?`,
    [email, password]
  );
 
  if (result.values.length === 0) {
    alert("Invalid email or password")
    throw new Error("Invalid email or password");
    // return 0;
  } else{
    const user = result.values[0];
    return alert(`Login successful. Welcome, ${user.username}!`);
    // return 1;
  }
 
  // You can return the user data for session handling
}

// Export task ID generator if needed elsewhere
export { generateTaskId };
