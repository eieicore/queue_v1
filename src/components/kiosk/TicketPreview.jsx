import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Calendar } from 'lucide-react';

const patientTypeLabels = {
  new: 'ผู้ป่วยใหม่',
  returning: 'ผู้ป่วยเก่า',
  appointment: 'ผู้ป่วยนัดหมาย'
};

const patientTypeColors = {
  new: 'bg-purple-100 text-purple-800',
  returning: 'bg-blue-100 text-blue-800',
  appointment: 'bg-green-100 text-green-800'
};

export default function TicketPreview({ ticket }) {
  // ป้องกัน null
  if (!ticket) return <div className="text-center text-red-500">ไม่พบข้อมูลคิว</div>;

  // ข้อมูลห้องและวันที่
  const room = ticket.room_history?.[0] || {};
  const roomName = room.room_name || ticket.room_name || '-';
  const department = ticket.department || '-';

  // วันที่และเวลาเข้าห้อง (ใช้ room.entered_at)
  let dateText = '-';
  let timeText = '-';
  if (room.entered_at) {
    const d = new Date(room.entered_at);
    if (!isNaN(d)) {
      dateText = d.toLocaleDateString('th-TH-u-ca-buddhist', { year: 'numeric', month: 'long', day: 'numeric' });
      timeText = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
    }
  }

  // เวลารอโดยประมาณ
  const estimatedWait = ticket.estimated_wait_time !== undefined && ticket.estimated_wait_time !== null
    ? `${ticket.estimated_wait_time} นาที`
    : '-';

  // ประเภทผู้ป่วย (badge)
  const patientTypeText = patientTypeLabels[ticket.patient_type] || ticket.patient_type || '-';
  const patientTypeColor = patientTypeColors[ticket.patient_type] || 'bg-gray-100 text-gray-800';

  return (
    <Card className="bg-white border-2 border-dashed border-slate-300 shadow-xl max-w-md mx-auto">
      <CardHeader className="text-center border-b border-dashed border-slate-200 bg-slate-50">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">บัตรคิว</h2>
          <p className="text-slate-600">โรงพยาบาล MediQueue</p>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Queue Number */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-bold text-2xl">{ticket.queue_number || '-'}</span>
          </div>
          <Badge className={`${patientTypeColor} text-sm`}>
            {patientTypeText}
          </Badge>
        </div>
        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-400" />
            <div>
              <p className="font-medium text-slate-900">{roomName}</p>
              <p className="text-sm text-slate-500">{department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-400" />
            <div>
              <p className="font-medium text-slate-900">{dateText}</p>
              <p className="text-sm text-slate-500">เวลา: {timeText}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-400" />
            <div>
              <p className="font-medium text-slate-900">เวลารอโดยประมาณ</p>
              <p className="text-sm text-slate-500">{estimatedWait}</p>
            </div>
          </div>
        </div>
        {/* Instructions */}
        <div className="border-t border-dashed border-slate-200 pt-4">
          <p className="text-sm text-slate-600 text-center">
            กรุณาเก็บบัตรนี้ไว้และรอการเรียกคิว<br />
            สแกน QR Code เพื่อติดตามสถานะคิว
          </p>
        </div>
      </CardContent>
    </Card>
  );
}