
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, AlertTriangle } from "lucide-react";

const patientTypeColors = {
  new: "bg-purple-100 text-purple-800",
  returning: "bg-indigo-100 text-indigo-800",
  appointment: "bg-emerald-100 text-emerald-800"
};

const triageStyles = {
  resuscitation: { label: 'วิกฤต (แดง)', color: 'bg-red-500 text-white' },
  emergency: { label: 'ฉุกเฉิน (ส้ม)', color: 'bg-orange-500 text-white' },
  urgent: { label: 'ด่วน (เหลือง)', color: 'bg-yellow-400 text-yellow-900' },
  less_urgent: { label: 'ด่วนน้อย (เขียว)', color: 'bg-green-500 text-white' },
  non_urgent: { label: 'ทั่วไป (ขาว)', color: 'bg-slate-200 text-slate-800' }
};

export default function WaitingList({ 
  waitingQueues, 
  selectedRoom, 
  rooms, 
  selectedLanguage, 
  onCallQueue, 
  isCalling = false,
  currentQueueNumber = null 
}) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  const selectedRoomData = rooms.find(r => r.room_code === selectedRoom);

  const getRoomName = (room, language) => {
    if (room && room.room_names && room.room_names[language]) {
      return room.room_names[language];
    }
    return room?.room_name || 'ห้องที่กำหนด';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
  };

  const getWaitTime = (createdDate) => {
    if (!createdDate) return '-';
    const created = new Date(createdDate);
    if (isNaN(created.getTime())) return '-';
    const now = new Date(currentTime);
    return Math.floor((now - created) / 60000);
  };

  const getPatientTypeLabel = (type) => {
    const labels = {
      new: 'ใหม่',
      returning: 'เก่า',
      appointment: 'นัด'
    };
    return labels[type] || type;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            รายการรอคิว
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {waitingQueues.length} คิว
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-13">
        <div className="max-h-96 overflow-y-auto">
          {waitingQueues.length > 0 ? (
            <div className="space-y-6">
              {waitingQueues.map((queue, index) => {
                const triageInfo = triageStyles[queue.triage_level] || triageStyles['non_urgent'];
                return (
                  <div key={queue.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${triageInfo.color} rounded-lg flex items-center justify-center font-bold`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-slate-900">{queue.queue_number}</p>
                            <Badge
                              variant="outline"
                              className={`${patientTypeColors[queue.patient_type]} text-xs`}
                            >
                              {getPatientTypeLabel(queue.patient_type)}
                            </Badge>
                          </div>
                          {/* <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onCallQueue(queue);
                            }}
                            disabled={isCalling && currentQueueNumber === queue.queue_number}
                            className={`ml-2 px-3 py-1 text-sm rounded-md transition-colors ${
                              isCalling && currentQueueNumber === queue.queue_number 
                                ? 'bg-blue-400 text-white cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {isCalling && currentQueueNumber === queue.queue_number ? 'กำลังเรียก...' : 'เรียกคิว'}
                          </button> */}
                        </div>
                      </div>
                      <Badge className={triageInfo.color}>{triageInfo.label}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        รอ: {getWaitTime(queue.created_date) === '-' ? '-' : `${getWaitTime(queue.created_date)} นาที`}
                      </div>
                      <div>{formatTime(queue.created_date)}</div>
                    </div>
                    {queue.patient_id && (
                      <div className="text-xs text-slate-500 mt-1">
                        รหัส: {queue.patient_id}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>ไม่มีคิวรอสำหรับ {getRoomName(rooms.find(r => r.room_code === selectedRoom), selectedLanguage)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
