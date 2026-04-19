"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function CompletedTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

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

    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(storedUser);
  }, []);

  const visibleTasks = tasks.filter((t) => {
    if (user?.role === "admin" || user?.role === "manager") return true; 
    return t.assignedTo === user?.email || t.createdBy === user?.email || (!t.assignedTo && !t.createdBy);
  });

  const completedTasks = visibleTasks.filter((t) => t.status === "Completed");

  return (
    <div style={{ display: "flex", background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>Completed Tasks</h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {completedTasks.length === 0 && <p>No completed tasks found.</p>}
            {completedTasks.map((t, i) => (
              <div key={i} style={{ background: "#1e293b", padding: "15px", borderRadius: "10px", borderLeft: "5px solid #10b981" }}>
                <h4 style={{ color: "#10b981" }}>{t.title}</h4>
                <p><strong>Completed On:</strong> {t.dueDate}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
