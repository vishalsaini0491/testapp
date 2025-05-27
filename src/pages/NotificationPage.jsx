// src/pages/NotificationPage.jsx
import React from 'react';

export default function NotificationPage() {
  const notifications = [
    { id: 1, title: 'Welcome!', message: 'Thanks for signing up.', time: 'Just now' },
    { id: 2, title: 'Reminder', message: 'Don’t forget to complete your profile.', time: '1 hour ago' },
    { id: 3, title: 'Update', message: 'New features have been added!', time: 'Yesterday' },
    { id: 4, title: 'Alert', message: 'Unusual login attempt detected.', time: '2 days ago' },
    { id: 5, title: 'Weekly Report', message: 'Here’s your weekly progress summary.', time: '5 days ago' },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🔔 Notifications</h2>
      <ul style={styles.list}>
        {notifications.map((note) => (
          <li key={note.id} style={styles.card}>
            <div style={styles.titleRow}>
              <h4 style={styles.title}>{note.title}</h4>
              <span style={styles.time}>{note.time}</span>
            </div>
            <p style={styles.message}>{note.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    padding: '80px 20px 80px', // Leaves space for fixed header/footer
    maxWidth: 600,
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
  },
  heading: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
    color: '#f3f3f3',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: 18,
    color: '#222',
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
  message: {
    marginTop: 5,
    fontSize: 14,
    color: '#555',
  },
};
