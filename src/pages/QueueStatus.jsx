import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
            className={`w-10 h-10 cursor-pointer transition-colors ${
              star <= rating
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
  const location = useLocation();
  const [queue, setQueue] = useState(null);
  const [room, setRoom] = useState(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSurveySubmitted, setIsSurveySubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qrCode = params.get("qr_code");

    if (!qrCode) {
      setError("ไม่พบรหัส QR Code");
      setIsLoading(false);
      return;
    }

    // Check if the survey was already submitted for this specific queue (e.g., from local storage or context)
    // For simplicity, we reset it here on new QR code load.
    setIsSurveySubmitted(false);

    loadQueueStatus(qrCode);
    const interval = setInterval(() => loadQueueStatus(qrCode), 5000); // เปลี่ยนเป็น 20 วินาที
    return () => clearInterval(interval);
  }, [location.search]);

  const loadQueueStatus = async (qrCode) => {
    try {
      const queueResult = await Queue.filter({ qr_code: qrCode });
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

      const currentRoom = allRooms.find(
        (r) => r.room_code === currentQueue.room_id
      );
      setRoom(currentRoom);

      // Filter เฉพาะคิวที่ waiting และ sort ตาม created_date
      const sortedWaitingQueues = waitingQueues
        .filter((q) => q.status === "waiting")
        .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      // หา index ของคิวปัจจุบันในลำดับที่ sort แล้ว (index คือจำนวนคิวก่อนหน้า)
      const myQueueIndex = sortedWaitingQueues.findIndex(
        (q) => q.queue_number === currentQueue.queue_number
      );
      setWaitingCount(myQueueIndex >= 0 ? myQueueIndex : 0);
    } catch (err) {
      console.error("Error loading queue status:", err);
      if (err.response?.status === 429) {
        setError("ระบบกำลังยุ่ง กรุณารอสักครู่");
        // รอ 30 วินาทีก่อน retry
        setTimeout(() => loadQueueStatus(qrCode), 30000);
      } else {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลคิว");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!queue || !room) return null;

    switch (queue.status) {
      case "waiting":
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
            <p className="text-slate-500">
              เวลาที่คาดว่าจะได้เข้ารับบริการ: {queue.estimated_wait_time} นาที
            </p>
          </div>
        );
      case "serving":
        return (
          <div className="text-center space-y-4">
            <Ticket className="w-20 h-20 text-green-500 mx-auto animate-pulse" />
            <h2 className="text-3xl font-bold text-slate-800">
              ถึงคิวของคุณแล้ว
            </h2>
            <p className="text-xl text-slate-600">
              กรุณาไปที่{" "}
              <span className="font-bold text-green-600 text-2xl">
                {room.room_name}
              </span>
            </p>
          </div>
        );
      case "completed":
        if (isSurveySubmitted) {
          return (
            <div className="text-center space-y-4">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
              <h2 className="text-3xl font-bold text-slate-800">
                ขอบคุณสำหรับความคิดเห็น
              </h2>
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
