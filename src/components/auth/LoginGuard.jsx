import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Activity, Loader2 } from "lucide-react";
import { User as UserEntity } from "@/api/entities";

export default function LoginGuard({ children }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // ถ้ามี user ใน localStorage ให้ render children
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();
  if (user) return children;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoggingIn(true);

    try {
      const users = await UserEntity.filter({
        username: username,
        password: password
      });

      setIsLoggingIn(false);
      if (users.length > 0) {
        const user = users[0];
        localStorage.setItem("user", JSON.stringify(user));
        window.location.href = "/Dashboard";
      } else {
        setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (error) {
      setIsLoggingIn(false);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">MediQueue</CardTitle>
          <p className="text-slate-600">ระบบจัดการคิวโรงพยาบาล</p>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                กรุณาเข้าสู่ระบบ
              </h3>
              <p className="text-slate-600 text-sm mb-6">
                เพื่อใช้งานระบบจัดการคิวโรงพยาบาล
              </p>
            </div>
            <input
              className="w-full border rounded px-3 py-2 mb-2"
              type="text"
              placeholder="ชื่อผู้ใช้"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
            <input
              className="w-full border rounded px-3 py-2 mb-2"
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  เข้าสู่ระบบ
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}