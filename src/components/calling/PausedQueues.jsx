import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pause, Play, Clock } from "lucide-react";

const patientTypeColors = {
  new: "bg-purple-100 text-purple-800",
  returning: "bg-indigo-100 text-indigo-800",
  appointment: "bg-emerald-100 text-emerald-800"
};

export default function PausedQueues({ 
  pausedQueues, 
  onResume, 
  selectedRoom, 
  rooms, 
  selectedLanguage, 
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
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
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
            <Pause className="w-5 h-5 text-orange-600" />
            คิวที่พัก
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {pausedQueues.length} คิว
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          {pausedQueues.length > 0 ? (
            <div className="p-4 space-y-3">
              {pausedQueues.map((queue) => (
                <div key={queue.id} className="p-3 border border-orange-100 rounded-lg bg-orange-50/50 hover:bg-orange-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {queue.queue_number.slice(-2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{queue.queue_number}</p>
                        <Badge 
                          variant="outline" 
                          className={`${patientTypeColors[queue.patient_type]} text-xs`}
                        >
                          {getPatientTypeLabel(queue.patient_type)}
                        </Badge>
                      </div>
                    </div>
                    <div className="relative group">
                      <Button
                        onClick={() => onResume(queue.qr_code)}
                        size="sm"
                        disabled={hasCurrentQueue}
                        className={`${hasCurrentQueue ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white`}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        เรียกกลับ
                      </Button>
                      {hasCurrentQueue && (
                        <div className="absolute z-10 invisible group-hover:visible w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                          กรุณาจบการให้บริการคิวปัจจุบันก่อน
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      พักเมื่อ: {(() => {
                        const pausedAt = queue.paused_at || queue.updated_at || queue.created_date;
                        const date = new Date(pausedAt);
                        if (isNaN(date.getTime())) return '-';
                        const diff = Math.floor((currentTime - date.getTime()) / 60000);
                        return `${diff} นาทีที่แล้ว (${formatTime(pausedAt)})`;
                      })()}
                    </div>
                  </div>
                  {queue.patient_id && (
                    <div className="text-xs text-slate-500 mt-1">
                      รหัสผู้ป่วย: {queue.patient_id}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Pause className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>ไม่มีคิวที่พักสำหรับ {getRoomName(selectedRoomData, selectedLanguage)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}