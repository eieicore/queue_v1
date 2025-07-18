import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Lock } from "lucide-react";

export default function PermissionGuard({ children, requiredLevel = "staff", allowedRoles = [] }) {
  const [user, setUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      const userLevel = userData.access_level || 'staff';
      const userRole = userData.role || 'user';
      
      // Check access level hierarchy
      const levelHierarchy = {
        'viewer': 1,
        'staff': 2,
        'admin': 3
      };
      
      const requiredLevelValue = levelHierarchy[requiredLevel] || 2;
      const userLevelValue = levelHierarchy[userLevel] || 1;
      
      // Check if user has required level or is in allowed roles
      const hasLevelAccess = userLevelValue >= requiredLevelValue;
      const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole);
      
      setHasPermission(hasLevelAccess && hasRoleAccess);
    } catch (error) {
      console.error('Permission check error:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">ไม่มีสิทธิ์เข้าถึง</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-slate-600 mb-4">
              คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ของระบบ
            </p>
            <div className="text-sm text-slate-500">
              <p>ผู้ใช้: {user?.full_name}</p>
              <p>ระดับสิทธิ์: {user?.access_level || 'staff'}</p>
              <p>ต้องการสิทธิ์: {requiredLevel}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}