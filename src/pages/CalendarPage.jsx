import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './CalendarPage.css';

const dummyBlogs = [
  { id: 1, date: new Date().toISOString(), type: 'task', content: 'Submit project update' },
  { id: 2, date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(), type: 'meeting', content: 'Team sync-up' },
  { id: 3, date: new Date().toISOString(), type: 'reminder', content: 'Call with client' },
];

export default function CalendarPage() {
  const [calendarView, setCalendarView] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const renderCalendar = () => (
    <div className="calendar-container">
      <h2>📅 Calendar View</h2>
      <div className="calendar-controls">
        <label>View Mode:</label>
        <select value={calendarView} onChange={(e) => setCalendarView(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {calendarView === 'daily' && (
        <div className="calendar-view">
          <h3>Today</h3>
          {dummyBlogs
            .filter((blog) => new Date(blog.date).toDateString() === new Date().toDateString())
            .map((blog) => (
              <div key={blog.id} className={`calendar-blog ${blog.type}`}>
                <strong>{blog.type.toUpperCase()}</strong> - {blog.content}
              </div>
            ))}
        </div>
      )}

      {calendarView === 'weekly' && (
        <div className="calendar-view week-grid">
          {[...Array(7)].map((_, i) => {
            const day = new Date();
            day.setDate(day.getDate() - day.getDay() + i);
            return (
              <div key={i} className="calendar-day">
                <h4>{day.toDateString()}</h4>
                {dummyBlogs
                  .filter((blog) => new Date(blog.date).toDateString() === day.toDateString())
                  .map((blog) => (
                    <div key={blog.id} className={`calendar-blog ${blog.type}`}>
                      <strong>{blog.type.toUpperCase()}</strong> - {blog.content}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      )}

      {calendarView === 'monthly' && (
        <div className="calendar-month-view">
          <Calendar
            value={selectedDate}
            onChange={setSelectedDate}
            tileContent={({ date }) => {
              const hasBlogs = dummyBlogs.filter((blog) => new Date(blog.date).toDateString() === date.toDateString());
              return (
                <div>
                  {hasBlogs.map((blog, i) => (
                    <span key={i} className={`dot ${blog.type}`}></span>
                  ))}
                </div>
              );
            }}
          />
          <h4>Selected Date: {selectedDate.toDateString()}</h4>
          {dummyBlogs
            .filter((blog) => new Date(blog.date).toDateString() === selectedDate.toDateString())
            .map((blog) => (
              <div key={blog.id} className={`calendar-blog ${blog.type}`}>
                <strong>{blog.type.toUpperCase()}</strong> - {blog.content}
              </div>
            ))}
        </div>
      )}
    </div>
  );

  return renderCalendar();
}
