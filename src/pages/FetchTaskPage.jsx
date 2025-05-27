import React from 'react';

const dummyTasks = [
  { id: 1, name: 'Buy groceries' },
  { id: 2, name: 'Clean room' },
  { id: 3, name: 'Workout' },
];

export default function FetchTaskPage() {
  return (
    <div style={styles.container}>
      <h2>Your Tasks</h2>
      <ul style={styles.list}>
        {dummyTasks.map((task) => (
          <li key={task.id} style={styles.item}>
            📌 {task.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
    marginTop: 80,
    fontFamily: 'Arial',
    textAlign: 'center',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  item: {
    backgroundColor: '#000',
    margin: '10px auto',
    padding: 12,
    borderRadius: 6,
    width: '80%',
    textAlign: 'left',
  },
};
