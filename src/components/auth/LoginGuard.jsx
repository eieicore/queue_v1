import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogIn, Activity, Loader2 } from "lucide-react";

export default function LoginGuard({ children, onLoginSuccess }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await User.login(loginForm.username, loginForm.password);
      const userData = await User.me();
      setUser(userData);
      setIsLoggingIn(false);
      if (onLoginSuccess && userData) {
        onLoginSuccess(userData);
      }
    } catch (error) {
      setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">กำลังตรวจสอบสิทธิ์...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
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
                value={loginForm.username}
                onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                required
                autoFocus
              />
              <input
                className="w-full border rounded px-3 py-2 mb-2"
                type="password"
                placeholder="รหัสผ่าน"
                value={loginForm.password}
                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              {loginError && <div className="text-red-600 text-sm mb-2">{loginError}</div>}
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

  return children;
}