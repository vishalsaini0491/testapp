import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Dummy validation
    if (username && password) {
      navigate('/home');
    } else {
      alert('Please enter both username and password');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Login</h2>
      <input
        style={styles.input}
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        style={styles.input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button style={styles.button} onClick={handleLogin}>Login</button>
      <p style={styles.text}>
        Don't have an account?{' '}
        <span style={styles.link} onClick={() => navigate('/signup')}>Sign Up</span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: '100px auto',
    padding: 20,
    borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 10,
    margin: '10px 0',
    borderRadius: 5,
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: 10,
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
  },
  text: {
    marginTop: 15,
  },
  link: {
    color: '#007BFF',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
