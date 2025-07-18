
import React, { useState } from "react";

// Mock user data
const users = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    full_name: "admin",
    access_level: "admin"
  },
  {
    id: "2",
    username: "staff",
    password: "staff123",
    full_name: "staff",
    access_level: "staff"
  },
  {
    id: "3",
    username: "user",
    password: "user123",
    full_name: "User",
    access_level: "user"
  }
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const found = users.find(
      (u) => u.username === username && u.password === password
    );
    if (found) {
      setUser(found);
      setError("");
    } else {
      setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setUser(null);
    }
  };

  if (user) {
    return (
      <div style={{ margin: 40 }}>
        <h2>เข้าสู่ระบบสำเร็จ</h2>
        <p>ชื่อ: {user.full_name}</p>
        <p>Access Level: <b>{user.access_level}</b></p>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin} style={{ margin: 40, maxWidth: 300 }}>
      <h2>เข้าสู่ระบบ</h2>
          <div>
        <label>Username</label>
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
                                </div>
                                <div>
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: 10 }}
        />
      </div>
      <button type="submit" style={{ width: "100%" }}>เข้าสู่ระบบ</button>
      {error && <div style={{ color: "red", marginTop: 10 }}>{error}</div>}
    </form>
  );
}
