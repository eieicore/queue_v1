import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Ticket } from 'lucide-react';

export default function TicketFormatSettings({ settings, onSave, isSaving }) {
  const [ticketFormat, setTicketFormat] = useState(settings?.ticket_format || {
    new_patient_prefix: 'N',
    returning_patient_prefix: 'R',
    appointment_prefix: 'A'
  });

  const handleSave = () => {
    onSave({
      ...settings,
      ticket_format: ticketFormat
    });
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-600" />
          ตั้งค่ารูปแบบบัตรคิว
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="new-prefix">รหัสผู้ป่วยใหม่</Label>
            <Input
              id="new-prefix"
              value={ticketFormat.new_patient_prefix}
              onChange={(e) => setTicketFormat({
                ...ticketFormat,
                new_patient_prefix: e.target.value.toUpperCase()
              })}
              maxLength={1}
              className="text-center text-lg font-bold"
            />
            <p className="text-sm text-slate-500">ตัวอย่าง: {ticketFormat.new_patient_prefix}001</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returning-prefix">รหัสผู้ป่วยเก่า</Label>
            <Input
              id="returning-prefix"
              value={ticketFormat.returning_patient_prefix}
              onChange={(e) => setTicketFormat({
                ...ticketFormat,
                returning_patient_prefix: e.target.value.toUpperCase()
              })}
              maxLength={1}
              className="text-center text-lg font-bold"
            />
            <p className="text-sm text-slate-500">ตัวอย่าง: {ticketFormat.returning_patient_prefix}001</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appointment-prefix">รหัสผู้ป่วยนัดหมาย</Label>
            <Input
              id="appointment-prefix"
              value={ticketFormat.appointment_prefix}
              onChange={(e) => setTicketFormat({
                ...ticketFormat,
                appointment_prefix: e.target.value.toUpperCase()
              })}
              maxLength={1}
              className="text-center text-lg font-bold"
            />
            <p className="text-sm text-slate-500">ตัวอย่าง: {ticketFormat.appointment_prefix}001</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-2">ตัวอย่างรูปแบบบัตรคิว:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded font-bold">
                A{ticketFormat.new_patient_prefix}001
              </div>
              <p className="text-slate-600 mt-1">ห้อง A - ผู้ป่วยใหม่</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded font-bold">
                B{ticketFormat.returning_patient_prefix}001
              </div>
              <p className="text-slate-600 mt-1">ห้อง B - ผู้ป่วยเก่า</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 text-green-800 px-3 py-2 rounded font-bold">
                C{ticketFormat.appointment_prefix}001
              </div>
              <p className="text-slate-600 mt-1">ห้อง C - นัดหมาย</p>
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