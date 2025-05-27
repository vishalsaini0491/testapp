import { addTaskToDB, fetchAgentHistoryForUser, fetchTasksForUser, updateTaskInDB } from "../dbService";

 export const handleAddTask = async (userId, taskTitle, taskDesc, taskDueDate) => {
  if (!taskTitle || !userId) return alert("Enter task and login");
  await addTaskToDB(userId, taskTitle, taskDesc, taskDueDate);
  alert("✅ Task added");
};

export const handleFetchTasks = async (userId, setTasks) => {
  if (!userId) return;
  const result = await fetchTasksForUser(userId);
  setTasks(result);
};

export const handleFetchHistory = async (userId, setAgentHistory) => {
  if (!userId) return;
  const result = await fetchAgentHistoryForUser(userId);
  setAgentHistory(result);
};

export const handleUpdateTask = async (userId, taskId, setTasks) => {
  const newTitle = prompt("New title:");
  const newDesc = prompt("New description:");
  if (!newTitle || !newDesc) return;
  await updateTaskInDB(userId, taskId, newTitle, newDesc);
  alert("✅ Task updated");
  handleFetchTasks(userId, setTasks);
};
