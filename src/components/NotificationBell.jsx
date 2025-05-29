import React,{ useRef, useEffect } from 'react';
import './NotificationBell.css';

export default function NotificationBell({ notifications, unreadCount, onBellClick, showPopup }) {
    const bellRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        onBellClick(false); // close popup
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup, onBellClick]);

  return (
    <div className="notification-container" ref={bellRef}>
      <button className="notification-bell" onClick={() => onBellClick(!showPopup)}>
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showPopup && (
        <div className="notification-popup">
          <ul>
            {notifications.map(note => (
              <li key={note.id}>
                <strong>{note.title}</strong> at {note.time}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}