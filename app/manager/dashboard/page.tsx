"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    todo: 0,
    inProgress: 0,
    productivity: 0
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);

    if (storedUser?.email) {
      fetchData(storedUser.email);
    }
  }, []);

  const fetchData = async (email: string) => {
    try {
      // Fetch tasks created by manager or assigned to manager
      const res = await fetch(`/api/tasks?createdBy=${encodeURIComponent(email)}`);
      const allTasks = await res.json();
      setTasks(allTasks);

      // Calculate stats
      const total = allTasks.length;
      const completed = allTasks.filter((t: any) => t.status === "Completed").length;
      const todo = allTasks.filter((t: any) => t.status === "Todo").length;
      const inProgress = allTasks.filter((t: any) => t.status === "In Progress").length;
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      setStats({ total, completed, todo, inProgress, productivity });

      // Fetch team members
      const userRes = await fetch("/api/users");
      const allUsers = await userRes.json();
      setTeamMembers(allUsers.filter((u: any) => u.role === "team"));
    } catch (err) {
      console.error(err);
    }
  };

  const createTask = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newTask = {
      title: formData.get("title"),
      description: formData.get("description"),
      assignedTo: formData.get("assignedTo"),
      dueDate: formData.get("dueDate"),
      priority: formData.get("priority"),
      createdBy: user.email,
      status: "Todo",
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        alert("Task assigned successfully!");
        fetchData(user.email);
        e.target.reset();
        
        // Notify member
        if (newTask.assignedTo) {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: newTask.assignedTo,
              message: `📅 New Task Assigned: '${newTask.title}' by ${user.name}`,
            }),
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={styles.container}>
          <h1 style={styles.header}>Manager Dashboard</h1>

          {/* ANALYTICS SECTION */}
          <div style={styles.statsGrid}>
             <div style={styles.statCard}>
                <h4>Total Team Tasks</h4>
                <p style={{ fontSize: "32px", color: "#fbbf24" }}>{stats.total}</p>
             </div>
             <div style={styles.statCard}>
                <h4>Completed</h4>
                <p style={{ fontSize: "32px", color: "#10b981" }}>{stats.completed}</p>
             </div>
             <div style={styles.statCard}>
                <h4>Productivity</h4>
                <p style={{ fontSize: "32px", color: "#3b82f6" }}>{stats.productivity}%</p>
             </div>
             <div style={styles.statCard}>
                <h4>Active Bottlenecks</h4>
                <p style={{ fontSize: "32px", color: "#ef4444" }}>{stats.inProgress}</p>
             </div>
          </div>

          <div style={styles.mainGrid}>
            {/* ASSIGN TASK FORM */}
            <div style={styles.box}>
              <h3>Assign New Task</h3>
              <form onSubmit={createTask} style={styles.form}>
                <input name="title" placeholder="Task Title" required style={styles.input} />
                <textarea name="description" placeholder="Description" style={styles.input} />
                <select name="assignedTo" required style={styles.input}>
                  <option value="">Assign To...</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.email}>{m.name} ({m.email})</option>
                  ))}
                </select>
                <input name="dueDate" type="date" required style={styles.input} />
                <select name="priority" style={styles.input}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <button type="submit" style={styles.button}>Assign Task</button>
              </form>
            </div>

            {/* MONITORING LIST */}
            <div style={styles.box}>
              <h3>Team Monitoring</h3>
              <div style={styles.taskList}>
                {tasks.length === 0 && <p>No tasks found.</p>}
                {tasks.map((task) => (
                  <div key={task.id} style={styles.taskItem}>
                    <div style={{ flex: 1 }}>
                      <strong>{task.title}</strong>
                      <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Assigned: {task.assignedTo || "Unassigned"} | Due: {task.dueDate}
                      </div>
                    </div>
                    <div style={{ ...styles.badge, background: task.status === "Completed" ? "#10b981" : task.status === "In Progress" ? "#3b82f6" : "#64748b" }}>
                       {task.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: { padding: "20px", background: "#0f172a", minHeight: "100vh", color: "white" },
  header: { fontSize: "28px", marginBottom: "20px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" },
  statCard: { background: "#1e293b", padding: "20px", borderRadius: "12px", textAlign: "center", border: "1px solid #334155" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" },
  box: { background: "#1e293b", padding: "20px", borderRadius: "12px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "12px", background: "#334155", color: "white", borderRadius: "8px", border: "none" },
  button: { padding: "12px", background: "#3b82f6", color: "white", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" },
  taskList: { marginTop: "15px" },
  taskItem: { background: "#334155", padding: "12px", borderRadius: "8px", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  badge: { padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }
};
