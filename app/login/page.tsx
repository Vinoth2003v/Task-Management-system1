"use client";
import { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;
        localStorage.setItem("user", JSON.stringify(user));
        alert("Login successful");

        if (user.role === "admin") {
          router.push("/admin");
        } else if (user.role === "manager") {
          router.push("/manager/dashboard");
        } else if (user.role === "team") {
          router.push("/team/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        alert("Invalid credentials");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Login failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2>Login</h2>

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

        <button style={styles.button} onClick={handleLogin}>
          Login
        </button>

        <p>
          Don't have an account?{" "}
          <span
            style={styles.link}
            onClick={() => router.push("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
}

const styles: {
  container: CSSProperties;
  box: CSSProperties;
  input: CSSProperties;
  button: CSSProperties;
  link: CSSProperties;
} = {
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
    background: "#222",
    padding: "30px",
    borderRadius: "10px",
    width: "300px",
    textAlign: "center",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "#0070f3",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  link: {
    color: "blue",
    cursor: "pointer",
  },
};