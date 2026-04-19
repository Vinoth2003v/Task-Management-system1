"use client";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function Settings() {

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div style={{ display: "flex", background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Navbar />
        <div style={{ padding: "20px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>Settings</h1>
          
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "10px", maxWidth: "500px" }}>
            <h3 style={{ marginBottom: "15px" }}>Account Preferences</h3>
            <p style={{ color: "#94a3b8", marginBottom: "20px" }}>Manage your account settings and preferences here.</p>
            
            <button 
              onClick={handleLogout}
              style={{ padding: "10px 20px", background: "#ef4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
