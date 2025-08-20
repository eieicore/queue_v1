
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
import { Toaster } from '@/components/ui/toaster';

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
      const [settingsData, roomsData, usersResponse] = await Promise.all([
        QueueSettings.list(),
        Room.list(),
        User.list()
      ]);
      
      // Ensure users is an array
      const usersData = Array.isArray(usersResponse) ? usersResponse : [];
      
      // Default settings structure that matches the database schema
      const defaultSettings = {
        ticket_format: {
          new_patient_prefix: 'N',
          returning_patient_prefix: 'R',
          appointment_prefix: 'A'
        },
        voice_announcements: true,
        auto_skip_timeout: 5,
        email_notifications: false,
        working_hours: {
          monday: { open: '08:00', close: '17:00' },
          tuesday: { open: '08:00', close: '17:00' },
          wednesday: { open: '08:00', close: '17:00' },
          thursday: { open: '08:00', close: '17:00' },
          friday: { open: '08:00', close: '17:00' },
          saturday: { open: '08:00', close: '12:00' },
          sunday: { open: '00:00', close: '00:00' }
        },
        actions: 'default'
      };

      // Use the first settings from the database or create default settings
      const currentSettings = settingsData[0] || defaultSettings;
      
      // If we have a default settings ID, we need to create a new record instead of updating
      const isDefaultSettings = currentSettings.id === 'default-settings';
      
      // Ensure all settings fields are present and preserve the ID
      setSettings({
        ...defaultSettings,
        ...currentSettings,
        // Only keep the ID if it's not the default settings ID
        id: isDefaultSettings ? null : currentSettings.id,
        ticket_format: {
          ...defaultSettings.ticket_format,
          ...(currentSettings.ticket_format || {})
        },
        working_hours: {
          ...defaultSettings.working_hours,
          ...(currentSettings.working_hours || {})
        }
      });
      
      setRooms(roomsData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    setIsSaving(true);
    try {
      // Create a clean settings object with only the fields we want to save
      const settingsToSave = {
        ticket_format: newSettings.ticket_format || {},
        voice_announcements: Boolean(newSettings.voice_announcements),
        auto_skip_timeout: Number(newSettings.auto_skip_timeout) || 5,
        email_notifications: Boolean(newSettings.email_notifications),
        working_hours: newSettings.working_hours || {},
        actions: newSettings.actions || 'default'
      };

      let result;
      let savedSettings;
      const isUpdate = settings.id && settings.id !== 'default-settings';
      
      if (isUpdate) {
        console.log('Updating existing settings with ID:', settings.id);
        result = await QueueSettings.update(settings.id, settingsToSave);
      } else {
        console.log('Creating new settings record');
        // If we're creating a new record, make sure to remove the ID
        const { id, ...settingsWithoutId } = settingsToSave;
        result = await QueueSettings.create(settingsWithoutId);
      }
      
      // If we got an array back (which can happen with Supabase), use the first item
      savedSettings = Array.isArray(result) ? result[0] : result;
      
      console.log('Saved settings:', savedSettings);
      
      // Update the settings with the saved data including the ID
      setSettings({
        ...newSettings,
        id: savedSettings.id || settings.id
      });
      
      setMessage('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
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
        // Update existing user
        await User.update(userData.id, userData);
        setMessage('อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว');
      }
      loadData();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving user:', error);
      throw error; // Re-throw to be handled by the component
    }
  };

  const createUser = async (userData) => {
    try {
      const { password, confirmPassword, ...userProfile } = userData;
      
      // Create a new user with email/password
      const { user, error } = await User.signUp({
        ...userData,
        username: userData.username || userData.email.split('@')[0]
      });

      if (error) throw error;
      
      // Refresh the users list
      const usersResponse = await User.list();
      setUsers(Array.isArray(usersResponse) ? usersResponse : []);
      
      setMessage('เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว');
      loadData();
      setTimeout(() => setMessage(''), 3000);
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error; // Re-throw to be handled by the component
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
          <TabsList className="grid w-full grid-cols-3">
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
            {/* <TabsTrigger value="system" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              ตั้งค่าระบบ
            </TabsTrigger> */}
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
              isSaving={isSaving}
            />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement 
              users={users}
              onSave={saveUser}
              onCreate={createUser}
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
        <Toaster />
      </PermissionGuard>
    </LoginGuard>
  );
}
