
import React, { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    // เรียก Supabase REST API (เปลี่ยน URL และ API KEY ให้ตรงกับโปรเจกต์ของคุณ)
    const res = await fetch(
      `https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/user?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}`,
      {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY"
        }
      }
    );
    const users = await res.json();
    if (users.length > 0) {
      // พบ user
      const user = users[0];
      // ไม่เก็บ password ใน localStorage
      const { password, ...userData } = user;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      // สามารถ redirect หรือ reload ได้ตามต้องการ
      // window.location.reload();
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
