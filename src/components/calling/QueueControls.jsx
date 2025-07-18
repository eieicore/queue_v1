import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, SkipForward, CheckCircle, Volume2, Pause, RotateCcw, Send } from "lucide-react";

export default function QueueControls({ 
  onCallNext, 
  onRepeatCall,
  onSkip, 
  onPause,
  onComplete,
  onTransfer,
  hasCurrentQueue, 
  hasWaitingQueues,
  simple // เพิ่ม prop simple
}) {
  if (simple) {
    return (
      <div className="bg-white/80 border border-slate-200 rounded-xl shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-2">
          <Button
            onClick={onCallNext}
            disabled={!hasWaitingQueues}
            className="bg-blue-500 hover:bg-blue-600 text-white h-12 flex items-center gap-2 font-medium"
          >
            <Phone className="w-5 h-5" />
            เรียกถัดไป
          </Button>
          <Button
            onClick={onRepeatCall}
            disabled={!hasCurrentQueue}
            className="bg-indigo-400 hover:bg-indigo-500 text-white h-12 flex items-center gap-2 font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            เรียกซ้ำ
          </Button>
          <Button
            onClick={onSkip}
            disabled={!hasCurrentQueue}
            variant="outline"
            className="border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 h-12 flex items-center gap-2 font-medium"
          >
            <SkipForward className="w-5 h-5" />
            ข้ามคิว
          </Button>
          <Button
            onClick={onPause}
            disabled={!hasCurrentQueue}
            variant="outline"
            className="border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 h-12 flex items-center gap-2 font-medium"
          >
            <Pause className="w-5 h-5" />
            พักคิว
          </Button>
          <Button
            onClick={onTransfer}
            disabled={!hasCurrentQueue}
            variant="outline"
            className="border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 h-12 flex items-center gap-2 font-medium"
          >
            <Send className="w-5 h-5" />
            ส่งต่อ
          </Button>
          <Button
            onClick={onComplete}
            disabled={!hasCurrentQueue}
            className="bg-green-400 hover:bg-green-500 text-white h-12 flex items-center gap-2 font-medium"
          >
            <CheckCircle className="w-5 h-5" />
            เสร็จสิ้น
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-blue-600" />
          การควบคุมคิว
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Button
            onClick={onCallNext}
            disabled={!hasWaitingQueues}
            className="bg-blue-600 hover:bg-blue-700 text-white h-12 flex items-center gap-2"
          >
            <Phone className="w-5 h-5" />
            เรียกถัดไป
          </Button>

          <Button
            onClick={onRepeatCall}
            disabled={!hasCurrentQueue}
            className="bg-indigo-600 hover:bg-indigo-700 text-white h-12 flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            เรียกซ้ำ
          </Button>
          
          <Button
            onClick={onSkip}
            disabled={!hasCurrentQueue}
            variant="outline"
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 h-12 flex items-center gap-2"
          >
            <SkipForward className="w-5 h-5" />
            ข้ามคิว
          </Button>

          <Button
            onClick={onPause}
            disabled={!hasCurrentQueue}
            variant="outline"
            className="border-orange-200 text-orange-700 hover:bg-orange-50 h-12 flex items-center gap-2"
          >
            <Pause className="w-5 h-5" />
            พักคิว
          </Button>

          <Button
            onClick={onTransfer}
            disabled={!hasCurrentQueue}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 h-12 flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            ส่งต่อ
          </Button>
          
          <Button
            onClick={onComplete}
            disabled={!hasCurrentQueue}
            className="bg-green-600 hover:bg-green-700 text-white h-12 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            เสร็จสิ้น
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-medium text-slate-900 mb-2">การใช้งานด่วน:</h4>
          <div className="text-sm text-slate-600 space-y-1">
            <p>• <strong>เรียกคิวถัดไป:</strong> เรียกผู้ป่วยคนถัดไปในคิว</p>
            <p>• <strong>เรียกซ้ำ:</strong> เรียกคิวปัจจุบันซ้ำอีกครั้ง</p>
            <p>• <strong>ข้ามคิว:</strong> ข้ามผู้ป่วยปัจจุบัน (สามารถกลับมาจับคิวใหม่ได้)</p>
            <p>• <strong>พักคิว:</strong> พักคิวชั่วคราว (สามารถเรียกกลับได้)</p>
            <p>• <strong>ส่งต่อ:</strong> ส่งผู้ป่วยไปยังห้องอื่น เช่น ห้องการเงิน</p>
            <p>• <strong>เสร็จสิ้น:</strong> ทำเครื่องหมายการบริการเสร็จสิ้น</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}