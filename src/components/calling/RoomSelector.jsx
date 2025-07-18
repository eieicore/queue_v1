import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin } from "lucide-react";

export default function RoomSelector({ rooms, selectedRoom, setSelectedRoom, selectedLanguage }) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoomDisplayName = (room) => {
    const languageName = room.room_names && room.room_names[selectedLanguage] 
      ? room.room_names[selectedLanguage] 
      : room.room_name;
    
    return `${languageName} (${room.department})`;
  };

  const handleValueChange = (value) => {
    setSelectedRoom(value);
    setIsOpen(false);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          เลือกห้อง
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <MapPin className="w-5 h-5 text-slate-400" />
          <Select 
            value={selectedRoom} 
            onValueChange={handleValueChange}
            open={isOpen}
            onOpenChange={setIsOpen}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกห้องที่จะจัดการคิว" />
            </SelectTrigger>
            <SelectContent>
              {rooms.filter(room => room.is_active).map((room) => (
                <SelectItem key={room.id} value={room.room_code}>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">{room.room_code}</span>
                    <span>{getRoomDisplayName(room)}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}