import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Volume2, Mail, Clock, Save } from 'lucide-react';

export default function SystemSettings({ settings, onSave, isSaving }) {
  const [systemSettings, setSystemSettings] = useState({
    voice_announcements: settings?.voice_announcements || true,
    auto_skip_timeout: settings?.auto_skip_timeout || 5,
    email_notifications: settings?.email_notifications || true,
    working_hours: settings?.working_hours || {
      start_time: '08:00',
      end_time: '17:00'
    }
  });

  const handleSave = () => {
    onSave({
      ...settings,
      ...systemSettings
    });
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          ตั้งค่าระบบ
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Voice Announcements */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-slate-600" />
            <div>
              <h4 className="font-medium text-slate-900">การประกาศเสียง</h4>
              <p className="text-sm text-slate-500">เปิด/ปิดการประกาศเสียงเรียกคิว</p>
            </div>
          </div>
          <Switch
            checked={systemSettings.voice_announcements}
            onCheckedChange={(checked) => setSystemSettings({
              ...systemSettings,
              voice_announcements: checked
            })}
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-slate-600" />
            <div>
              <h4 className="font-medium text-slate-900">การแจ้งเตือนอีเมล</h4>
              <p className="text-sm text-slate-500">ส่งอีเมลแจ้งเตือนให้ผู้ป่วย</p>
            </div>
          </div>
          <Switch
            checked={systemSettings.email_notifications}
            onCheckedChange={(checked) => setSystemSettings({
              ...systemSettings,
              email_notifications: checked
            })}
          />
        </div>

        {/* Auto Skip Timeout */}
        <div className="space-y-2">
          <Label htmlFor="skip-timeout">เวลาข้ามคิวอัตโนมัติ (นาที)</Label>
          <Input
            id="skip-timeout"
            type="number"
            min="1"
            max="30"
            value={systemSettings.auto_skip_timeout}
            onChange={(e) => setSystemSettings({
              ...systemSettings,
              auto_skip_timeout: parseInt(e.target.value)
            })}
          />
          <p className="text-sm text-slate-500">
            หากผู้ป่วยไม่มาภายในเวลาที่กำหนด ระบบจะข้ามคิวอัตโนมัติ
          </p>
        </div>

        {/* Working Hours */}
        <div className="space-y-4">
          <h4 className="font-medium text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            เวลาทำการ
          </h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">เวลาเปิดบริการ</Label>
              <Input
                id="start-time"
                type="time"
                value={systemSettings.working_hours.start_time}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  working_hours: {
                    ...systemSettings.working_hours,
                    start_time: e.target.value
                  }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">เวลาปิดบริการ</Label>
              <Input
                id="end-time"
                type="time"
                value={systemSettings.working_hours.end_time}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  working_hours: {
                    ...systemSettings.working_hours,
                    end_time: e.target.value
                  }
                })}
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              บันทึกการตั้งค่า
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}