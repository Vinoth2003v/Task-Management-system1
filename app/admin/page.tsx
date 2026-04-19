"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({ categories: [], labels: [], require2FA: false, sessionTimeout: "30m", privacyNotice: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [taskSearch, setTaskSearch] = useState("");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setCurrentUser(storedUser);

    fetchUsers();
    fetchTasks();
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      setTasks(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/notifications'); // Reusing notifications as 'system logs' for simplicity in mock
      const logs = await res.json();
      setActivityLog(logs.slice(-10).reverse());
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      setUsers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      setSettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  // User Management
  const changeUserRole = async (id: string, newRole: string) => {
    await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole })
    });
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  // Customization & Security
  const handleSettingsUpdate = async (updatedSettings: any) => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings)
    });
    alert("Settings saved!");
    fetchSettings();
  };

  if (currentUser?.role !== "admin") {
      return (
          <div style={{ display: "flex", background: "#0f172a", minHeight: "100vh", color: "white" }}>
              <Sidebar />
              <div style={{ flex: 1, padding: "20px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <h2>Access Denied. Admins Only.</h2>
              </div>
          </div>
      );
  }

  return (
    <div style={{ display: "flex", background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "30px" }}>Admin Panel</h1>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "2px solid #334155", paddingBottom: "15px" }}>
            <button style={activeTab === "users" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("users")}>User Management</button>
            <button style={activeTab === "tasks" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("tasks")}>Tasks Overview</button>
            <button style={activeTab === "customization" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("customization")}>Customization</button>
            <button style={activeTab === "security" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("security")}>Security</button>
          </div>

          <div style={{ background: "#1e293b", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
            
            {/* USER MANAGEMENT TAB */}
            {activeTab === "users" && (
               <div>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <h3 style={{ margin: 0, color: "#fbbf24" }}>Manage Users</h3>
                      <input 
                        placeholder="Search users by name or email..." 
                        style={{ ...styles.input, maxWidth: "300px", margin: 0 }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                   </div>
                   <div style={{ overflowX: "auto" }}>
                   <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "600px" }}>
                        <thead>
                        <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8" }}>
                            <th style={{ padding: "12px" }}>Name</th>
                            <th style={{ padding: "12px" }}>Email</th>
                            <th style={{ padding: "12px" }}>Role</th>
                            <th style={{ padding: "12px" }}>Tasks Assigned</th>
                            <th style={{ padding: "12px" }}>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => {
                            const userTasks = tasks.filter(t => t.assignedTo === u.email).length;
                            return (
                            <tr key={u.id} style={{ borderBottom: "1px solid #334155" }}>
                            <td style={{ padding: "12px", fontWeight: "500" }}>{u.name}</td>
                            <td style={{ padding: "12px", color: "#cbd5e1" }}>{u.email}</td>
                            <td style={{ padding: "12px" }}>
                                <select 
                                    value={u.role} 
                                    onChange={(e) => changeUserRole(u.id, e.target.value)} 
                                    style={{...styles.input, margin: 0, padding: "8px"}}
                                >
                                    <option value="user">User</option>
                                    <option value="team">Team Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </td>
                            <td style={{ padding: "12px", color: "#fbbf24", fontWeight: "bold" }}>{userTasks}</td>
                            <td style={{ padding: "12px" }}>
                                <button 
                                    onClick={() => deleteUser(u.id)} 
                                    style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                                >
                                    Remove
                                </button>
                            </td>
                            </tr>
                        );})}
                        </tbody>
                    </table>
                    </div>
               </div>
            )}

            {/* TASKS OVERVIEW TAB */}
            {activeTab === "tasks" && (
                <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ margin: 0, color: "#fbbf24" }}>Global Task List</h3>
                        <input 
                            placeholder="Search tasks..." 
                            style={{ ...styles.input, maxWidth: "300px", margin: 0 }}
                            value={taskSearch}
                            onChange={(e) => setTaskSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", minWidth: "600px" }}>
                            <thead>
                                <tr style={{ borderBottom: "2px solid #334155", color: "#94a3b8" }}>
                                    <th style={{ padding: "12px" }}>Task Title</th>
                                    <th style={{ padding: "12px" }}>Assigned To</th>
                                    <th style={{ padding: "12px" }}>Role</th>
                                    <th style={{ padding: "12px" }}>Status</th>
                                    <th style={{ padding: "12px" }}>Priority</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.filter(t => t.title.toLowerCase().includes(taskSearch.toLowerCase()) || (t.assignedTo || "").toLowerCase().includes(taskSearch.toLowerCase())).map(t => {
                                    const assignedUser = users.find(u => u.email === t.assignedTo);
                                    return (
                                        <tr key={t.id} style={{ borderBottom: "1px solid #334155" }}>
                                            <td style={{ padding: "12px", fontWeight: "500" }}>{t.title}</td>
                                            <td style={{ padding: "12px", color: "#cbd5e1" }}>{t.assignedTo || "Unassigned"}</td>
                                            <td style={{ padding: "12px", textTransform: "capitalize" }}>{assignedUser?.role || "N/A"}</td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{ 
                                                    padding: "4px 8px", 
                                                    borderRadius: "4px", 
                                                    fontSize: "12px", 
                                                    background: t.status === "Completed" ? "#065f46" : t.status === "Pending Approval" ? "#92400e" : "#1e293b",
                                                    color: t.status === "Completed" ? "#34d399" : t.status === "Pending Approval" ? "#fbbf24" : "white"
                                                }}>
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: "12px" }}>
                                                <span style={{ 
                                                    color: t.priority === "High" ? "#ef4444" : t.priority === "Medium" ? "#fbbf24" : "#94a3b8" 
                                                }}>{t.priority}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CUSTOMIZATION TAB */}
            {activeTab === "customization" && (
               <div style={{ maxWidth: "600px" }}>
                  <h3 style={{ marginBottom: "20px", color: "#fbbf24" }}>System Config</h3>
                  
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Task Categories (Comma separated)</label>
                    <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "10px" }}>These options will appear when users create new tasks.</p>
                    <input 
                        style={styles.input} 
                        value={settings.categories?.join(', ')} 
                        onChange={(e) => setSettings({ ...settings, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                  
                  <div style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Task Built-in Labels (Comma separated)</label>
                    <input 
                        style={styles.input} 
                        value={settings.labels?.join(', ')} 
                        onChange={(e) => setSettings({ ...settings, labels: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                    />
                  </div>
                  
                  <button style={styles.button} onClick={() => handleSettingsUpdate(settings)}>Save Customization</button>
               </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
               <div style={{ maxWidth: "600px" }}>
                  <h3 style={{ marginBottom: "20px", color: "#fbbf24" }}>Security Options</h3>
                  
                  <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #3b82f6", marginBottom: "20px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input 
                            type="checkbox" 
                            style={{ width: "18px", height: "18px" }}
                            checked={settings.require2FA} 
                            onChange={(e) => setSettings({ ...settings, require2FA: e.target.checked })}
                        />
                        <strong style={{ fontSize: "16px" }}>Require Two-Factor Authentication</strong>
                    </label>
                    <p style={{ color: "#94a3b8", fontSize: "13px", marginLeft: "28px", marginTop: "5px" }}>Forces all users to set up 2FA via SMS or Authenticator App on next login.</p>
                  </div>
                  
                  <div style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Global Session Timeout</label>
                    <input 
                        style={styles.input} 
                        placeholder="e.g. 30m, 1h, 12h"
                        value={settings.sessionTimeout} 
                        onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>Privacy Notice (Displayed at Footer/Login)</label>
                    <textarea 
                        style={{ ...styles.input, minHeight: "100px", resize: "vertical" }} 
                        placeholder="State how user data is handled..."
                        value={settings.privacyNotice} 
                        onChange={(e) => setSettings({ ...settings, privacyNotice: e.target.value })}
                    />
                  </div>
                  
                  <button style={styles.button} onClick={() => handleSettingsUpdate(settings)}>Save Security Rules</button>

                  <div style={{ marginTop: "40px", borderTop: "1px solid #334155", paddingTop: "20px" }}>
                    <h4 style={{ color: "#fbbf24", marginBottom: "15px" }}>Recent System Activity</h4>
                    <div style={{ background: "#0f172a", padding: "15px", borderRadius: "8px", fontSize: "14px" }}>
                        {activityLog.length === 0 && <p style={{ color: "#94a3b8" }}>No recent activity logs.</p>}
                        {activityLog.map((log, i) => (
                            <div key={i} style={{ marginBottom: "10px", borderBottom: "1px solid #1e293b", paddingBottom: "5px" }}>
                                <span style={{ color: "#3b82f6" }}>[{new Date(log.date).toLocaleTimeString()}]</span> {log.message}
                            </div>
                        ))}
                    </div>
                  </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  tab: { padding: "10px 20px", background: "transparent", color: "#94a3b8", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" },
  activeTab: { padding: "10px 20px", background: "#3b82f6", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", transition: "0.2s" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #334155", outline: "none", background: "#0f172a", color: "white", transition: "border 0.2s" },
  button: { padding: "12px 24px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "background 0.2s" }
}
