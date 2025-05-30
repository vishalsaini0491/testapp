import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import "../styles/FetchTaskStyle.css";
import { fetchAllTasks } from "../db/queries";

function badgeClass(type, value) {
  return `fetch-task-badge fetch-task-badge-${type}-${value.replace(/\s+/g, '-').toLowerCase()}`;
}

export default function FetchTaskPage() {
  const [expanded, setExpanded] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchAllTasks().then(setTasks);
  }, []);

  return (
    <Layout>
      <div className="fetch-task-container scrollable-fetch-task">
        <h2 className="fetch-task-title">All Tasks</h2>
        <div className="fetch-task-subtitle">
          Click a task card to expand and view subtasks.
        </div>
        {tasks.length === 0 && (
          <div className="fetch-task-empty">
            🎉 You have no tasks!
          </div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`fetch-task-card${expanded === task.id ? " expanded" : ""}`}
            onClick={() => setExpanded(expanded === task.id ? null : task.id)}
          >
            <div className="fetch-task-row">
              <span className="fetch-task-icon">📝</span>
              <div className="fetch-task-main">
                <span className="fetch-task-name">{task.name}</span>
                <div className="fetch-task-badges">
                  <span className={badgeClass("priority", task.priority)}>{task.priority}</span>
                  <span className={badgeClass("status", task.status)}>{task.status}</span>
                </div>
              </div>
              <button
                type="button"
                className="fetch-task-expand-btn"
                aria-label={expanded === task.id ? "Collapse" : "Expand"}
                title={expanded === task.id ? "Collapse" : "Expand"}
                onClick={e => { e.stopPropagation(); setExpanded(expanded === task.id ? null : task.id); }}
              >
                {expanded === task.id ? "▲" : "▼"}
              </button>
            </div>
            {task.subtasks.length > 0 && (
              <div className="fetch-task-subtask-summary">
                {task.subtasks.slice(0, 2).map((st) => (
                  <div key={st.id} className="fetch-task-subtask-summary-item">
                    <span className="fetch-task-subtask-name">{st.name}</span>
                    <span className={badgeClass("priority", st.priority)}>{st.priority}</span>
                    <span className={badgeClass("status", st.status)}>{st.status}</span>
                  </div>
                ))}
                {task.subtasks.length > 2 && (
                  <span className="fetch-task-subtask-more">
                    +{task.subtasks.length - 2} more
                  </span>
                )}
              </div>
            )}
            {expanded === task.id && (
              <>
                <div className="fetch-task-description">
                  <b>Description:</b> {task.description}
                </div>
                {task.subtasks.length > 0 && (
                  <div className="fetch-task-subtasks">
                    <div className="fetch-task-subtasks-title">Subtasks</div>
                    {task.subtasks.map((st) => (
                      <div key={st.id} className="fetch-task-subtask-detail">
                        <div className="fetch-task-subtask-detail-row">
                          <span className="fetch-task-subtask-detail-name">{st.name}</span>
                          <span className={badgeClass("priority", st.priority)}>{st.priority}</span>
                          <span className={badgeClass("status", st.status)}>{st.status}</span>
                        </div>
                        <span className="fetch-task-subtask-desc">{st.description}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}














// import React, { useState } from "react";
// import Layout from "./Layout";
// import "../styles/FetchTaskStyle.css";

// // --- DUMMY DATA ---
// const todayStr = new Date().toISOString().split("T")[0];
// const dummyTasks = [
//   {
//     id: 1,
//     name: "Complete Assignment",
//     description: "Finish the math assignment and upload to the portal.",
//     date: todayStr,
//     priority: "High",
//     status: "Not Completed",
//     subtasks: [
//       {
//         id: 11,
//         name: "Solve Problems 1-5",
//         description: "Work on and complete the first five problems of the assignment.",
//         priority: "High",
//         status: "Completed",
//       },
//       {
//         id: 12,
//         name: "Solve Problems 6-10",
//         description: "Work on and complete the last five problems.",
//         priority: "Medium",
//         status: "Not Completed",
//       },
//     ],
//   },
//   {
//     id: 2,
//     name: "Team Meeting",
//     description: "Attend the weekly team meeting to discuss project updates and blockers.",
//     date: todayStr,
//     priority: "Medium",
//     status: "Not Completed",
//     subtasks: [
//       {
//         id: 21,
//         name: "Prepare Updates",
//         description: "Summarize this week's progress for presentation.",
//         priority: "Medium",
//         status: "Completed",
//       },
//       {
//         id: 22,
//         name: "Share Blockers",
//         description: "List any blockers for the team to help resolve.",
//         priority: "Low",
//         status: "Not Completed",
//       },
//     ],
//   },
//   {
//     id: 3,
//     name: "Read Book",
//     description: "Read at least 30 pages of the assigned book for literature class.",
//     date: todayStr,
//     priority: "Low",
//     status: "Completed",
//     subtasks: [ {
//         id: 21,
//         name: "Prepare Updates",
//         description: "Summarize this week's progress for presentation.",
//         priority: "Medium",
//         status: "Completed",
//       },],
//   },
// ];

// // --- BADGE STYLE HELPERS ---
// function badgeClass(type, value) {
//   return `fetch-task-badge fetch-task-badge-${type}-${value.replace(/\s+/g, '-').toLowerCase()}`;
// }

// export default function FetchTaskPage() {
//   const [expanded, setExpanded] = useState(null);

//   const todayTasks = dummyTasks.filter((t) => t.date === todayStr);

//   return (
//     <Layout>
//       <div className="fetch-task-container scrollable-fetch-task">
//         <h2 className="fetch-task-title">
//           Today's Tasks
//         </h2>
//         <div className="fetch-task-subtitle">
//           Click a task card to expand and view subtasks.
//         </div>
//         {todayTasks.length === 0 && (
//           <div className="fetch-task-empty">
//             🎉 You have no tasks assigned for today!
//           </div>
//         )}
//         {todayTasks.map((task) => (
//           <div
//             key={task.id}
//             className={`fetch-task-card${expanded === task.id ? " expanded" : ""}`}
//             onClick={() => setExpanded(expanded === task.id ? null : task.id)}
//           >
//             <div className="fetch-task-row">
//               <span className="fetch-task-icon">📝</span>
//               <div className="fetch-task-main">
//                 <span className="fetch-task-name">{task.name}</span>
//                 <div className="fetch-task-badges">
//                   <span className={badgeClass("priority", task.priority)}>{task.priority}</span>
//                   <span className={badgeClass("status", task.status)}>{task.status}</span>
//                 </div>
//               </div>
//               <button
//                 type="button"
//                 className="fetch-task-expand-btn"
//                 aria-label={expanded === task.id ? "Collapse" : "Expand"}
//                 title={expanded === task.id ? "Collapse" : "Expand"}
//                 onClick={e => { e.stopPropagation(); setExpanded(expanded === task.id ? null : task.id); }}
//               >
//                 {expanded === task.id ? "▲" : "▼"}
//               </button>
//             </div>
//             {/* Summarized Subtasks */}
//             {task.subtasks.length > 0 && (
//               <div className="fetch-task-subtask-summary">
//                 {task.subtasks.slice(0, 2).map((st) => (
//                   <div key={st.id} className="fetch-task-subtask-summary-item">
//                     <span className="fetch-task-subtask-name">{st.name}</span>
//                     <span className={badgeClass("priority", st.priority)}>{st.priority}</span>
//                     <span className={badgeClass("status", st.status)}>{st.status}</span>
//                   </div>
//                 ))}
//                 {task.subtasks.length > 2 && (
//                   <span className="fetch-task-subtask-more">
//                     +{task.subtasks.length - 2} more
//                   </span>
//                 )}
//               </div>
//             )}
//             {/* Expanded details */}
//             {expanded === task.id && (
//               <>
//                 <div className="fetch-task-description">
//                   <b>Description:</b> {task.description}
//                 </div>
//                 {task.subtasks.length > 0 && (
//                   <div className="fetch-task-subtasks">
//                     <div className="fetch-task-subtasks-title">Subtasks</div>
//                     {task.subtasks.map((st) => (
//                       <div key={st.id} className="fetch-task-subtask-detail">
//                         <div className="fetch-task-subtask-detail-row">
//                           <span className="fetch-task-subtask-detail-name">{st.name}</span>
//                           <span className={badgeClass("priority", st.priority)}>{st.priority}</span>
//                           <span className={badgeClass("status", st.status)}>{st.status}</span>
//                         </div>
//                         <span className="fetch-task-subtask-desc">{st.description}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         ))}
//       </div>
//     </Layout>
//   );
// }