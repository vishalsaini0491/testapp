import React, { useState, useEffect } from 'react';
import './App.css';
import { LocalNotifications } from '@capacitor/local-notifications';
import NotificationBell from './NotificationBell.jsx';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    LocalNotifications.requestPermissions();
  }, []);

  const handleSchedule = async () => {
    if (!userName || !title || !time) {
      alert('Fill all fields');
      return;
    }

    const scheduledTime = new Date(time);
    const id = Date.now();

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `Reminder for ${userName}`,
          body: title,
          id : Math.floor(Date.now() % 100000),
          schedule: { at: scheduledTime },
          sound: null,
          smallIcon: 'ic_launcher',
        },
      ],
    });

    setNotifications(prev => [...prev, { id, title, time }]);
    setUnreadCount(prev => prev + 1); // increment only on new task

    toast.success(`${userName}, your reminder "${title}" is set!`);
    setUserName('');
    setTitle('');
    setTime('');
  };

  const handleBellClick = () => {
    setShowPopup(!showPopup);
    if (!showPopup) setUnreadCount(0); 
  };

  return (
    <div className="app">
      <h1>Schedule Notification</h1>

      <input type="text" placeholder="Your Name" value={userName} onChange={e => setUserName(e.target.value)} />
      <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input type="datetime-local" value={time} onChange={e => setTime(e.target.value)} />
      <button onClick={handleSchedule}>Set Notification</button>

      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        onBellClick={handleBellClick}
        showPopup={showPopup}
      />
    </div>
  );
}

export default App;

