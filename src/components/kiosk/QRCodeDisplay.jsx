import React from 'react';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import '@/styles/print.css';

export default function QRCodeDisplay({ qrCode, queueNumber, onLoad }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + createPageUrl('QueueStatus') + `?qr_code=${qrCode}`)}`;
  const statusUrl = createPageUrl('QueueStatus') + `?qr_code=${qrCode}`;

  return (
    <Card className="bg-white border-0 shadow-none print:shadow-none print:border-0 print:max-w-full print:mx-0 print:p-1 print:pb-0 print:pt-2 print:scale-75 print:origin-top">
      <div className="text-center print:space-y-0 space-y-0">
        <h3 className="text-sm font-medium print:text-xs print:mb-0">QR Code ติดตามคิว</h3>
        <div className="flex justify-center print:my-0">
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for queue ${queueNumber}`}
            className="w-full max-w-[30mm] h-auto print:max-w-[25mm]"
            onLoad={onLoad}
          />
        </div>
        
        <div className="space-y-0">
          <p className="font-medium text-slate-900 text-xs print:text-[11px]">คิวที่ {queueNumber}</p>
          <p className="text-[11px] text-slate-600 print:text-[9px] print:leading-tight">
            สแกนเพื่อติดตามคิว
          </p>
        </div>

        <div className="text-[10px] text-slate-500 print:text-[8px] print:leading-tight">
          <p className="print:my-0">รหัส: {qrCode}</p>
        </div>
      </div>
    </Card>
  );
}