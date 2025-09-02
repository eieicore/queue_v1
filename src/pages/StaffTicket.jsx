import React, { useEffect, useState } from 'react';
import { Room, QueueSettings, Appointment } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
// removed Select import as patient type dropdown is no longer used
import TicketPreview from '@/components/kiosk/TicketPreview';
import QRCodeDisplay from '@/components/kiosk/QRCodeDisplay';
import PatientTypeSelector from '@/components/kiosk/PatientTypeSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Printer, Ticket, ArrowLeft, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function StaffTicket() {
  const [rooms, setRooms] = useState([]);
  const [queueSettings, setQueueSettings] = useState(null);
  const [step, setStep] = useState('select'); // select -> form -> room -> ticket
  const [patientType, setPatientType] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQrCodeLoaded, setIsQrCodeLoaded] = useState(false);
  const [hasPrinted, setHasPrinted] = useState(false);
  const [infoNote, setInfoNote] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [roomsData, settings] = await Promise.all([
          Room.list(),
          QueueSettings.list()
        ]);
        setRooms(roomsData.filter(r => r.is_active));
        setQueueSettings(settings?.[0] || null);
      } catch (e) {
        console.error(e);
        setError('โหลดข้อมูลล้มเหลว');
      }
    };
    load();
  }, []);

  // Auto-print when ticket and QR are ready
  useEffect(() => {
    if (step === 'ticket' && generatedTicket && isQrCodeLoaded && !hasPrinted) {
      setHasPrinted(true);
      setTimeout(() => {
        try {
          window.print();
          setTimeout(() => resetAll(), 2500);
        } catch (e) {
          console.error('Print error:', e);
        }
      }, 400);
    }
  }, [step, generatedTicket, isQrCodeLoaded, hasPrinted]);

  const calculateEstimatedWaitTime = (roomCode) => {
    return Math.floor(Math.random() * 30) + 10; // 10-40 minutes
  };

  // Try to find appointment by patientId for today or later
  const fetchTodayAppointment = async (pid) => {
    if (!pid) return null;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    try {
      const appts = await Appointment.filter({ patient_id: pid, appointment_date_gte: today });
      return Array.isArray(appts) && appts.length > 0 ? appts[0] : null;
    } catch (e) {
      console.error('fetchTodayAppointment error', e);
      return null;
    }
  };

  const findRoomForAppointment = (appt) => {
    if (!appt) return null;
    // Try room_id (stored as room_code in rooms table) -> exact match
    if (appt.room_id) {
      const byCode = rooms.find(r => r.room_code === appt.room_id);
      if (byCode) return byCode;
    }
    // Try room_name text match
    if (appt.room_name) {
      const byName = rooms.find(r => r.room_name === appt.room_name);
      if (byName) return byName;
    }
    return null;
  };

  const handleSubmitWith = async (room, options = {}) => {
    setError('');
    setIsLoading(true);
    setGeneratedTicket(null);

    try {
      if (!room) {
        setError('ไม่พบข้อมูลห้องสำหรับออกบัตร');
        return;
      }

      let prefix = '';
      if (queueSettings?.ticket_format) {
        prefix = patientType === 'new'
          ? (queueSettings.ticket_format.new_patient_prefix || 'N')
          : patientType === 'appointment'
            ? (queueSettings.ticket_format.appointment_prefix || 'A')
            : (queueSettings.ticket_format.returning_patient_prefix || 'R');
      } else {
        prefix = patientType === 'new' ? 'N' : (patientType === 'appointment' ? 'A' : 'R');
      }

      const { data: queueData, error: queueError } = await supabase
        .rpc('next_queue_ticket_json', {
          p_room_id: room.room_code,
          p_room_name: room.room_name,
          p_patient_type: patientType,
          p_patient_id: patientType === 'new' ? null : (patientId || null),
          p_patient_name: patientName || null,
          p_priority: options.priority ?? (patientType === 'appointment' ? 1 : 0),
          p_doctor_name: options.doctor_name ?? (room.doctor_assigned || null),
          p_department: room.department || null,
          p_appointment_time: options.appointment_time ?? null,
          p_appointment_type: options.appointment_type ?? null,
          p_estimated_wait_time: calculateEstimatedWaitTime(room.room_code),
          p_original_room: patientType === 'new' ? null : room.room_name,
          p_triage_level: 'non_urgent',
          p_prefix: prefix
        });

      if (queueError) {
        console.error('RPC error', queueError);
        setError('ออกบัตรคิวไม่สำเร็จ');
        return;
      }

      setGeneratedTicket(queueData);
      setIsQrCodeLoaded(false);
      setHasPrinted(false);
      setStep('ticket');
    } catch (e) {
      console.error(e);
      setError('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    setGeneratedTicket(null);

    try {
      if (!selectedRoom) {
        setError('กรุณาเลือกห้องที่จะส่งผู้เข้ารับบริการ');
        return;
      }
      const room = rooms.find(r => r.room_code === selectedRoom);
      if (!room) {
        setError('ไม่พบข้อมูลห้อง');
        return;
      }

      let prefix = '';
      if (queueSettings?.ticket_format) {
        prefix = patientType === 'new'
          ? (queueSettings.ticket_format.new_patient_prefix || 'N')
          : patientType === 'appointment'
            ? (queueSettings.ticket_format.appointment_prefix || 'A')
            : (queueSettings.ticket_format.returning_patient_prefix || 'R');
      } else {
        prefix = patientType === 'new' ? 'N' : (patientType === 'appointment' ? 'A' : 'R');
      }

      await handleSubmitWith(room);
    } catch (e) {
      console.error(e);
      setError('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPatientId('');
    setPatientName('');
    setSelectedRoom('');
    setError('');
  };

  const resetAll = () => {
    setPatientType('');
    setPatientId('');
    setPatientName('');
    setSelectedRoom('');
    setGeneratedTicket(null);
    setIsQrCodeLoaded(false);
    setHasPrinted(false);
    setError('');
    setStep('select');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <style jsx="true" global="true">{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="no-print text-center mb-2">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Printer className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">ออกบัตรคิวโดยเจ้าหน้าที่</h1>
          <p className="text-slate-600">โฟลว์แบบ 3 ขั้นตอน: เลือกประเภท → กรอกข้อมูล → เลือกห้อง</p>
        </div>

        {error && (
          <Alert variant="destructive" className="no-print">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select patient type */}
        {step === 'select' && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl no-print">
            <CardHeader className="text-center border-b border-slate-100">
              <CardTitle className="text-2xl">เลือกประเภทผู้ป่วย</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <PatientTypeSelector 
                selectedType={patientType}
                onSelectType={(type) => {
                  setPatientType(type);
                  if (type === 'new') {
                    setStep('room');
                  } else {
                    setStep('form');
                  }
                }}
                onSelectCombined={(/* not used here */) => { setPatientType('returning'); setStep('form'); }}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Basic info */}
        {step === 'form' && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl no-print">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setStep('select')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl">กรอกข้อมูล (ถ้ามี)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 gap-6">
              <div className="hidden">
                <Label>ประเภทผู้ป่วย</Label>
                <div className=" h-14 flex items-center px-4 rounded-md border border-slate-200 bg-slate-50 text-lg text-slate-700">
                  {{ new: 'ผู้ป่วยใหม่', returning: 'ผู้ป่วยเก่า', appointment: 'ผู้ป่วยนัดหมาย' }[patientType] || '-'}
                </div>
              </div>
              <div className="w-full">
                <Label className="text-lg">{patientType === 'returning' || patientType === 'appointment' ? 'บัตรประชาชน/รหัสผู้ป่วย (จำเป็น)' : 'รหัสผู้ป่วย / บัตรประชาชน'}</Label>
                <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="เช่น 1103********" className="h-14 text-lg" />
              </div>
              {patientType !== 'returning' && (
                <div>
                  <Label>ชื่อ-สกุล</Label>
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="เช่น สมชาย ใจดี" className="h-14 text-lg" />
                </div>
              )}
              {infoNote && (
                <div className="md:col-span-3 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">{infoNote}</div>
              )}
              <div className="md:col-span-3 flex justify-end">
                <Button
                  className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={async () => {
                    setInfoNote('');
                    // New patient: can skip to room directly
                    if (patientType === 'new') {
                      setStep('room');
                      return;
                    }
                    // Returning or appointment: require ID
                    if (!patientId) {
                      setError('กรุณากรอกบัตรประชาชน/รหัสผู้ป่วย');
                      return;
                    }
                    // Try to find appointment by ID and auto-issue
                    const appt = await fetchTodayAppointment(patientId);
                    if (appt) {
                      // prioritize appointment
                      setPatientType('appointment');
                      const room = findRoomForAppointment(appt);
                      if (room) {
                        await handleSubmitWith(room, {
                          priority: 1,
                          doctor_name: appt.doctor_name || room.doctor_assigned || null,
                          appointment_time: appt.appointment_time || appt.appointment_date || null,
                          appointment_type: appt.appointment_type || null,
                        });
                        return;
                      }
                      // If no room matched, go select room but inform
                      setInfoNote('พบข้อมูลการนัดหมาย โปรดเลือกห้องปลายทางเพื่อออกบัตร');
                      setStep('room');
                      return;
                    }
                    // No appointment -> go choose room
                    setStep('room');
                  }}
                >
                  ถัดไป: เลือกห้อง / ออกบัตรนัด
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Room selection */}
        {step === 'room' && (
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl no-print">
            <CardHeader className="border-b border-slate-100">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => setStep(patientType === 'new' ? 'select' : 'form')}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl">เลือกห้องปลายทาง</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(r => (
                  <button
                    key={r.room_code}
                    onClick={() => setSelectedRoom(r.room_code)}
                    className={`rounded-2xl border p-5 text-left shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      selectedRoom === r.room_code ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="text-xl font-semibold text-slate-900">{r.room_name}</div>
                    <div className="text-slate-600">{r.department || '-'}</div>
                    {r.doctor_assigned && (
                      <div className="mt-2 inline-block text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{r.doctor_assigned}</div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" className="h-12 px-6" onClick={() => setStep(patientType === 'new' ? 'select' : 'form')}>ย้อนกลับ</Button>
                <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white" disabled={!selectedRoom || isLoading} onClick={handleSubmit}>
                  {isLoading ? 'กำลังออกบัตร...' : (<><Ticket className="w-5 h-5 mr-2"/>ออกบัตรคิว</>)}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Ticket display and auto print */}
        {step === 'ticket' && generatedTicket && (
          <div className="w-full">
            <div id="printable-area" className="print:block w-full">
              <div className="print:block w-full">
                <TicketPreview ticket={generatedTicket} queueSettings={queueSettings || undefined} />
              </div>
              <div className="print:block w-full">
                <QRCodeDisplay 
                  qrCode={generatedTicket.qr_code}
                  queueNumber={generatedTicket.queue_number}
                  onLoad={() => setIsQrCodeLoaded(true)}
                />
              </div>
            </div>

            <div className="text-center mt-8 no-print">
              {hasPrinted ? (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">พิมพ์บัตรคิวเรียบร้อยแล้ว</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-800">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    <span className="font-medium">กำลังพิมพ์บัตรคิว...</span>
                  </div>
                </div>
              )}
              <div className="flex justify-center gap-4">
                <Button onClick={resetAll} className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg">ออกบัตรใหม่</Button>
                <Button onClick={() => window.print()} variant="outline" className="h-14 px-8 text-lg"><Printer className="w-5 h-5 mr-2" />พิมพ์อีกครั้ง</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
