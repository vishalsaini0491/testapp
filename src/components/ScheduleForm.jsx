import React, { useState } from 'react';

export default function ScheduleForm({ onSchedule }) {
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (!userName || !title) {
      alert('Fill all fields');
      return;
    }
    onSchedule({ userName, title });
    setUserName('');
    setTitle('');
  };

  return (
    <div className="schedule-form">
      <input
        type="text"
        placeholder="Your Name"
        value={userName}
        onChange={e => setUserName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <button onClick={handleSubmit}>Set Notification</button>
    </div>
  );
}
