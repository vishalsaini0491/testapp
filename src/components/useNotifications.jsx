import { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'react-toastify';

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    LocalNotifications.requestPermissions();
  }, []);

  const scheduleNotification = async ({ userName, title }) => {
    const scheduledDate = new Date(Date.now() + 5000);
    const id = Date.now();

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `Reminder for ${userName}`,
          body: `Task "${title}" is scheduled`,
          id: Math.floor(Date.now() % 100000),
          schedule: { at: scheduledDate },
          sound: null,
          smallIcon: 'ic_launcher',
        },
      ],
    });

    const formattedTime = scheduledDate.toLocaleString();
    setNotifications(prev => [...prev, { id, title, time: formattedTime }]);
    setUnreadCount(prev => prev + 1);
    //toast.success(`${userName}, your reminder "${title}" is set!`);
    toast.success(`Login Successfully`);
  };

  const clearUnreadCount = () => setUnreadCount(0);

  return {
    notifications,
    unreadCount,
    scheduleNotification,
    clearUnreadCount,
  };
}