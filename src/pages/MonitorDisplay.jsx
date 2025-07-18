
import React, { useState, useEffect } from 'react';
import { Queue, Room } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Monitor, Activity, User, Clock, Volume2, Users } from 'lucide-react'; // Added Users icon
import { AnimatePresence, motion } from 'framer-motion';
import { useRef } from 'react';

export default function MonitorDisplay() {
  const [rooms, setRooms] = useState([]);
  const [servingQueues, setServingQueues] = useState([]);
  const [allQueues, setAllQueues] = useState([]); // New state for all queues
  const [recentlyCalled, setRecentlyCalled] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const lastAnnouncedQueue = useRef({}); // เปลี่ยนเป็น object เก็บ queue ต่อห้อง

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000); // 3 วินาที
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  useEffect(() => {
    // ประกาศเสียงสำหรับแต่ละห้องที่มีคิวใหม่ถูกเรียกหรือเรียกซ้ำ (called_at เปลี่ยน)
    servingQueues.forEach((queue) => {
      if (!queue || !queue.queue_number || !queue.room_id) return;
      // ใช้ queue_number + called_at เป็น key
      const announceKey = `${queue.queue_number}:${queue.called_at || ''}`;
      // ประกาศเสียงเฉพาะคิวที่ถูกเรียกใหม่ (ไม่ใช่ตอนเข้า/refresh หน้า)
      if (
        lastAnnouncedQueue.current[queue.room_id] !== announceKey &&
        Object.keys(lastAnnouncedQueue.current).length !== 0 // ป้องกันประกาศตอนเข้า/refresh หน้า
      ) {
        const room = rooms.find(r => r.room_code === queue.room_id);
        const roomName = room ? (room.room_names?.th || room.room_name || queue.room_id) : queue.room_id;
        const msg = new window.SpeechSynthesisUtterance(`ขอเชิญคิว ${queue.queue_number} เข้ารับบริการที่ ${roomName}`);
        msg.lang = 'th-TH';
        window.speechSynthesis.speak(msg);
        lastAnnouncedQueue.current[queue.room_id] = announceKey;
      }
    });
    // ถ้าห้องไหนไม่มีคิวแล้ว ให้ลบออกจาก lastAnnouncedQueue เพื่อให้ประกาศใหม่ได้เมื่อมีคิวใหม่
    Object.keys(lastAnnouncedQueue.current).forEach(roomId => {
      if (!servingQueues.find(q => q.room_id === roomId)) {
        delete lastAnnouncedQueue.current[roomId];
      }
    });
  }, [servingQueues, rooms]);

  // เมื่อเข้า/refresh ครั้งแรก: mark ทุกคิวที่กำลังให้บริการว่า 'ประกาศแล้ว'
  useEffect(() => {
    if (servingQueues.length > 0 && Object.keys(lastAnnouncedQueue.current).length === 0) {
      servingQueues.forEach(queue => {
        if (queue && queue.queue_number && queue.room_id) {
          const announceKey = `${queue.queue_number}:${queue.called_at || ''}`;
          lastAnnouncedQueue.current[queue.room_id] = announceKey;
        }
      });
    }
    // eslint-disable-next-line
  }, [servingQueues]);

  const loadData = async () => {
    try {
      // ดึงข้อมูลห้อง
      const roomRes = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY'
        }
      });
      const roomsData = await roomRes.json();
      setRooms(roomsData.filter(r => r.is_active));

      // ดึงข้อมูลคิว
      const queueRes = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY'
        }
      });
      const queuesData = await queueRes.json();
      setAllQueues(queuesData);
      // กำลังให้บริการ: status = 'serving' หรือ 'called'
      setServingQueues(queuesData.filter(q => q.status === 'serving' || q.status === 'called'));
    } catch (error) {
      console.error('Error loading rooms/queues:', error);
    }
  };

  const getRoomName = (room, language = 'th') => {
    return room?.room_names?.[language] || room?.room_name || 'Unknown Room';
  };

  const getQueueForRoom = (roomCode) => {
    return servingQueues.find(q => q.room_id === roomCode);
  };

  const getWaitingCount = (roomCode) => { // New function to get waiting count per room
    return allQueues.filter(q => q.room_id === roomCode && q.status === 'waiting').length;
  };

  const getServiceDurationText = (calledAt) => {
    if (!calledAt) return '';
    const serviceDurationMinutes = Math.floor((new Date() - new Date(calledAt)) / 60000);

    if (serviceDurationMinutes < 0) return '0 นาที';

    if (serviceDurationMinutes < 60) {
        return `${serviceDurationMinutes} นาที`;
    } else {
        const hours = Math.floor(serviceDurationMinutes / 60);
        const minutes = serviceDurationMinutes % 60;
        return `${hours} ชม. ${minutes} นาที`;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white font-sans overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 p-8 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                <Activity className="w-3 h-3 text-green-900" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent tracking-wide">
                Queue Monitor
              </h1>
              <p className="text-blue-200 text-xl mt-2">แสดงสถานะคิวแบบเรียลไทม์</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-white mb-2">
              {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
            </div>
            <div className="text-blue-200 text-lg">
              {currentTime.toLocaleDateString('th-TH-u-ca-buddhist', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Grid */}
      <main className="relative z-10 p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map(room => {
            const queue = getQueueForRoom(room.room_code);
            const waitingCount = getWaitingCount(room.room_code);
            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-3xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                <div className="relative flex flex-col h-full bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 hover:bg-white/15 transition-all duration-300 shadow-2xl">
                  
                  {/* Room Header */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/20">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {room.room_code}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-white mb-1">
                          {getRoomName(room, 'th')}
                        </h3>
                        <p className="text-blue-200 text-sm">
                          {getRoomName(room, 'en')}
                        </p>
                        <Badge variant="outline" className="mt-2 border-white/30 text-white/80">
                          {room.department}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Queue Status */}
                  <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <AnimatePresence mode="wait">
                      {queue ? (
                        <motion.div
                          key={queue.id}
                          initial={{ opacity: 0, y: 30, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -30, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="w-full"
                        >
                          {/* Status Indicator */}
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-green-300 text-sm font-medium">กำลังให้บริการ</span>
                          </div>
                          {/* Queue Number */}
                          <div className="text-5xl font-extrabold text-yellow-300 drop-shadow mb-4">
                              {queue.queue_number}
                          </div>

                          {/* Service Duration */}
                          <div className="flex items-center justify-center gap-2 text-white/80 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>
                              {getServiceDurationText(queue.called_at)}
                            </span>
                          </div>

                          {/* Patient Type Badge */}
                          <div className="mt-3">
                            <Badge 
                              className={`${queue.patient_type === 'new' ? 'bg-blue-500/20 text-blue-200' : 
                                         queue.patient_type === 'returning' ? 'bg-green-500/20 text-green-200' : 
                                         'bg-purple-500/20 text-purple-200'} border-0`}
                            >
                              {queue.patient_type === 'new' ? 'ผู้ป่วยใหม่' : 
                               queue.patient_type === 'returning' ? 'ผู้ป่วยเก่า' : 'นัดหมาย'}
                            </Badge>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="waiting"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center text-white/60"
                        >
                          <User className="w-16 h-16 mx-auto mb-4 opacity-40"/>
                          <p className="text-lg">รอเรียกคิว</p>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse animation-delay-200"></div>
                            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse animation-delay-400"></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer Section */}
                  <div className='flex-shrink-0'>
                    {/* Waiting Count for this room */}
                    <div className="mt-4 pt-4 border-t border-white/20 text-center">
                      <div className="flex items-center justify-center gap-2 text-white/80">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">คิวที่รอ: </span>
                        <span className="font-bold text-lg text-yellow-300">{waitingCount}</span>
                        <span className="text-sm">คิว</span>
                      </div>
                    </div>

                    {/* Staff Info */}
                    {room.staff_assigned && (
                      <div className="mt-2 text-center">
                        <p className="text-white/60 text-sm">เจ้าหน้าที่ประจำ</p>
                        <p className="text-white font-medium">{room.staff_assigned}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80">ระบบออนไลน์</span>
            </div>
            <div className="text-white/60 text-sm">
              อัปเดตล่าสุด: {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
            </div>
          </div>
          <div className="flex items-center gap-6 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>กำลังให้บริการ: {servingQueues.length}</span> {/* Updated text */}
            </div>
            <div className="flex items-center gap-2"> {/* New line for total waiting queues */}
              <Users className="w-4 h-4" />
              <span>รอทั้งหมด: {allQueues.filter(q => q.status === 'waiting').length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              <span>เสียงประกาศ: เปิด</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
