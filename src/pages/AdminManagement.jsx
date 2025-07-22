
import React, { useState, useEffect } from 'react';
import { QueueSettings, Room, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Users, Clock, Volume2, Save, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import LoginGuard from '../components/auth/LoginGuard';
import PermissionGuard from '../components/auth/PermissionGuard';
import TicketFormatSettings from '../components/admin/TicketFormatSettings';
import RoomManagement from '../components/admin/RoomManagement';
import SystemSettings from '../components/admin/SystemSettings';
import UserManagement from '../components/admin/UserManagement';

function AdminManagementContent() {
  const [settings, setSettings] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, roomsData, usersData] = await Promise.all([
        QueueSettings.list(),
        Room.list(),
        User.list()
      ]);
      
      setSettings(settingsData[0] || {
        ticket_format: {
          new_patient_prefix: 'N',
          returning_patient_prefix: 'R',
          appointment_prefix: 'A'
        },
        voice_announcements: true,
        auto_skip_timeout: 5,
        email_notifications: true,
        working_hours: {
          start_time: '08:00',
          end_time: '17:00'
        }
      });
      
      setRooms(roomsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    setIsSaving(true);
    try {
      if (settings.id) {
        await QueueSettings.update(settings.id, newSettings);
      } else {
        await QueueSettings.create(newSettings);
      }
      
      setSettings(newSettings);
      setMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการบันทึก');
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const saveRoom = async (roomData) => {
    try {
      // ตรวจสอบว่า room_code นี้มีอยู่ใน rooms แล้วหรือไม่
      const isEdit = rooms.some(r => r.room_code === roomData.room_code);
      if (isEdit) {
        await Room.update(roomData.room_code, roomData);
      } else {
        await Room.create(roomData);
      }
      loadData();
      setMessage('บันทึกข้อมูลห้องเรียบร้อยแล้ว');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูลห้อง');
      console.error('Error saving room:', error);
    }
  };

  // ฟังก์ชันลบห้อง
  const deleteRoom = async (roomCode) => {
    await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms?room_code=eq.${roomCode}`, {
      method: "DELETE",
      headers: {
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY",
        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY"
      }
    });
    loadData();
  };

  const saveUser = async (userData) => {
    try {
      if (userData.id) {
        await User.update(userData.id, userData);
      } else {
        // Note: Cannot create users directly, only update existing ones
        setMessage('ไม่สามารถสร้างผู้ใช้ใหม่ได้ กรุณาใช้ระบบเชิญผู้ใช้');
      }
      loadData();
      setMessage('บันทึกข้อมูลผู้ใช้เรียบร้อยแล้ว');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูลผู้ใช้');
      console.error('Error saving user:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">จัดการระบบ</h1>
          <p className="text-slate-600">ตั้งค่าและจัดการระบบคิวโรงพยาบาล</p>
        </div>

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="ticket-format" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ticket-format" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              รูปแบบบัตร
            </TabsTrigger>
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              จัดการห้อง
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              จัดการผู้ใช้
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              ตั้งค่าระบบ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ticket-format">
            <TicketFormatSettings 
              settings={settings}
              onSave={saveSettings}
              isSaving={isSaving}
            />
          </TabsContent>

          <TabsContent value="rooms">
            <RoomManagement 
              rooms={rooms}
              onSave={saveRoom}
              onDelete={deleteRoom}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement 
              users={users}
              onSave={saveUser}
            />
          </TabsContent>

          <TabsContent value="system">
            <SystemSettings 
              settings={settings}
              onSave={saveSettings}
              isSaving={isSaving}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function AdminManagement() {
  return (
    <LoginGuard>
      <PermissionGuard requiredLevel="admin">
        <AdminManagementContent />
      </PermissionGuard>
    </LoginGuard>
  );
}
