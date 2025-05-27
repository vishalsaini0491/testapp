import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = ({ notifications, unreadCount, onBellClick, showPopup }) => {
  return (
    <div className="bell-container">
      <Bell size={28} onClick={onBellClick} />
      {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      {showPopup && (
        <div className="popup">
          <h4>Scheduled Tasks</h4>
          <ul>
            {notifications.map(n => (
              <li key={n.id}>
                <strong>{n.title}</strong> at {new Date(n.time).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;