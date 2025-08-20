import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Queue, Room, Feedback } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Ticket,
  Users,
  Clock,
  CheckCircle,
  Star,
  Send,
} from "lucide-react";

function SurveyForm({ queue, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // สร้าง timestamp ตาม timezone ไทย
      const now = new Date();
      const tzOffset = 7 * 60; // +07:00
      // const localISO = new Date(now.getTime() - (now.getTimezoneOffset() - tzOffset) * 60000).toISOString().slice(0, 19) + '+07:00';
      const localISO = new Date().toLocaleString("sv-SE", {
        timeZone: "Asia/Bangkok",
      });
      console.log(localISO); // Example: "2025-07-18 11:16:23"

      await Feedback.create({
        queue_id: queue.id || queue.qr_code,
        patient_name: queue.patient_name,
        rating,
        comments,
        room_id: queue.room_id,
        actions: queue.actions || null,
        queue_number: queue.queue_number,
        completed_at: localISO, // Thai timezone ISO
      });
      onSubmitted();
    } catch (error) {
      console.error("Failed to submit survey:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="text-center space-y-6">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
      <h2 className="text-3xl font-bold text-slate-800">รับบริการเสร็จสิ้น</h2>
      <p className="text-slate-600">
        ขอบคุณที่ใช้บริการ กรุณาให้คะแนนความพึงพอใจ
      </p>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-10 h-10 cursor-pointer transition-colors ${star <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-slate-300"
              }`}
            onClick={() => setRating(star)}
          />
        ))}
      </div>

      <Textarea
        placeholder="ข้อเสนอแนะเพิ่มเติม..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
      />

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        ส่งแบบประเมิน
      </Button>
    </form>
  );
}

export default function QueueStatus() {
  const [hasAnnounced, setHasAnnounced] = useState(false);
  const { qr_code } = useParams();
  const [queue, setQueue] = useState(null);
  const [room, setRoom] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSurveySubmitted, setIsSurveySubmitted] = useState(false);

  useEffect(() => {
    console.log('QueueStatus mounted, qr_code:', qr_code);
    if (!qr_code) {
      setError("ไม่พบรหัส QR Code");
      setIsLoading(false);
      return;
    }
    setIsSurveySubmitted(false);
    loadQueueStatus(qr_code);
    const interval = setInterval(() => loadQueueStatus(qr_code), 5000);
    return () => clearInterval(interval);
  }, [qr_code]);

  const loadQueueStatus = async (qrCode) => {
    try {
      const queueResult = await Queue.filter({ qr_code: qrCode });
      console.log('Queue.filter result:', queueResult);
      if (queueResult.length === 0) {
        setError("ไม่พบคิวสำหรับ QR Code นี้");
        setQueue(null);
        setIsLoading(false);
        return;
      }
      const currentQueue = queueResult[0];
      setQueue(currentQueue);
      const [allRooms, waitingQueues] = await Promise.all([
        Room.list(),
        Queue.filter({ room_id: currentQueue.room_id, status: "waiting" }),
      ]);
      console.log('Room.list result:', allRooms);
      console.log('Waiting queues:', waitingQueues);
      const currentRoom = allRooms.find(
        (r) => r.room_code === currentQueue.room_id
      );
      setRoom(currentRoom);
      const sortedWaitingQueues = waitingQueues
        .filter((q) => q.status === "waiting")
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      const myQueueIndex = sortedWaitingQueues.findIndex(
        (q) => q.queue_number === currentQueue.queue_number
      );
      setWaitingCount(myQueueIndex >= 0 ? myQueueIndex : 0);
    } catch (err) {
      console.error("Error loading queue status:", err);
      if (err.response?.status === 429) {
        setError("ระบบกำลังยุ่ง กรุณารอสักครู่");
        setTimeout(() => loadQueueStatus(qrCode), 30000);
      } else {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลคิว");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ลบ if (status === "serving") ออก ใช้ใน getStatusDisplay เท่านั้น

  // ฟังก์ชั่นสำหรับเสียงแจ้งเตือน
  const speakRoom = (roomName) => {
    if (!window.speechSynthesis || !roomName) return;
    const utter = new window.SpeechSynthesisUtterance(`กรุณาไปที่ ${roomName}`);
    utter.lang = 'th-TH';
    window.speechSynthesis.speak(utter);
  };

  useEffect(() => {
    if (queue && queue.status === 'serving' && room && !hasAnnounced) {
      speakRoom(room.room_name);
      setHasAnnounced(true);
    }
    if (queue && queue.status !== 'serving') {
      setHasAnnounced(false);
    }
  }, [queue, room]);

  const getStatusDisplay = () => {
      // ...existing code...
    switch (queue.status) {
      case "skipped": {
        return (
          <div className="text-center space-y-4">
            <Clock className="w-20 h-20 text-red-500 mx-auto animate-pulse" />
            <h2 className="text-3xl font-bold text-red-700">คิวของคุณถูกข้าม</h2>
            <div className="my-6">
              <span className="block text-lg font-bold text-red-600 bg-red-100 rounded-lg px-6 py-4 shadow-lg">
                หมายเหตุ: กรุณาทำการกดบัตรคิวใหม่ที่จุดบริการ
              </span>
            </div>
          </div>
        );
      }
    }
    if (!queue) {
      return <div className="text-center text-red-600">ไม่พบข้อมูลคิว</div>;
    }
    if (!room) {
      return <div className="text-center text-red-600">ไม่พบข้อมูลห้อง</div>;
    }
  switch (queue.status) {
      case "paused": {
        // นับจำนวนรอบที่พักคิว (เช่น queue.paused_count)
        const pausedCount = queue.paused_count || (Array.isArray(queue.paused_count) ? queue.paused_count.length : 1);
        return (
          <div className="text-center space-y-4">
            <Clock className="w-20 h-20 text-yellow-500 mx-auto animate-pulse" />
            <h2 className="text-3xl font-bold text-yellow-700">คิวของคุณถูกพักชั่วคราว</h2>
            <p className="text-xl text-yellow-700 font-bold">พักคิวแล้ว {pausedCount} รอบ</p>
            <div className="my-6">
              <span className="block text-lg font-bold text-red-600 bg-yellow-100 rounded-lg py-2 shadow-lg">
                หมายเหตุ: กรุณาติดต่อเจ้าหน้าที่เพื่อดำเนินการต่อ
              </span>
            </div>
          </div>
        );
      }
      case "waiting": {
        const fromRoomName = queue.original_room;
        return (
          <div className="text-center space-y-4">
            <Users className="w-20 h-20 text-blue-500 mx-auto" />
            <h2 className="text-3xl font-bold text-slate-800">กำลังรอคิว</h2>
            <p className="text-xl text-slate-600">
              เหลืออีก{" "}
              <span className="font-bold text-blue-600 text-3xl mx-2">
                {waitingCount}
              </span>{" "}
              คิวก่อนหน้า
            </p>
            {/* เส้นทางห้องทั้งหมด */}
            {Array.isArray(queue.room_history) && queue.room_history.length > 1 && (
              <div className="my-6">
                <span className="block text-lg font-bold text-blue-700 bg-blue-100 rounded-lg px-6 py-4 shadow-lg">
                  จาก <span className="text-blue-600">{queue.room_history[queue.room_history.length-2].room_name}</span> ไปที่ <span className="text-green-600">{queue.room_history[queue.room_history.length-1].room_name}</span>
                </span>
              </div>
            )}
          </div>
        );
      }
      case "serving": {
        // ถ้าไม่มี room_history ให้แสดงข้อความเด่น
        return (
          <div className="text-center space-y-4">
            <Ticket className="w-20 h-20 text-green-500 mx-auto animate-pulse" />
            <div className="my-6">
              <h2 className="block text-3xl font-bold text-green-700 bg-green-100 rounded-lg px-6 py-4 shadow-lg">ถึงคิวของคุณแล้ว</h2>
              <span className="block text-3xl font-bold text-green-700 bg-green-100 rounded-lg px-6 py-4 shadow-lg">
                กรุณาไปที่ <span className="text-green-600">{room.room_name}</span>
              </span>
            </div>
          </div>
        );
      }
  
      case "completed": {
        if (isSurveySubmitted) {
          return (
            <div className="text-center space-y-4">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h2 className="text-3xl font-bold text-slate-800">ขอบคุณสำหรับความคิดเห็น</h2>
              <p className="text-xl text-slate-600">ขอให้ท่านมีสุขภาพแข็งแรง</p>
            </div>
          );
        }
        return (
          <SurveyForm
            queue={queue}
            onSubmitted={() => setIsSurveySubmitted(true)}
          />
        );
      }
      default:
        return (
          <div className="text-center space-y-4">
            <Clock className="w-20 h-20 text-slate-400 mx-auto" />
            <h2 className="text-3xl font-bold text-slate-800">
              สถานะ: {queue.status}
            </h2>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
        <CardHeader className="text-center border-b border-slate-100 pb-4">
          <CardTitle className="text-3xl font-bold text-slate-900">
            ติดตามสถานะคิว
          </CardTitle>
          {queue && (
            <p className="text-5xl font-mono font-bold text-blue-600 mt-2">
              {queue.queue_number}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-8">
          {isLoading ? (
            <div className="text-center space-y-4">
              <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
              <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center text-red-600 font-medium">{error}</div>
          ) : (
            getStatusDisplay()
          )}
        </CardContent>
      </Card>
    </div>
  );
}

