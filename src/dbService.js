// All SQLite operations for user, task, and agent history management are handled here.

import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

// Create a new SQLite connection instance
const sqlite = new SQLiteConnection(CapacitorSQLite);

// Define database name
const dbName = 'usersdb';

/**
 * Initialize SQLite if available
 */
export const initSQLite = async () => {
  if ((await sqlite.isAvailable()).result) {
    await sqlite.initialize();
    console.log("✅ SQLite initialized");
  } else {
    console.warn("❌ SQLite not available on this platform");
  }
};

/**
 * Opens a connection to the database
 */
export const openDB = async () => {
  const db = await sqlite.createConnection(dbName, false, 'no-encryption', 1);
  await db.open();
  return db;
};

/**
 * Closes the current DB connection
 */
export const closeDB = async () => {
  await sqlite.closeConnection(dbName);
};

/**
 * Creates required tables if they don't exist
 */
export const createTables = async (db) => {
  // Users Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      email TEXT,
      password TEXT
    );
  `);

  // Agent History Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS agent_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      log TEXT DEFAULT 'login successful',
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
  `);

  // Tasks Table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      is_completed INTEGER DEFAULT 0,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
  `);
};

/**
 * Saves a new user to the database
 */
export const saveUserToDB = async (username, email, password) => {
  const db = await openDB();
  await createTables(db);

  await db.run(
    `INSERT INTO Users (username, email, password) VALUES (?, ?, ?)`,
    [username, email, password]
  );

  await closeDB();
};

/**
 * Fetches all users from the database
 */
export const fetchAllUsers = async () => {
  const db = await openDB();
  const result = await db.query(`SELECT * FROM Users`);
  await closeDB();
  return result.values || [];
};

/**
 * Logs in the user if credentials match
 * Also adds an entry in agent_history if it's their first login
 */
export const loginUser = async (email, password) => {
  const db = await openDB();
  await createTables(db);

  const result = await db.query(
    `SELECT * FROM Users WHERE email = ? AND password = ?`,
    [email, password]
  );

  let user = null;
  if (result.values.length > 0) {
    user = result.values[0];

    const history = await db.query(
      `SELECT * FROM agent_history WHERE user_id = ?`,
      [user.id]
    );

    if (history.values.length > 0) {
      // Already has a log; don't add again
      const log = history.values[0].log;
      await db.run(
        `UPDATE agent_history SET log = ? WHERE user_id = ?`,
        [log, user.id]
      );
    } else {
      // First login; insert log
      await db.run(
        `INSERT INTO agent_history (user_id, log) VALUES (?, ?)`,
        [user.id, 'Login successful']
      );
    }
  }

  await closeDB();
  return user;
};

/**
 * Adds a task for a specific user
 * Also appends the action to agent history
 */
export const addTaskToDB = async (userId, title, description, dueDate) => {
  const db = await openDB();
  await createTables(db);

  await db.run(
    `INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)`,
    [userId, title, description, dueDate]
  );

  // Log to agent history
  const history = await db.query(
    `SELECT * FROM agent_history WHERE user_id = ?`,
    [userId]
  );

  const taskLog = `\nTask added by user ${userId}`;
  if (history.values.length > 0) {
    const currentLog = history.values[0].log;
    await db.run(
      `UPDATE agent_history SET log = ? WHERE user_id = ?`,
      [currentLog + taskLog, userId]
    );
  } else {
    await db.run(
      `INSERT INTO agent_history (user_id, log) VALUES (?, ?)`,
      [userId, taskLog]
    );
  }

  await closeDB();
};

/**
 * Updates a task and logs the update in history
 */
export const updateTaskInDB = async (userId, taskId, newTitle, newDesc) => {
  const db = await openDB();

  await db.run(
    `UPDATE tasks SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newTitle, newDesc, taskId]
  );

  const history = await db.query(
    `SELECT * FROM agent_history WHERE user_id = ?`,
    [userId]
  );

  const updateLog = `Task updated by user ${userId}`;
  if (history.values.length > 0) {
    const currentLog = history.values[0].log;
    await db.run(
      `UPDATE agent_history SET log = ? WHERE user_id = ?`,
      [currentLog + updateLog, userId]
    );
  } else {
    await db.run(
      `INSERT INTO agent_history (user_id, log) VALUES (?, ?)`,
      [userId, updateLog]
    );
  }

  await closeDB();
};

/**
 * Fetches all tasks for a given user
 */
export const fetchTasksForUser = async (userId) => {
  const db = await openDB();
  const result = await db.query(
    `SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
  await closeDB();
  return result.values || [];
};

/**
 * Fetches the agent history log for a user
 */
export const fetchAgentHistoryForUser = async (userId) => {
  const db = await openDB();
  const result = await db.query(
    `SELECT * FROM agent_history WHERE user_id = ?`,
    [userId]
  );
  await closeDB();
  return result.values || [];
};