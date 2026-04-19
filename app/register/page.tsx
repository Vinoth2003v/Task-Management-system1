"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // ✅ NEW

  const handleRegister = async () => {
    const user = { name, email, password, role }; 

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registered successfully");
        router.push("/login");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      console.error("Error registering user:", error);
      alert("Registration failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2>Register</h2>

        <input
          style={styles.input}
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          style={styles.input}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        
        <select
          style={styles.input}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">Individual User</option>
          <option value="team">Team Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>

        <button style={styles.button} onClick={handleRegister}>
          Register
        </button>

        <p>
          Already have an account?{" "}
          <span
            style={styles.link}
            onClick={() => router.push("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
container: {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundImage:
    "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('/bg.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
},
  box: {
  background: "rgb(249, 249, 249)",
  backdropFilter: "blur(10px)",
  padding: "30px",
  borderRadius: "12px",
  width: "320px",
  textAlign: "center" as const,
  color: "#000000",
},
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "green",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  link: {
    color: "blue",
    cursor: "pointer",
  },
};