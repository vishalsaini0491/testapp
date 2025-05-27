import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignUp = () => {
    const { username, password, confirmPassword } = form;
    if (!username || !password || !confirmPassword) {
      alert('Please fill all fields');
    } else if (password !== confirmPassword) {
      alert('Passwords do not match');
    } else {
      // Dummy success
      alert('Signed up successfully!');
      navigate('/');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Sign Up</h2>
      <input
        name="username"
        style={styles.input}
        type="text"
        placeholder="Username"
        onChange={handleChange}
        value={form.username}
      />
      <input
        name="password"
        style={styles.input}
        type="password"
        placeholder="Password"
        onChange={handleChange}
        value={form.password}
      />
      <input
        name="confirmPassword"
        style={styles.input}
        type="password"
        placeholder="Confirm Password"
        onChange={handleChange}
        value={form.confirmPassword}
      />
      <button style={styles.button} onClick={handleSignUp}>Sign Up</button>
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
};
