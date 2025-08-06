import React from 'react';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/styles/print.css';

export default function QRCodeDisplay({ qrCode, queueNumber }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + createPageUrl('QueueStatus') + `?qr_code=${qrCode}`)}`;
  const statusUrl = createPageUrl('QueueStatus') + `?qr_code=${qrCode}`;

  return (
    <Card className="bg-white border-0 shadow-none print:shadow-none print:border-0 print:max-w-full print:mx-0 print:p-3">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">QR Code สำหรับติดตามคิว</h3>
        <div className="flex justify-center">
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for queue ${queueNumber}`}
            className="w-full max-w-[50mm] h-auto"
          />
        </div>
        
        <div className="space-y-1">
          <p className="font-medium text-slate-900 text-base print:text-sm">สแกนเพื่อติดตามคิว {queueNumber}</p>
          <p className="text-xs text-slate-600 print:text-[11px]">
            ใช้แอปกล้องของโทรศัพท์สแกน QR Code
          </p>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          <p>รหัสอ้างอิง: {qrCode}</p>
          <p className="text-[10px] mt-1">สแกนเพื่อตรวจสอบสถานะคิวของคุณ</p>
        </div>
      </div>
    </Card>
  );
}