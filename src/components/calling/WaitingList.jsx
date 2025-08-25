
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
  currentQueueNumber = null,
  hasCurrentQueue = false
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

  // Sort queues by the last entered_at time in room_history (oldest first)
  const sortedQueues = [...waitingQueues].sort((a, b) => {
    const getLastEnteredTime = (queue) => {
      if (!queue.room_history || queue.room_history.length === 0) {
        return new Date(queue.created_date).getTime();
      }
      // Get the last room history entry
      const lastEntry = queue.room_history[queue.room_history.length - 1];
      return new Date(lastEntry.entered_at).getTime();
    };

    const timeA = getLastEnteredTime(a);
    const timeB = getLastEnteredTime(b);
    return timeA - timeB; // Sort in ascending order (oldest first)
  });

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            รายการรอคิว (เรียงตามเวลารอคอย)
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {waitingQueues.length} คิว
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          {sortedQueues.length > 0 ? (
            <div className="p-4 space-y-3">
              {sortedQueues.map((queue, index) => {
                const triageInfo = triageStyles[queue.triage_level] || triageStyles['non_urgent'];
                const waitTime = getWaitTime(queue.created_date);
                const isNewQueue = waitTime < 2;
                const isLongWait = waitTime >= 30;
                const bgColor = isNewQueue 
                  ? 'bg-green-100 border-green-200' 
                  : isLongWait 
                    ? 'bg-red-100 border-red-200' 
                    : 'bg-blue-50 border-blue-100';
                    
                return (
                  <div 
                    key={queue.id} 
                    className={`p-3 border rounded-lg transition-colors ${bgColor} hover:bg-opacity-70`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${triageInfo.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-slate-900">{queue.queue_number}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className={`${patientTypeColors[queue.patient_type]} text-xs`}
                              >
                                {getPatientTypeLabel(queue.patient_type)}
                              </Badge>
                              <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs">
                                {triageInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          {formatTime(queue.created_date)}
                        </p>
                        <div className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          <span>รอ {waitTime} นาที</span>
                        </div>
                      </div>
                    </div>
                    {queue.note && (
                      <div className="mt-2 text-xs text-slate-600 bg-white/50 p-2 rounded border border-slate-100">
                        <span className="font-medium">หมายเหตุ: </span>
                        {queue.note}
                      </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => onCallQueue(queue)}
                        disabled={hasCurrentQueue || (isCalling && currentQueueNumber === queue.queue_number)}
                        className={`px-4 py-2 text-sm rounded-md transition-colors ${
                          hasCurrentQueue || (isCalling && currentQueueNumber === queue.queue_number)
                            ? 'bg-blue-400 text-white cursor-not-allowed' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        } flex items-center`}
                        title={hasCurrentQueue ? 'กรุณาจบการให้บริการคิวปัจจุบันก่อน' : ''}
                      >
                        {isCalling && currentQueueNumber === queue.queue_number ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            กำลังเรียก...
                          </>
                        ) : 'เรียกคิวนี้'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500">
              {selectedRoomData ? (
                <p>ไม่มีคิวที่รออยู่ใน{getRoomName(selectedRoomData, selectedLanguage)}</p>
              ) : (
                <p>กรุณาเลือกห้องเพื่อดูคิวที่รออยู่</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
