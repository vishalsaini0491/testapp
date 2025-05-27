import { loginUser, saveUserToDB } from "../dbService";

export const handleRegister = async (username, email, password, setUsername, setEmail, setPassword) => {
  if (!username || !email || !password) return alert("Enter all fields");
  await saveUserToDB(username, email, password);
  setUsername('');
  setEmail('');
  setPassword('');
  alert("✅ User registered!");
};

export const handleLogin = async (loginEmail, loginPassword, setLoggedInUser, setLoginEmail, setLoginPassword) => {
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
