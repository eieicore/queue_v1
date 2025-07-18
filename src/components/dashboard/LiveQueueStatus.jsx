import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const statusColors = {
  waiting: "bg-blue-100 text-blue-800 border-blue-200",
  called: "bg-yellow-100 text-yellow-800 border-yellow-200",
  serving: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  skipped: "bg-red-100 text-red-800 border-red-200"
};

const patientTypeColors = {
  new: "bg-purple-100 text-purple-800",
  returning: "bg-indigo-100 text-indigo-800",
  appointment: "bg-emerald-100 text-emerald-800"
};

export default function LiveQueueStatus({ queues, isLoading }) {
  const activeQueues = queues.filter(q => 
    ['waiting', 'called', 'serving'].includes(q.status)
  );

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Bangkok'
    });
  };

  const getWaitTime = (createdDate) => {
    const now = new Date();
    const created = new Date(createdDate);
    const diffMinutes = Math.floor((now - created) / 60000);
    return diffMinutes;
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live Queue Status
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <AnimatePresence>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeQueues.length > 0 ? (
              activeQueues.map((queue) => (
                <motion.div
                  key={queue.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                        {queue.queue_number}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="secondary" 
                            className={statusColors[queue.status]}
                          >
                            {queue.status.charAt(0).toUpperCase() + queue.status.slice(1)}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={patientTypeColors[queue.patient_type]}
                          >
                            {queue.patient_type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {queue.room_id}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(queue.created_date)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-900">
                        Wait: {getWaitTime(queue.created_date)} min
                      </div>
                      {queue.patient_id && (
                        <div className="text-xs text-slate-500">
                          ID: {queue.patient_id}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No active queues at the moment</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}