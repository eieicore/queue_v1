import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, User, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RoomActivity({ rooms, queues, isLoading }) {
  const getRoomStats = (roomCode) => {
    const roomQueues = queues.filter(q => q.room_id === roomCode);
    const todayQueues = roomQueues.filter(q => 
      q.created_date && q.created_date.startsWith(new Date().toISOString().split('T')[0])
    );
    
    return {
      waiting: todayQueues.filter(q => q.status === 'waiting').length,
      serving: todayQueues.filter(q => q.status === 'serving').length,
      completed: todayQueues.filter(q => q.status === 'completed').length,
      current: roomQueues.find(q => q.status === 'serving')?.queue_number || null
    };
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          Room Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {rooms.map((room) => {
                const stats = getRoomStats(room.room_code);
                return (
                  <div key={room.id} className="p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-slate-900">{room.room_name}</h3>
                        <p className="text-sm text-slate-500">{room.department}</p>
                      </div>
                      <Badge 
                        variant={room.is_active ? "default" : "secondary"}
                        className={room.is_active ? "bg-green-500" : ""}
                      >
                        {room.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    {stats.current && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-md">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-blue-600" />
                          <span className="text-blue-700 font-medium">
                            Currently serving: {stats.current}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Waiting: {stats.waiting}
                      </div>
                      <div>Completed: {stats.completed}</div>
                    </div>
                    
                    {room.staff_assigned && (
                      <div className="mt-2 text-xs text-slate-500">
                        Staff: {room.staff_assigned}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}