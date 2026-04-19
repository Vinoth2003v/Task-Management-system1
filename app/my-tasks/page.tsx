"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function MyTasks() {
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

  const myTasks = tasks.filter((t) => t.assignedTo === user?.email || t.createdBy === user?.email);

  return (
    <div style={{ display: "flex", background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>My Tasks</h1>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {myTasks.length === 0 && <p>You have no assigned tasks.</p>}
            {myTasks.map((task, i) => {
              const isDeadlineApproaching = task.dueDate && task.status !== "Completed" && (new Date(task.dueDate).getTime() - new Date().getTime() < 86400000 * 2);

              return (
              <div key={task.id || i} style={{ background: "#1e293b", padding: "15px", borderRadius: "10px" }}>
                <h4>
                    {task.title}
                    {isDeadlineApproaching && <span style={{ color: "red", fontSize: "12px", marginLeft: "10px" }}>⚠️ Approaching!</span>}
                </h4>
                <p><strong>Due Date:</strong> {task.dueDate}</p>
                <p><strong>Priority:</strong> {task.priority}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <strong>Status:</strong>
                    <select 
                        style={{ padding: "5px", borderRadius: "5px", border: "none", outline: "none" }} 
                        value={task.status} 
                        onChange={(e) => updateTaskStatus(task, e.target.value)}
                    >
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Pending Approval">Pending Approval</option>
                        <option value="Completed">Completed</option>
                    </select>
                    {task.status === "Completed" && task.completedBy && <span style={{color: '#10b981', fontSize: '14px'}}> (By {task.completedBy})</span>}

                    {/* ACTION BUTTON */}
                    {task.status === "In Progress" && task.assignedTo === user?.email && (
                        <button 
                            onClick={() => updateTaskStatus(task, "Pending Approval")}
                            style={{ marginLeft: "auto", background: "#fbbf24", color: "#000", padding: "5px 12px", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                        >
                            Request Completion
                        </button>
                    )}
                </div>

                {/* COMMENTS SECTION */}
                <div style={{ marginTop: "15px", padding: "10px", background: "#334155", borderRadius: "8px" }}>
                    <h5 style={{ margin: "0 0 10px 0" }}>Comments ({task.comments?.length || 0})</h5>
                    
                    <div style={{ maxHeight: "150px", overflowY: "auto", marginBottom: "10px" }}>
                        {task.comments?.map((c: any, j: number) => (
                            <div key={j} style={{ fontSize: "14px", marginBottom: "8px", borderBottom: "1px solid #475569", paddingBottom: "5px" }}>
                                <strong style={{ color: "#fbbf24" }}>{c.by}</strong>: {c.text}
                                <div style={{ fontSize: "10px", color: "gray", marginTop: "2px" }}>{new Date(c.date).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                        <input 
                            id={`comment-${task.id}`} 
                            style={{ padding: "8px", borderRadius: "5px", border: "none", outline: "none", fontSize: "14px", flex: 1 }} 
                            placeholder="Type a comment..."
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    const el = e.target as HTMLInputElement;
                                    if (el.value) { addComment(task, el.value); el.value = ''; }
                                }
                            }}
                        />
                        <button style={{ background: "#3b82f6", color: "white", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "14px" }} onClick={() => {
                            const el = document.getElementById(`comment-${task.id}`) as HTMLInputElement;
                            if (el.value) { addComment(task, el.value); el.value = ''; }
                        }}>
                            Post
                        </button>
                    </div>
                </div>

              </div>
            )})}
          </div>
        </div>
      </div>
    </div>
  );
}
