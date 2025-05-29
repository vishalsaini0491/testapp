import React, { useState } from 'react';
import './App.css';
import ScheduleForm from './components/ScheduleForm';
import NotificationBell from './components/NotificationBell';
import useNotifications from './components/useNotifications';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const {
    notifications,
    unreadCount,
    scheduleNotification,
    clearUnreadCount,
  } = useNotifications();

  const [showPopup, setShowPopup] = useState(false);

  const handleBellClick = (state) => {
  setShowPopup(state);
  if (state === true) {
    clearUnreadCount(); 
  }
};

  return (
    <div className="app">
    
      <h1>Schedule Notification</h1>

      <ScheduleForm onSchedule={scheduleNotification} />

      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        onBellClick={handleBellClick}
        showPopup={showPopup}
      />

      <ToastContainer position="bottom-right" autoClose={4000} />
    </div>
  );
}

export default App;