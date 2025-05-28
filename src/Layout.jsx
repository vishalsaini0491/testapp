// src/Layout.jsx
import React from 'react';
import { Outlet , Routes, Route, useNavigate } from 'react-router-dom';


export default function Layout() {
  const navigate = useNavigate();

  return (
    <>
      <div style={styles.header}>
        <h2 style={{ margin: 0, color: '#fff' }}>ToDo</h2>
        <button onClick={() => navigate('/notifications')} style={styles.iconButton}>🔔</button>
      </div>

       <div style={styles.container}>
        <Outlet /> {/* Nested routes render here */}
      </div>
      
      <div style={styles.footer}>
        <button onClick={() => navigate('/home')} style={styles.button}>🏠</button>
        <button onClick={() => navigate('/ai')} style={styles.button}>🤖</button>
        <button onClick={() => navigate('/calendarpage')} style={styles.button}>📅</button>
      </div>
    </>
  );
}

const styles = {
  header: {
    position: 'fixed',
    top: 0,
    width: '100%',
    height: 60,
    backgroundColor: '#333',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 1000,
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
    height: 60,
    backgroundColor: '#333',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  container: {
    paddingTop: 70,
    paddingBottom: 70,
  },
  button: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 24,
    cursor: 'pointer',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: 24,
    cursor: 'pointer',
  },
};
