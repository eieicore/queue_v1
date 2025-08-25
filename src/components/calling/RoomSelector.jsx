import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin } from "lucide-react";

export default function RoomSelector({ rooms, selectedRoom, setSelectedRoom, selectedLanguage, currentUser, isLoading = false }) {
  const [isOpen, setIsOpen] = useState(false);

  const getRoomDisplayName = (room) => {
    const languageName = room.room_names && room.room_names[selectedLanguage] 
      ? room.room_names[selectedLanguage] 
      : room.room_name;
    
    return `${languageName} (${room.department})`;
  };

  const handleValueChange = (value) => {
    // If the value starts with 'room-', it's our fallback format using room.id
    const roomCode = value.startsWith('room-') 
      ? rooms.find(r => `room-${r.id}` === value)?.room_code || value 
      : value;
    setSelectedRoom(roomCode);
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
              <SelectValue placeholder={isLoading ? "กำลังโหลด..." : "เลือกห้องที่จะจัดการคิว"} />
            </SelectTrigger>
            <SelectContent>
              {isLoading && (
                <div className="py-2 px-3 text-sm text-slate-500 flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  กำลังโหลดห้อง...
                </div>
              )}
              {rooms.filter(room => room.is_active).map((room) => {
                // Find the staff member assigned to this room
                const staffMember = currentUser && room.staff_assigned === currentUser.id 
                  ? currentUser
                  : null;
                const staffName = staffMember 
                  ? `${staffMember.full_name} (${staffMember.username})` 
                  : 'ไม่มีผู้ดูแล';
                  
                // Ensure we have a valid value for the SelectItem
                const itemValue = room.room_code || `room-${room.id}`;
                
                return (
                  <SelectItem key={itemValue} value={itemValue}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{room.room_code}</span>
                        <span>{getRoomDisplayName(room)}</span>
                      </div>
                      {/* <div className="text-xs text-slate-500 mt-1">
                        เจ้าหน้าที่: {staffName}
                      </div> */}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}