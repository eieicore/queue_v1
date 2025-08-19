import React, { useState, useEffect, useRef, useContext } from "react";
import { Queue, Room } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ArrowRight, AlertCircle } from "lucide-react";

import LoginGuard from "../components/auth/LoginGuard";
import PermissionGuard from "../components/auth/PermissionGuard";
import QueueControls from "../components/calling/QueueControls";
import CurrentQueue from "../components/calling/CurrentQueue";
import WaitingList from "../components/calling/WaitingList";
import RoomSelector from "../components/calling/RoomSelector";
import PausedQueues from "../components/calling/PausedQueues";
import LanguageSelector from "../components/calling/LanguageSelector";
import { LanguageContext } from './index.jsx';

const LANGUAGE_VOICES = {
  'th': { name: 'ภาษาไทย', code: 'th-TH' },
  'en': { name: 'English', code: 'en-US' },
  'zh': { name: '中文', code: 'zh-CN' }
};

function QueueCallingContent() {
  const [queues, setQueues] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [currentQueue, setCurrentQueue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastAction, setLastAction] = useState(null);
  const { selectedLanguage, setSelectedLanguage } = useContext(LanguageContext);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isCallingQueue, setIsCallingQueue] = useState(false);
  const [currentQueueNumber, setCurrentQueueNumber] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [transferDestination, setTransferDestination] = useState(null);
  const announcingRef = useRef(false); // ป้องกันการประกาศซ้อน

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      // refresh เฉพาะ queues (ไม่โหลดห้องใหม่)
      Queue.list('-created_date').then(queuesData => setQueues(queuesData));
    }, 2000); // 2 วินาที
    return () => clearInterval(interval);
  }, []);

  // โหลดข้อมูลเมื่อเปลี่ยนห้อง
  useEffect(() => {
    console.log('Selected room changed to:', selectedRoom);
    if (selectedRoom) {
      loadData();
    } else {
      setCurrentQueue(null);
    }
  }, [selectedRoom]);

  // Clear lastAction after 3 seconds
  useEffect(() => {
    if (lastAction) {
      const timer = setTimeout(() => {
        setLastAction(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastAction]);

  useEffect(() => {
    // Sync selectedLanguage to localStorage for cross-tab/monitor sync
    localStorage.setItem('queue_selected_language', selectedLanguage);
  }, [selectedLanguage]);

  const loadData = async () => {
    try {
      const [queuesData, roomsData] = await Promise.all([
        Queue.list('-created_date'),
        Room.list()
      ]);
      
      // Sort rooms by display_order
      const sortedRooms = roomsData.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      setQueues(queuesData);
      setRooms(sortedRooms); 
      
      if (selectedRoom) {
        console.log('Loading data for room:', selectedRoom);
        // Find all serving queues for the room, pick the earliest called_at
        const servingQueues = queuesData.filter(q => 
          q.room_id === selectedRoom && q.status === 'serving'
        );
        console.log('Serving queues found:', servingQueues.length);
        let current = null;
        if (servingQueues.length > 0) {
          current = servingQueues.reduce((earliest, q) => {
            if (!earliest) return q;
            if (!earliest.called_at || (q.called_at && new Date(q.called_at) < new Date(earliest.called_at))) return q;
            return earliest;
          }, null);
        }
        console.log('Current queue set to:', current?.queue_number || 'null');
        setCurrentQueue(current);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 429) {
        console.log('Rate limit exceeded, will retry in 1 minute');
        // รอ 1 นาทีก่อน retry
        setTimeout(loadData, 60000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const callNextQueue = async () => {
    if (!selectedRoom) return;
    
    const waitingQueues = getWaitingQueues();

    if (waitingQueues.length === 0) {
      setLastAction({ type: 'error', message: 'ไม่มีคิวที่รออยู่ในห้องนี้' });
      return;
    }

    await callSpecificQueue(waitingQueues[0]);
  };

  const callSpecificQueue = async (queue) => {
    if (!queue?.qr_code) {
      console.error('Queue object missing id:', queue);
      setLastAction({ type: 'error', message: 'ไม่พบข้อมูลคิวที่ถูกต้อง' });
      return;
    }

    setIsCallingQueue(true);
    setCurrentQueueNumber(queue.queue_number);

    try {
      await Queue.update(queue.qr_code, {
        status: 'serving',
        called_at: new Date().toISOString()
      });
      
      setLastAction({ 
        type: 'success', 
        message: `เรียกคิว ${queue.queue_number} แล้ว` 
      });
      
      setTimeout(loadData, 500); // Wait 500ms before reload to ensure Supabase update
    } catch (error) {
      setLastAction({ type: 'error', message: 'ไม่สามารถเรียกคิวได้' });
    } finally {
      setIsCallingQueue(false);
      setCurrentQueueNumber(null);
    }
  };

  const repeatCall = async () => {
    if (!currentQueue) return;
    await Queue.update(currentQueue.qr_code, {
      called_at: new Date().toISOString()
    });
    setLastAction({ 
      type: 'success', 
      message: `เรียกซ้ำคิว ${currentQueue.queue_number}` 
    });
    loadData();
  };

  const skipQueue = async () => {
    if (!currentQueue) return;
    
    try {
      await Queue.update(currentQueue.qr_code, {
        status: 'skipped'
      });
      
      setLastAction({ 
        type: 'warning', 
        message: `ข้ามคิว ${currentQueue.queue_number} แล้ว` 
      });
      
      loadData();
    } catch (error) {
      setLastAction({ type: 'error', message: 'ไม่สามารถข้ามคิวได้' });
    }
  };

  const pauseQueue = async () => {
    if (!currentQueue) return;
    try {
      await Queue.update(currentQueue.qr_code, { status: 'paused' });
      setLastAction({ type: 'warning', message: `พักคิว ${currentQueue.queue_number} แล้ว` });
      loadData(); // reload ข้อมูลใหม่
    } catch (error) {
      setLastAction({ type: 'error', message: 'ไม่สามารถพักคิวได้' });
    }
  };

  const resumeQueue = async (qrCode) => {
    try {
      await Queue.update(qrCode, {
        status: 'serving',
        called_at: new Date().toISOString(),
        paused_at: null
      });
      const queue = queues.find(q => q.qr_code === qrCode);
      setLastAction({ 
        type: 'success', 
        message: `เรียกคิว ${queue?.queue_number || ''} กลับมาแล้ว` 
      });
      if (queue) {
      }
      loadData();
    } catch (error) {
      setLastAction({ type: 'error', message: 'ไม่สามารถเรียกคิวกลับได้' });
    }
  };

  const completeQueue = async () => {
    if (!currentQueue) return;
    
    try {
      const queueToComplete = { ...currentQueue };
      let history = queueToComplete.room_history || [];

      // Mark final checkout from the last room
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        if (!lastEntry.left_at) { // Only update if not already set
          lastEntry.left_at = new Date().toISOString();
          lastEntry.duration_minutes = Math.round((new Date(lastEntry.left_at).getTime() - new Date(lastEntry.entered_at).getTime()) / 60000);
        }
      }

      await Queue.update(currentQueue.qr_code, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        room_history: history
      });
      
      setLastAction({ 
        type: 'success', 
        message: `เสร็จสิ้นคิว ${currentQueue.queue_number} แล้ว` 
      });
      
      loadData();
    } catch (error) {
      setLastAction({ type: 'error', message: 'ไม่สามารถทำเครื่องหมายเสร็จสิ้นได้' });
    }
  };

  const confirmTransfer = (destinationRoomCode) => {
    const destinationRoom = rooms.find(r => r.room_code === destinationRoomCode);
    setTransferDestination({
      roomCode: destinationRoomCode,
      roomName: destinationRoom?.room_name || destinationRoomCode
    });
  };

  const transferQueue = async () => {
    if (!currentQueue || !transferDestination) return;
    
    try {
      const destinationRoomCode = transferDestination.roomCode;
      const queueToTransfer = { ...currentQueue };
      let history = [...(queueToTransfer.room_history || [])];

      // Mark checkout from the current room in history
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        if (!lastEntry.left_at) {
          lastEntry.left_at = new Date().toISOString();
          lastEntry.duration_minutes = Math.round((new Date(lastEntry.left_at).getTime() - new Date(lastEntry.entered_at).getTime()) / 60000);
        }
      }

      // Add the new room to the history
      const destinationRoom = rooms.find(r => r.room_code === destinationRoomCode);
      history.push({
        room_id: destinationRoomCode,
        room_name: destinationRoom?.room_name || destinationRoomCode,
        entered_at: new Date().toISOString(),
        left_at: null,
        duration_minutes: null
      });

      await Queue.update(currentQueue.qr_code, {
        room_id: destinationRoomCode,
        status: 'waiting',
        called_at: null,
        completed_at: null,
        priority: 1,
        room_history: history
      });
      
      setLastAction({
        type: 'success',
        message: `ส่งต่อคิว ${currentQueue.queue_number} ไปยัง ${transferDestination.roomName} สำเร็จ`
      });
      setCurrentQueue(null);
      setIsTransferring(false);
      setTransferDestination(null);
      // setSelectedRoom(destinationRoomCode); // ไม่เปลี่ยนห้องอัตโนมัติ
      loadData();
    } catch (error) {
      setLastAction({ type: 'error', message: 'ไม่สามารถส่งต่อคิวได้' });
    }
  };

  const getRoomName = (room, language) => {
    if (room && room.room_names && room.room_names[language]) {
      return room.room_names[language];
    }
    return room?.room_name || 'ห้องที่กำหนด';
  };

  const getWaitingQueues = () => {
    const triagePriority = {
      'resuscitation': 5, // Highest
      'emergency': 4,
      'urgent': 3,
      'less_urgent': 2,
      'non_urgent': 1 // Lowest
    };

    return queues.filter(q => 
      q.room_id === selectedRoom && q.status === 'waiting'
    ).sort((a, b) => {
      const priorityA = triagePriority[a.triage_level] || 1;
      const priorityB = triagePriority[b.triage_level] || 1;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Sort by triage level descending
      }
      // If triage level is the same, sort by created date ascending
      return new Date(a.created_date) - new Date(b.created_date);
    });
  };

  const getPausedQueues = () => {
    return queues.filter(q => 
      q.room_id === selectedRoom && q.status === 'paused'
    );
  };



  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">ระบบเรียกคิว</h1>
          <p className="text-slate-600">จัดการและเรียกคิวผู้ป่วยอย่างมีประสิทธิภาพ</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <RoomSelector 
              rooms={rooms}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              selectedLanguage={selectedLanguage}
            />
          </div>
          <div className="md:w-64">
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              languages={LANGUAGE_VOICES}
            />
          </div>
        </div>

        {lastAction && (
          <Alert variant={lastAction.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{lastAction.message}</AlertDescription>
          </Alert>
        )}

        {selectedRoom && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* ปุ่มควบคุมคิวอยู่ด้านบน */}
              <QueueControls 
                onCallNext={callNextQueue}
                onRepeatCall={repeatCall}
                onSkip={() => setPendingAction('skip')}
                onPause={() => setPendingAction('pause')}
                onComplete={() => setPendingAction('complete')}
                onTransfer={() => setIsTransferring(true)}
                hasCurrentQueue={!!currentQueue}
                hasWaitingQueues={getWaitingQueues().length > 0}
                isCallingQueue={isCallingQueue}
                simple
              />
              {/* กำลังให้บริการอยู่ด้านล่าง */}
              <CurrentQueue 
                currentQueue={currentQueue}
                selectedRoom={selectedRoom}
                rooms={rooms}
                selectedLanguage={selectedLanguage}
              />
            </div>

            <div className="space-y-6 h-auto">
              <WaitingList 
                waitingQueues={getWaitingQueues()} 
                selectedRoom={selectedRoom} 
                rooms={rooms}
                selectedLanguage={selectedLanguage}
                onCallQueue={callSpecificQueue}
                isCalling={isCallingQueue}
                currentQueueNumber={currentQueueNumber}
                hasCurrentQueue={!!currentQueue}
              />
             
          </div>
          <div className="h-auto">
          <PausedQueues 
                pausedQueues={getPausedQueues()}
                onResume={resumeQueue}
                selectedRoom={selectedRoom}
                rooms={rooms}
                selectedLanguage={selectedLanguage}
                hasCurrentQueue={!!currentQueue}
              />
            </div>
          </div>
        )}

        <Dialog open={isTransferring} onOpenChange={(open) => {
          if (!open) setIsTransferring(false);
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ส่งต่อคิว {currentQueue?.queue_number}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4 text-slate-600">เลือกห้องที่ต้องการส่งต่อไป:</p>
              <div className="grid gap-2 max-h-96 overflow-y-auto pr-1">
                {rooms
                  .filter(r => r.room_code !== selectedRoom && r.is_active)
                  .map(room => (
                    <Button
                      key={room.id}
                      variant="outline"
                      className="h-auto justify-start p-4 hover:bg-blue-50"
                      onClick={() => confirmTransfer(room.room_code)}
                    >
                      <div className="flex-1 text-left">
                        <p className="font-semibold">{room.room_name}</p>
                        <p className="text-sm text-slate-500">{room.department}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ))}
              </div>
              
              {transferDestination && (
                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">ยืนยันการส่งต่อคิว</h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>คุณต้องการส่งคิว {currentQueue?.queue_number} ไปยัง {transferDestination.roomName} ใช่หรือไม่?</p>
                      </div>
                      <div className="mt-4 flex space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setTransferDestination(null)}
                        >
                          ยกเลิก
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={transferQueue}
                        >
                          ยืนยันส่งต่อ
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={!!pendingAction} onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                {pendingAction === 'callNext' && 'ยืนยันการเรียกคิวถัดไป'}
                {pendingAction === 'skip' && 'ยืนยันการข้ามคิว'}
                {pendingAction === 'pause' && 'ยืนยันการพักคิว'}
                {pendingAction === 'complete' && 'ยืนยันการเสร็จสิ้นคิว'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700">
                {pendingAction === 'callNext' && 'คุณแน่ใจหรือไม่ที่ต้องการเรียกคิวถัดไป?'}
                {pendingAction === 'skip' && 'คุณแน่ใจหรือไม่ที่ต้องการข้ามคิวนี้?'}
                {pendingAction === 'pause' && 'คุณแน่ใจหรือไม่ที่ต้องการพักคิวนี้?'}
                {pendingAction === 'complete' && 'คุณแน่ใจหรือไม่ที่ต้องการปิดการทำงานของคิวนี้?'}
              </p>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setPendingAction(null)}
                className="mr-2"
              >
                ยกเลิก
              </Button>
              <Button 
                variant="destructive"
                onClick={async () => {
                  try {
                    if (pendingAction === 'callNext') await callNextQueue();
                    else if (pendingAction === 'skip') await skipQueue();
                    else if (pendingAction === 'pause') await pauseQueue();
                    else if (pendingAction === 'complete') await completeQueue();
                    setPendingAction(null); // Close dialog after action completes
                  } catch (error) {
                    console.error('Error processing action:', error);
                  }
                }}
                disabled={isCallingQueue}
              >
                {isCallingQueue ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function QueueCalling() {
  return (
    <LoginGuard>
      <PermissionGuard requiredLevel="staff">
        <QueueCallingContent />
      </PermissionGuard>
    </LoginGuard>
  );
}
