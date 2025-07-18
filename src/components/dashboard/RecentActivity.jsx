import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusColors = {
  waiting: "bg-blue-100 text-blue-800",
  called: "bg-yellow-100 text-yellow-800",
  serving: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  skipped: "bg-red-100 text-red-800"
};

export default function RecentActivity({ queues, isLoading }) {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
  };

  const getStatusMessage = (queue) => {
    switch (queue.status) {
      case 'waiting':
        return 'Joined the queue';
      case 'called':
        return 'Called to room';
      case 'serving':
        return 'Being served';
      case 'completed':
        return 'Service completed';
      case 'skipped':
        return 'Queue skipped';
      default:
        return 'Status updated';
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {queues.map((queue) => (
                <div key={queue.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {queue.queue_number.slice(-2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900">
                        {queue.queue_number}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={statusColors[queue.status]}
                      >
                        {queue.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{getStatusMessage(queue)}</span>
                      <span>Room {queue.room_id}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    {formatTime(queue.created_date)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}