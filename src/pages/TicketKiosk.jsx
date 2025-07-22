import React, { useState, useEffect } from 'react';
import { Queue, Room, Patient, Appointment } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Corrected syntax error here
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Printer, 
  UserPlus, 
  User, 
  CalendarCheck, 
  QrCode,
  ArrowLeft,
  Ticket,
  Search,
  Check,
  Clock,
  MapPin
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import PatientTypeSelector from '../components/kiosk/PatientTypeSelector';
import TicketPreview from '../components/kiosk/TicketPreview';
import QRCodeDisplay from '../components/kiosk/QRCodeDisplay';
import LiveQueueStatus from '../components/dashboard/LiveQueueStatus';
import RecentActivity from '../components/dashboard/RecentActivity';
import RoomActivity from '../components/dashboard/RoomActivity';

export default function TicketKiosk() {
  const [step, setStep] = useState('select'); // select, form, ticket
  const [patientType, setPatientType] = useState('');
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [appointmentData, setAppointmentData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (step === 'ticket' && generatedTicket) {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/queuestatus?qr_code=' + generatedTicket.qr_code)}`;
      const img = new window.Image();
      img.onload = () => {
        setTimeout(() => {
        window.print();
      }, 500);
      };
      img.onerror = () => {
        setTimeout(() => {
          window.print();
        }, 1500);
      };
      img.src = qrCodeUrl;
    }
  }, [step, generatedTicket]);

  const loadData = async () => {
    try {
      const [roomsData, patientsData, appointmentsData] = await Promise.all([
        Room.list(),
        Patient.list(),
        Appointment.list()
      ]);
      setRooms(roomsData.filter(room => room.is_active));
      setPatients(patientsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const searchPatient = async (searchValue) => {
    if (!searchValue.trim()) {
      setPatientName('');
      setAppointmentData(null);
      return;
    }
    
    try {
      // Search in patients database
      const patient = patients.find(p => 
        p.id_card === searchValue || p.hn_number === searchValue
      );
      
      if (patient) {
        setPatientName(`${patient.first_name} ${patient.last_name}`);
        setError('');
        
        // For appointment type, check for appointment and auto-fill room
        if (patientType === 'appointment') {
          const appointment = await checkAppointment(searchValue);
          if (appointment) {
            setAppointmentData(appointment);
            setSelectedRoom(appointment.room_id);
          } else {
            setError('ไม่พบการนัดหมายสำหรับวันนี้');
            setAppointmentData(null);
            setSelectedRoom('');
          }
        }
      } else {
        setPatientName('');
        setError('ไม่พบข้อมูลผู้ป่วย');
        setAppointmentData(null);
        setSelectedRoom('');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setError('เกิดข้อผิดพลาดในการค้นหา');
    }
  };

  const checkAppointment = async (patientIdValue) => {
    if (!patientIdValue.trim()) return null;
    // ใช้วันที่ปัจจุบันจากปฏิทินเครื่อง (รองรับปี 2025 หรือปีใดๆ)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    // ใช้ Appointment.filter ดึงนัดหมายจาก Supabase
    const appointments = await Appointment.filter({
      patient_id: patientIdValue,
      appointment_date: today,
      status: 'scheduled'
    });
    return appointments.length > 0 ? appointments[0] : null;
  };

  const generateQueueNumber = (roomCode, patientType) => {
    const prefix = patientType === 'new' ? 'N' : 
                   patientType === 'returning' ? 'R' : 'A';
    const timestamp = Date.now().toString().slice(-3);
    return `${roomCode}${prefix}${timestamp}`;
  };

  const generateQRCode = (queueNumber) => {
    return `MEDIQUEUE_${queueNumber}_${Date.now()}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      let finalRoomCode = selectedRoom;

      if (patientType === 'appointment') {
        if (!patientId.trim()) {
            setError('กรุณากรอกรหัสผู้ป่วยหรือหมายเลข HN');
            setIsLoading(false);
            return;
        }
        const appointment = await checkAppointment(patientId);
        if (!appointment) {
          setError('ไม่พบการนัดหมายสำหรับวันนี้');
          setIsLoading(false);
          return;
        }
        finalRoomCode = appointment.room_id; 
        await Appointment.update(appointment.id, { status: 'checked_in' });
      } else if (patientType === 'new') {
        const historyRoom = rooms.find(r => r.room_type === 'history_taking');
        if (!historyRoom) {
            setError('ไม่พบห้องซักประวัติ กรุณาติดต่อเจ้าหน้าที่');
            setIsLoading(false);
            return;
        }
        finalRoomCode = historyRoom.room_code;
      }
      
      if (!finalRoomCode) {
        setError('กรุณาเลือกห้องตรวจ');
        setIsLoading(false);
        return;
      }

      const room = rooms.find(r => r.room_code === finalRoomCode);
      if (!room) {
        setError(`ไม่พบข้อมูลห้องตรวจสำหรับรหัสห้อง: "${finalRoomCode}"`);
        setIsLoading(false);
        return;
      }

      const queueNumber = generateQueueNumber(room.room_code, patientType);
      const qrCode = generateQRCode(queueNumber);

      const queueData = {
        queue_number: queueNumber,
        patient_type: patientType,
        patient_id: patientType === 'new' ? null : patientId,
        patient_name: patientName || null,
        room_name: room.room_name,
        room_id: room.room_code,
        original_room: patientType === 'new' ? null : room.room_name,
        status: 'waiting',
        priority: patientType === 'appointment' ? 1 : 0,
        qr_code: qrCode,
        estimated_wait_time: calculateEstimatedWaitTime(room.room_code),
        triage_level: 'non_urgent',
        room_history: [{
          room_name: room.room_name,
          entered_at: new Date().toISOString(),
          left_at: null,
          duration_minutes: null
        }],
        // เพิ่มข้อมูลนัดหมายลงไปด้วย
        doctor_name: appointmentData ? appointmentData.doctor_name : null,
        department: room.department,
        appointment_time: appointmentData ? appointmentData.appointment_time : null,
        appointment_type: appointmentData ? appointmentData.appointment_type : null,
      };

      const createdQueue = await Queue.create(queueData);
      console.log('createdQueue', createdQueue);
      const ticket = Array.isArray(createdQueue) ? createdQueue[0] : createdQueue;
      setGeneratedTicket(ticket);
      // รอให้ state อัปเดตเสร็จ (optional: สามารถใช้ setTimeout 100ms หรือ Promise.resolve().then())
      await new Promise(resolve => setTimeout(resolve, 150));
      setStep('ticket');

    } catch (error) {
      setError('เกิดข้อผิดพลาดในการออกบัตรคิว กรุณาลองใหม่อีกครั้ง');
      console.error('Error creating queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateEstimatedWaitTime = (roomCode) => {
    return Math.floor(Math.random() * 30) + 10; // 10-40 minutes
  };

  const resetForm = () => {
    setStep('select');
    setPatientType('');
    setPatientId('');
    setPatientName('');
    setSelectedRoom('');
    setAppointmentData(null);
    setGeneratedTicket(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 1.5rem;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 no-print">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Printer className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">ตู้จ่ายบัตรคิว</h1>
          <p className="text-xl text-slate-600">ระบบออกบัตรคิวอัตโนมัติ</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 no-print">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Patient Type Selection */}
        {step === 'select' && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="text-center border-b border-slate-100">
                <CardTitle className="text-2xl">เลือกประเภทผู้ป่วย</CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <PatientTypeSelector 
                  selectedType={patientType}
                  onSelectType={(type) => {
                    setPatientType(type);
                    setStep('form');
                    // ถ้าเป็นผู้ป่วยใหม่ ข้ามไปห้องซักประวัติเลย
                    if (type === 'new') {
                      const historyRoom = rooms.find(r => r.room_type === 'history_taking');
                      if (historyRoom) {
                        setSelectedRoom(historyRoom.room_code);
                      }
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Form */}
        {step === 'form' && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setStep('select')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <CardTitle className="text-2xl">กรอกข้อมูล</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {/* ผู้ป่วยใหม่ไม่ต้องกรอกข้อมูลเพิ่ม */}
                {patientType === 'new' && (
                  <div className="text-center p-6 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">ผู้ป่วยใหม่</h3>
                    <p className="text-green-600">คุณจะได้รับบัตรคิวสำหรับห้องซักประวัติ</p>
                    <p className="text-sm text-green-500 mt-2">กดปุ่มด้านล่างเพื่อออกบัตรคิว</p>
                  </div>
                )}

                {/* ผู้ป่วยเก่าและนัด */}
                {(patientType === 'returning' || patientType === 'appointment') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="patient-id" className="text-lg">
                        กรุณากรอกหมายเลขบัตรประชาชน *
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="patient-id"
                          value={patientId}
                          onChange={(e) => setPatientId(e.target.value)}
                          placeholder="หมายเลขบัตรประชาชน"
                          className="text-lg h-14"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => searchPatient(patientId)}
                          className="h-14 px-4"
                        >
                          <Search className="w-5 h-5" />
                        </Button>
                      </div>
                      {patientName && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <p className="text-green-800 font-medium">พบข้อมูลผู้ป่วย: {patientName}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Show appointment details if found */}
                    {appointmentData && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">ข้อมูลการนัดหมาย</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">วันที่: </span>
                            <span className="font-medium">{appointmentData.appointment_date}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">เวลา: </span>
                            <span className="font-medium">{appointmentData.appointment_time}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">ห้อง: </span>
                            <span className="font-medium">{appointmentData.room_id}</span>
                          </div>
                          <div>
                            <span className="text-blue-600">แพทย์: </span>
                            <span className="font-medium">{appointmentData.doctor_name}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Room Selection - Only show if not appointment or appointment not found */}
                    {patientType === 'returning' && (
                      <div className="space-y-2">
                        <Label className="text-lg">เลือกห้องตรวจ *</Label>
                        <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                          <SelectTrigger className="text-lg h-14">
                            <SelectValue placeholder="เลือกห้องที่ต้องการไป" />
                          </SelectTrigger>
                          <SelectContent>
                            {rooms.filter(r => r.is_active && r.room_type !== 'history_taking').map((room) => (
                              <SelectItem key={room.id} value={room.room_code}>
                                <div className="py-2">
                                  <div className="font-medium">{room.room_name}</div>
                                  <div className="text-sm text-slate-500">{room.department}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Show selected room for appointment */}
                    {patientType === 'appointment' && selectedRoom && (
                      <div className="space-y-2">
                        <Label className="text-lg">ห้องที่นัดหมาย</Label>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                          <div className="font-medium text-slate-900">
                            {rooms.find(r => r.room_code === selectedRoom)?.room_name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {rooms.find(r => r.room_code === selectedRoom)?.department}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (patientType !== 'new' && !selectedRoom) || ((patientType === 'returning' || patientType === 'appointment') && !patientId.trim())}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      กำลังออกบัตร...
                    </>
                  ) : (
                    <>
                      <Ticket className="w-6 h-6 mr-2" />
                      ออกบัตรคิว
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Ticket Display */}
        {step === 'ticket' && generatedTicket && (
          <div>
            <div id="printable-area">
              <TicketPreview ticket={generatedTicket} />
              <QRCodeDisplay qrCode={generatedTicket.qr_code} queueNumber={generatedTicket.queue_number} />
            </div>
            
            <div className="text-center mt-8 no-print">
              <Button
                onClick={resetForm}
                className="bg-green-600 hover:bg-green-700 text-white h-14 px-8 text-lg"
              >
                ออกบัตรใหม่
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
