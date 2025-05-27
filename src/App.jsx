import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/HomePage';
import Notifications from './pages/NotificationPage';
import AI from './pages/AIPage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignupPage';
import AddTaskPage from './pages/AddTaskPage';
import DeleteTaskPage from './pages/DeleteTaskPage';
import FetchTaskPage from './pages/FetchTaskPage';
import Layout from './Layout'; // ✅ We'll extract the layout (Header + Footer)
 
function App() {
  return (
     <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected / Main app routes with layout */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/ai" element={<AI />} />
          <Route path="/calendarpage" element={<CalendarPage />} />
          <Route path="/add-task" element={<AddTaskPage />} />
          <Route path="/delete-task" element={<DeleteTaskPage />} />
          <Route path="/fetch-task" element={<FetchTaskPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
