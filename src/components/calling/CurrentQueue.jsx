
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Clock, MapPin, Phone } from "lucide-react";

const patientTypeColors = {
  new: "bg-purple-100 text-purple-800",
  returning: "bg-indigo-100 text-indigo-800",
  appointment: "bg-emerald-100 text-emerald-800"
};

export default function CurrentQueue({ currentQueue, selectedRoom, rooms, selectedLanguage }) {
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
    try {
      console.log("dateString", dateString);
      
      // ✅ เพิ่ม 'Z' บอกว่าเป็น UTC
      const date = new Date(dateString.endsWith("Z") ? dateString : dateString + "Z");
  
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return "";
      }
  
      return date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Bangkok",
      });
    } catch (err) {
      console.error("Error formatting time:", err);
      return "";
    }
  };
  
  
  const getServiceDuration = () => {
    if (!currentQueue?.called_at) return 0;
    const end = currentQueue?.completed_at ? new Date(currentQueue.completed_at) : new Date(currentTime);
    const called = new Date(currentQueue.called_at);
    return Math.floor((end - called) / 60000);
  };

  const getPatientTypeLabel = (type) => {
    const labels = {
      new: 'ผู้ป่วยใหม่',
      returning: 'ผู้ป่วยเก่า',
      appointment: 'นัดหมาย'
    };
    return labels[type] || type;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          กำลังให้บริการ
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {currentQueue ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white font-bold text-3xl break-all text-center leading-tight p-2">
                  {currentQueue.queue_number}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`${patientTypeColors[currentQueue.patient_type]} text-sm`}
              >
                {getPatientTypeLabel(currentQueue.patient_type)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-slate-500">ห้อง</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-medium block">
                      {getRoomName(selectedRoomData, selectedLanguage)}
                    </span>
                    {selectedRoomData?.room_names && selectedRoomData.room_names[selectedLanguage] && (
                      <span className="text-xs text-slate-500">
                        ({selectedRoomData.room_name})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">เรียกเมื่อ</p>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{formatTime(currentQueue.called_at)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">ระยะเวลาให้บริการ</p>
                <span className="font-medium text-blue-600">{getServiceDuration()} นาที</span>
              </div>
              {currentQueue.patient_id && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">รหัสผู้ป่วย</p>
                  <span className="font-medium">{currentQueue.patient_id}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                ประกาศเสียงภาษา: {selectedLanguage === 'th' ? 'ไทย' : 
                                  selectedLanguage === 'en' ? 'English' :
                                  '中文'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">ไม่มีผู้ป่วยที่กำลังให้บริการ</p>
            <p className="text-slate-400 text-sm mt-2">
              {selectedRoom ? 'เรียกคิวถัดไปเพื่อเริ่มต้น' : 'เลือกห้องก่อน'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
