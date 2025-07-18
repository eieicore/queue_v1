import React from 'react';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QRCodeDisplay({ qrCode, queueNumber }) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + createPageUrl('QueueStatus') + `?qr_code=${qrCode}`)}`;
  const statusUrl = createPageUrl('QueueStatus') + `?qr_code=${qrCode}`;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl max-w-md mx-auto">
      <CardHeader className="text-center border-b border-slate-100">
        <CardTitle className="flex items-center justify-center gap-2">
          <QrCode className="w-6 h-6 text-blue-600" />
          QR Code สำหรับติดตาม
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 text-center space-y-4">
        <a href={statusUrl} target="_blank" rel="noopener noreferrer" className="bg-white p-4 rounded-lg border inline-block">
          <img 
            src={qrCodeUrl} 
            alt={`QR Code for queue ${queueNumber}`}
            className="w-48 h-48 mx-auto"
          />
        </a>
        
        <div className="space-y-2">
          <p className="font-medium text-slate-900">สแกนเพื่อติดตามคิว {queueNumber}</p>
          <p className="text-sm text-slate-600">
            ใช้แอปกล้องของโทรศัพท์สแกน QR Code หรือคลิกปุ่มด้านล่าง
          </p>
        </div>

        <Button asChild className="w-full">
          <Link to={statusUrl} target="_blank">
            <LinkIcon className="w-4 h-4 mr-2" />
            เปิดหน้าติดตามคิว
          </Link>
        </Button>
        
        <div className="text-xs text-slate-500 mt-4 p-2 bg-slate-50 rounded">
          รหัสอ้างอิง: {qrCode}
        </div>
      </CardContent>
    </Card>
  );
}