"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function Dashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Low");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [labels, setLabels] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  const [user, setUser] = useState<any>(null);
  const [assignedTo, setAssignedTo] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        setTasks(data);
      } catch(err) {
        console.error(err);
      }
    };
    fetchTasks();

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.categories) setAvailableCategories(data.categories);
      } catch(err) {
        console.error(err);
      }
    };
    fetchSettings();

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);

    if (storedUser?.email) {
      fetchNotifications(storedUser.email);
    }
  }, []);

  const fetchNotifications = async (email: string) => {
    try {
      const res = await fetch(`/api/notifications?to=${encodeURIComponent(email)}`);
      const data = await res.json();
      setNotifications(data.slice(-5).reverse());
    } catch (err) {
      console.error(err);
    }
  };

  const sendNotification = async (to: string, message: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, message })
      });
    } catch (err) {
      console.error("Failed to send notification", err);
    }
  };

  const addTask = async () => {
    const newTaskParams = {
      title,
      dueDate,
      priority,
      assignedTo,
      description,
      category,
      labels: labels.split(',').map(l => l.trim()).filter(Boolean),
      createdBy: user?.email,
      status: "Todo",
      comments: []
    };

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskParams)
      });
      const createdTask = await res.json();
      setTasks([...tasks, { ...createdTask, comments: [] }]);

      if (assignedTo && assignedTo !== user?.email) {
        await sendNotification(assignedTo, `You were assigned a new task: ${title}`);
      }

      setTitle("");
      setDueDate("");
      setPriority("Low");
      setAssignedTo("");
      setDescription("");
      setCategory("Uncategorized");
      setLabels("");
    } catch (err) {
      console.error(err);
    }
  };

  const updateTaskStatus = async (taskObj: any, newStatus: string) => {
    try {
      const updates = { 
        status: newStatus,
        completedBy: newStatus === "Completed" ? (user?.name || user?.email) : undefined 
      };
      
      const res = await fetch(`/api/tasks/${taskObj.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (res.ok) {
        setTasks(tasks.map((t) => t.id === taskObj.id ? { ...t, ...updates } : t));

        if (taskObj.createdBy && taskObj.createdBy !== user?.email) {
            await sendNotification(taskObj.createdBy, `${user?.name || user?.email} changed status of '${taskObj.title}' to ${newStatus}`);
        }
        if (taskObj.assignedTo && taskObj.assignedTo !== user?.email) {
            await sendNotification(taskObj.assignedTo, `The status of '${taskObj.title}' was changed to ${newStatus}`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (taskObj: any, commentText: string) => {
    if (!commentText.trim()) return;
    
    const newComment = { text: commentText, by: user?.name || user?.email, date: new Date().toISOString() };
    const updatedComments = [...(taskObj.comments || []), newComment];

    try {
      const res = await fetch(`/api/tasks/${taskObj.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: updatedComments })
      });

      if (res.ok) {
        setTasks(tasks.map((t) => t.id === taskObj.id ? { ...t, comments: updatedComments } : t));
        
        // Notify stakeholders
        const stakeholders = new Set([taskObj.createdBy, taskObj.assignedTo].filter(Boolean));
        stakeholders.delete(user?.email); // Don't notify self
        
        for (const stakeholder of Array.from(stakeholders)) {
            await sendNotification(stakeholder as string, `${user?.name || user?.email} commented on '${taskObj.title}'`);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const visibleTasks = tasks.filter((t) => {
    if (user?.role === "admin") return true; 
    if (user?.role === "manager") return t.createdBy === user?.email || t.assignedTo === user?.email || !t.assignedTo;
    return t.assignedTo === user?.email || t.createdBy === user?.email;
  });

  const filteredTasks = visibleTasks.filter(t => filterStatus === "All" || t.status === filterStatus);
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      const p = { Low: 1, Medium: 2, High: 3 };
      return (p[b.priority as keyof typeof p] || 0) - (p[a.priority as keyof typeof p] || 0);
    }
  });

  const upcomingTasks = visibleTasks
    .filter(t => t.status !== "Completed" && t.dueDate)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  return (
    <div style={{ display: "flex" }}>
      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <div style={{ flex: 1 }}>
        <Navbar />

        <div style={styles.container}>
          <h1 style={styles.header}>Dashboard</h1>

          {/* TOP SECTION: UPCOMING & ACTIVITY */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
            {/* UPCOMING DEADLINES */}
            <div style={styles.box}>
               <h3 style={{ color: "#fbbf24", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                 <span style={{ fontSize: "20px" }}>⏰</span> Upcoming Deadlines
               </h3>
               {upcomingTasks.length === 0 && <p style={{ color: "#94a3b8" }}>No upcoming deadlines.</p>}
               {upcomingTasks.map(t => (
                 <div key={t.id} style={{ padding: "10px", background: "#0f172a", borderRadius: "8px", marginBottom: "10px", borderLeft: "4px solid #ef4444" }}>
                    <div style={{ fontWeight: "bold" }}>{t.title}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>Due: {t.dueDate} | Priority: {t.priority}</div>
                 </div>
               ))}
            </div>

            {/* RECENT ACTIVITY */}
            <div style={styles.box}>
               <h3 style={{ color: "#3b82f6", marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
                 <span style={{ fontSize: "20px" }}>🔔</span> Recent Activity
               </h3>
               {notifications.length === 0 && <p style={{ color: "#94a3b8" }}>No recent activity.</p>}
               {notifications.map((n, i) => (
                 <div key={i} style={{ fontSize: "13px", marginBottom: "8px", paddingBottom: "5px", borderBottom: "1px solid #334155" }}>
                    <span style={{ color: "#94a3b8", fontSize: "11px" }}>{new Date(n.date).toLocaleTimeString()}</span> - {n.message}
                 </div>
               ))}
            </div>
          </div>

          {/* ANALYTICS SECTION */}
          <div style={{ ...styles.box, marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
            <div><strong>Total Visible Tasks:</strong> {visibleTasks.length}</div>
            <div><strong>Completed:</strong> {visibleTasks.filter(t => t.status === "Completed").length}</div>
            <div><strong>Remaining:</strong> {visibleTasks.filter(t => t.status !== "Completed").length}</div>
            <div><strong>Completion Rate:</strong> {visibleTasks.length ? Math.round((visibleTasks.filter(t => t.status === "Completed").length / visibleTasks.length) * 100) : 0}%</div>
          </div>

          <div style={styles.grid}>
              {user && (user.role === "manager" || user.role === "admin" || user.role === "user") && (
                <div style={styles.box}>
                  <h3>{user.role === "user" ? "Create Personal Task" : "Create Task"}</h3>

                  <input
                    style={styles.input}
                    placeholder="Task Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />

                  <textarea
                    style={{ ...styles.input, resize: "vertical", minHeight: "60px" }}
                    placeholder="Task Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <select
                    style={styles.input}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Uncategorized">Select Category...</option>
                    {availableCategories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <input
                    style={styles.input}
                    placeholder="Labels (comma separated)"
                    value={labels}
                    onChange={(e) => setLabels(e.target.value)}
                  />

                  <input
                    style={styles.input}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />

                  <select
                    style={styles.input}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  {user.role !== "user" && (
                    <input
                      style={styles.input}
                      placeholder="Assign To (email address of team member)"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                    />
                  )}

                  <button style={styles.button} onClick={addTask}>
                    Add Task
                  </button>
                </div>
              )}

            {/* TASK LIST */}
            <div style={styles.box}>
              <h3>Your Tasks</h3>

              <div style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
                <select style={{ ...styles.input, margin: 0 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Todo">Todo</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
                <select style={{ ...styles.input, margin: 0 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="dueDate">Sort by Due Date</option>
                  <option value="priority">Sort by Priority</option>
                </select>
              </div>

              {sortedTasks.length === 0 && <p>No tasks yet</p>}

              {sortedTasks.map((task) => {
                const isDeadlineApproaching = task.dueDate && task.status !== "Completed" && (new Date(task.dueDate).getTime() - new Date().getTime() < 86400000 * 2); 
                
                return (
                  <div key={task.id} style={styles.task}>
                    <h4>
                      {task.title} 
                      {isDeadlineApproaching && <span style={{ color: "red", fontSize: "12px", marginLeft: "10px" }}>⚠️ Approaching!</span>}
                    </h4>
                    <p><strong>Due:</strong> {task.dueDate}</p>
                    <p><strong>Priority:</strong> {task.priority}</p>
                    {task.description && <p style={{ fontSize: "14px", color: "#cbd5e1" }}><strong>Description:</strong> {task.description}</p>}
                    
                    <div style={{ display: 'flex', gap: '5px', margin: '5px 0' }}>
                        <span style={{ background: '#475569', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>{task.category || 'Uncategorized'}</span>
                        {task.labels && task.labels.map((l: string, i: number) => (
                            <span key={i} style={{ background: '#3b82f6', padding: '3px 8px', borderRadius: '12px', fontSize: '12px' }}>#{l}</span>
                        ))}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <strong>Status:</strong>
                        <select 
                            style={{ ...styles.input, width: "auto", margin: 0, padding: "5px" }} 
                            value={task.status} 
                            onChange={(e) => updateTaskStatus(task, e.target.value)}
                        >
                            <option value="Todo">Todo</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending Approval">Pending Approval</option>
                            <option value="Completed">Completed</option>
                        </select>
                        {task.status === "Completed" && task.completedBy && <span style={{color: '#10b981', fontSize: '14px'}}> (By {task.completedBy})</span>}
                        
                        {/* ACTION BUTTONS */}
                        <div style={{ marginLeft: "auto", display: "flex", gap: "10px" }}>
                          {task.status === "In Progress" && task.assignedTo === user?.email && (
                            <button 
                              onClick={() => updateTaskStatus(task, "Pending Approval")}
                              style={{ ...styles.button, width: "auto", padding: "5px 10px", background: "#fbbf24", color: "#000" }}
                            >
                              Request Completion
                            </button>
                          )}
                          
                          {task.status === "Pending Approval" && (user?.role === "admin" || user?.role === "manager") && (
                            <>
                              <button 
                                onClick={() => updateTaskStatus(task, "Completed")}
                                style={{ ...styles.button, width: "auto", padding: "5px 10px", background: "#10b981" }}
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => updateTaskStatus(task, "In Progress")}
                                style={{ ...styles.button, width: "auto", padding: "5px 10px", background: "#ef4444" }}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                    </div>

                    <p style={{ marginTop: '10px' }}><strong>Assigned To:</strong> {task.assignedTo || "Unassigned"}</p>

                    {/* COMMENTS SECTION */}
                    <div style={{ marginTop: "15px", padding: "10px", background: "#1e293b", borderRadius: "8px" }}>
                        <h5 style={{ margin: "0 0 10px 0" }}>Comments ({task.comments?.length || 0})</h5>
                        
                        <div style={{ maxHeight: "150px", overflowY: "auto", marginBottom: "10px" }}>
                            {task.comments?.map((c: any, i: number) => (
                                <div key={i} style={{ fontSize: "14px", marginBottom: "8px", borderBottom: "1px solid #334155", paddingBottom: "5px" }}>
                                    <strong style={{ color: "#fbbf24" }}>{c.by}</strong>: {c.text}
                                    <div style={{ fontSize: "10px", color: "gray", marginTop: "2px" }}>{new Date(c.date).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", gap: "10px" }}>
                            <input 
                                id={`comment-${task.id}`} 
                                style={{ ...styles.input, margin: 0, padding: "8px", fontSize: "14px", flex: 1 }} 
                                placeholder="Type a comment..."
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        const el = e.target as HTMLInputElement;
                                        if (el.value) { addComment(task, el.value); el.value = ''; }
                                    }
                                }}
                            />
                            <button style={{ ...styles.button, margin: 0, padding: "8px 15px", fontSize: "14px", width: "auto" }} onClick={() => {
                                const el = document.getElementById(`comment-${task.id}`) as HTMLInputElement;
                                if (el.value) { addComment(task, el.value); el.value = ''; }
                            }}>
                                Post
                            </button>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "white",
  },
  header: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "20px",
  },
  box: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
  },
  input: {
    width: "100%",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "8px",
    border: "none",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  task: {
    background: "#334155",
    padding: "15px",
    borderRadius: "10px",
    marginTop: "10px",
  },
};