"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function TeamDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);

    if (storedUser?.email) {
      fetchTasks(storedUser.email);
      fetchNotifications(storedUser.email);
    }
  }, []);

  const fetchTasks = async (email: string) => {
    try {
      const res = await fetch(`/api/tasks?assignedTo=${encodeURIComponent(email)}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async (email: string) => {
    try {
      const res = await fetch(`/api/notifications?to=${encodeURIComponent(email)}`);
      const data = await res.json();
      setNotifications(data.slice(-5).reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (task: any, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
        // Notify creator
        if (task.createdBy) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: task.createdBy,
              message: `${user?.name} updated task '${task.title}' to ${newStatus}`,
            }),
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const requestHelp = async (task: any) => {
    try {
      if (task.createdBy) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: task.createdBy,
            message: `🆘 Help Requested: ${user?.name} needs help with task '${task.title}'`,
          }),
        });
        alert("Help request sent to manager!");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send help request.");
    }
  };

  const addComment = async (task: any, text: string) => {
    if (!text.trim()) return;
    const newComment = { text, by: user?.name || user?.email, date: new Date().toISOString() };
    const updatedComments = [...(task.comments || []), newComment];

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comments: updatedComments }),
      });
      if (res.ok) {
        setTasks(tasks.map((t) => (t.id === task.id ? { ...t, comments: updatedComments } : t)));
        if (task.createdBy) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: task.createdBy,
              message: `${user?.name} commented on '${task.title}'`,
            }),
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter((t) => filterStatus === "All" || t.status === filterStatus);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={styles.container}>
          <h1 style={styles.header}>Team Member Dashboard</h1>

          <div style={styles.gridTop}>
            <div style={styles.statBox}>
              <h3 style={{ color: "#fbbf24" }}>Assigned Tasks</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>{tasks.length}</p>
            </div>
            <div style={styles.statBox}>
              <h3 style={{ color: "#10b981" }}>Completed</h3>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>{tasks.filter(t => t.status === 'Completed').length}</p>
            </div>
            <div style={styles.statBox}>
              <h3 style={{ color: "#3b82f6" }}>Recent Activity</h3>
              <div style={{ fontSize: "12px", marginTop: "10px" }}>
                {notifications.map((n, i) => (
                  <div key={i} style={{ borderBottom: "1px solid #334155", padding: "5px 0" }}>
                    {n.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.taskSection}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
              <h2>My Tasks</h2>
              <select 
                style={styles.select} 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Todo">Todo</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {filteredTasks.length === 0 && <p style={{ textAlign: "center", padding: "40px" }}>No tasks assigned to you yet.</p>}

            {filteredTasks.map((task) => (
              <div key={task.id} style={styles.taskCard}>
                <div style={styles.taskHeader}>
                  <h3>{task.title}</h3>
                  <span style={{ ...styles.badge, background: task.priority === "High" ? "#ef4444" : "#3b82f6" }}>
                    {task.priority}
                  </span>
                </div>
                <p style={{ color: "#cbd5e1" }}>{task.description}</p>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", alignItems: "center" }}>
                  <div>
                    <strong>Due:</strong> {task.dueDate}
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <select
                      style={styles.statusSelect}
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task, e.target.value)}
                    >
                      <option value="Todo">Todo</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                    <button style={styles.helpButton} onClick={() => requestHelp(task)}>
                      Request Help
                    </button>
                  </div>
                </div>

                <div style={styles.commentSection}>
                   <h4>Collaboration</h4>
                   <div style={styles.commentList}>
                      {task.comments?.map((c: any, i: number) => (
                        <div key={i} style={styles.commentItem}>
                           <strong>{c.by}:</strong> {c.text}
                        </div>
                      ))}
                   </div>
                   <input 
                     style={styles.commentInput} 
                     placeholder="Type a message..." 
                     onKeyDown={(e) => {
                       if (e.key === "Enter") {
                         const el = e.target as HTMLInputElement;
                         addComment(task, el.value);
                         el.value = "";
                       }
                     }}
                   />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: { padding: "20px", background: "#0f172a", minHeight: "100vh", color: "white" },
  header: { fontSize: "28px", marginBottom: "20px" },
  gridTop: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "30px" },
  statBox: { background: "#1e293b", padding: "20px", borderRadius: "12px" },
  taskSection: { background: "#1e293b", padding: "20px", borderRadius: "12px" },
  taskCard: { background: "#334155", padding: "20px", borderRadius: "8px", marginBottom: "20px" },
  taskHeader: { display: "flex", justifyContent: "space-between", marginBottom: "10px" },
  badge: { padding: "4px 8px", borderRadius: "4px", fontSize: "12px" },
  helpButton: { background: "#ef4444", color: "white", padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer" },
  statusSelect: { background: "#1e293b", color: "white", padding: "6px", borderRadius: "6px", border: "1px solid #475569" },
  select: { background: "#334155", color: "white", padding: "10px", borderRadius: "8px", border: "none" },
  commentSection: { marginTop: "20px", borderTop: "1px solid #475569", paddingTop: "15px" },
  commentList: { maxHeight: "100px", overflowY: "auto", marginBottom: "10px" },
  commentItem: { fontSize: "13px", marginBottom: "5px" },
  commentInput: { width: "100%", padding: "8px", background: "#1e293b", color: "white", borderRadius: "6px", border: "none" },
};
