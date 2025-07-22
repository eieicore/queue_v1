
import React, { useState, useEffect } from 'react';
import { Queue, Room, Feedback } from '@/api/entities'; // เปลี่ยนจาก SatisfactionSurvey เป็น Feedback
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, BarChart3, Clock, Users, Loader2, MapPin, ArrowRight, Eye, CheckCircle, Calendar as CalendarIcon, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, isSameMonth, isSameYear, parse } from 'date-fns';
import { th } from 'date-fns/locale';

import LoginGuard from '../components/auth/LoginGuard';

function ReportsContent() {
  const [reportData, setReportData] = useState([]);
  const [queueJourneyData, setQueueJourneyData] = useState([]);
  const [satisfactionReportData, setSatisfactionReportData] = useState([]); // New state for satisfaction report
  const [allQueues, setAllQueues] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [queueVolumeData, setQueueVolumeData] = useState([]);
  const [volumeFilter, setVolumeFilter] = useState('day'); // day, month, year
  const [volumeDate, setVolumeDate] = useState(new Date());
  const [missedQueueCount, setMissedQueueCount] = useState(0); 
  const [peakHoursData, setPeakHoursData] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [satisfactionDate, setSatisfactionDate] = useState(null); // สำหรับรายวัน
  const [satisfactionMonth, setSatisfactionMonth] = useState(''); // yyyy-MM
  const [satisfactionYear, setSatisfactionYear] = useState(''); // yyyy
  const [satisfactionFilterType, setSatisfactionFilterType] = useState('day'); // day, month, year
  
  useEffect(() => {
    generateReports();
  }, []);

  useEffect(() => {
    if (!isLoading && allQueues.length > 0 && allRooms.length > 0) {
      generateQueueVolumeReport(allQueues, allRooms, volumeFilter, volumeDate);
    }
  }, [volumeFilter, volumeDate, isLoading, allQueues, allRooms]);

  const generateReports = async () => {
    setIsLoading(true);
    try {
      // Fetch all queues, rooms, and feedbacks (เปลี่ยนจาก surveys เป็น feedbacks)
      const [queues, rooms, feedbacks] = await Promise.all([
        Queue.list('-created_date'), // Sorted by created_date descending
        Room.list(),
        Feedback.list() // ดึง feedbacks จาก Supabase
      ]);

      const completedQueues = queues.filter(q => q.status === 'completed');
      
      setAllQueues(queues);
      setAllRooms(rooms);

      // รายงานเวลาให้บริการเฉลี่ยต่อห้อง
      const dataByRoom = rooms.map(room => ({
        room_name: room.room_name,
        room_id: room.room_code,
        total_patients: 0,
        total_service_time: 0,
      }));

      completedQueues.forEach(queue => {
        if (queue.called_at && queue.completed_at) {
          const roomData = dataByRoom.find(r => r.room_id === queue.room_id);
          if (roomData) {
            const serviceTime = (new Date(queue.completed_at) - new Date(queue.called_at)) / 60000; // in minutes
            if (serviceTime > 0) {
              roomData.total_patients += 1;
              roomData.total_service_time += serviceTime;
            }
          }
        }
      });
      
      const finalReport = dataByRoom
        .filter(d => d.total_patients > 0)
        .map(d => ({
          ...d,
          average_time: (d.total_service_time / d.total_patients).toFixed(2),
        }));

      setReportData(finalReport);

      // รายงานการเดินทางของคิว (Queue Journey) - Filter completed from all fetched queues
      const journeyData = queues
        .filter(queue => queue.room_history && queue.room_history.length > 0 && queue.status === 'completed')
        .map(queue => {
          const totalJourneyTime = queue.room_history.reduce((total, room) => {
            return total + (room.duration_minutes || 0);
          }, 0);

          return {
            queue_number: queue.queue_number,
            patient_type: queue.patient_type,
            patient_name: queue.patient_name,
            total_journey_time: totalJourneyTime,
            rooms_visited: queue.room_history.length,
            room_history: queue.room_history,
            created_date: queue.created_date
          };
        })
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      setQueueJourneyData(journeyData);

      // New: Satisfaction Report Data (ใช้ feedbacks)
      const satisfactionData = feedbacks.map(fb => {
        const room = rooms.find(r => r.room_code === fb.room_id);
        const queue = queues.find(q => q.id === fb.queue_id || q.queue_number === fb.queue_number);
        return {
          ...fb,
          room_name: room?.room_name || fb.room_id || '-',
          queue_number: queue?.queue_number || fb.queue_number || '-',
          completed_at: fb.completed_at || queue?.completed_at || null,
        };
      });
      setSatisfactionReportData(satisfactionData);

      // New: Performance Analysis
      const today = new Date().toISOString().slice(0, 10);
      const todaysQueues = queues.filter(q => q.created_date && q.created_date.startsWith(today));

      // Missed Queues
      setMissedQueueCount(todaysQueues.filter(q => q.status === 'skipped').length);

      // Peak Hours
      const hours = todaysQueues.reduce((acc, queue) => {
        if (queue.created_date) { // Ensure created_date exists before parsing
            const hour = new Date(queue.created_date).getHours();
            acc[hour] = (acc[hour] || 0) + 1;
        }
        return acc;
      }, {});

      const peakData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        queues: hours[i] || 0,
      }));
      setPeakHoursData(peakData);
      
    } catch (error) {
      console.error("Error generating reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateQueueVolumeReport = (queues, rooms, filter, date) => {
    let filteredQueues;

    if (filter === 'day') {
        const dayStr = format(date, 'yyyy-MM-dd');
        filteredQueues = queues.filter(q => q.created_date && q.created_date.startsWith(dayStr));
    } else if (filter === 'month') {
        const monthStr = format(date, 'yyyy-MM');
        filteredQueues = queues.filter(q => q.created_date && q.created_date.startsWith(monthStr));
    } else { // year
        const yearStr = format(date, 'yyyy');
        filteredQueues = queues.filter(q => q.created_date && q.created_date.startsWith(yearStr));
    }

    const countsByRoom = filteredQueues.reduce((acc, queue) => {
        // If room_id is null/undefined (e.g., queue not yet called to a room), assign to 'unassigned'
        const roomId = queue.room_id || 'unassigned';
        acc[roomId] = (acc[roomId] || 0) + 1;
        return acc;
    }, {});

    const data = rooms
      .map(room => ({
          room_name: room.room_name,
          count: countsByRoom[room.room_code] || 0,
      }))
      .filter(d => d.count > 0)
      .sort((a,b) => b.count - a.count);

    // Add 'unassigned' queues if they exist for the filtered period
    if (countsByRoom['unassigned']) {
      data.push({ room_name: 'คิวที่ยังไม่ถูกเรียก', count: countsByRoom['unassigned'] });
    }

    setQueueVolumeData(data);
  };
  
  const exportToCsv = () => {
    const headers = "Room,Total Patients,Average Service Time (minutes)";
    const rows = reportData.map(d => `${d.room_name},${d.total_patients},${d.average_time}`);
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `queue_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJourneyToCsv = () => {
    const headers = "Queue Number,Patient Type,Patient Name,Total Time (min),Rooms Visited,Room Journey";
    const rows = queueJourneyData.map(d => {
      const roomJourney = d.room_history.map(r => `${r.room_name}(${r.duration_minutes}min)`).join(' -> ');
      return `${d.queue_number},${d.patient_type},${d.patient_name || ''},${d.total_journey_time},${d.rooms_visited},"${roomJourney}"`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `queue_journey_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSatisfactionToCsv = () => {
    const headers = "Date,Queue Number,Room,Rating,Comments";
    const rows = satisfactionReportData.map(d => {
      const date = format(new Date(d.created_date), 'yyyy-MM-dd HH:mm');
      // Escape double quotes in comments by replacing them with two double quotes
      const comments = `"${(d.comments || '').replace(/"/g, '""')}"`;
      return `${date},${d.queue_number},${d.room_name},${d.rating},${comments}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `satisfaction_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ฟังก์ชัน filter satisfaction ตามวันที่
  const filteredSatisfactionData = satisfactionReportData.filter((d) => {
    const completedAt = d.completed_at ? new Date(d.completed_at) : null;
    if (!completedAt) return false;
    if (satisfactionFilterType === 'day') {
      if (!satisfactionDate) return true;
      return isSameDay(completedAt, satisfactionDate);
    }
    if (satisfactionFilterType === 'month') {
      if (!satisfactionMonth) return true;
      // yyyy-MM
      const monthStr = completedAt.getFullYear() + '-' + String(completedAt.getMonth() + 1).padStart(2, '0');
      return monthStr === satisfactionMonth;
    }
    if (satisfactionFilterType === 'year') {
      if (!satisfactionYear) return true;
      return String(completedAt.getFullYear()) === satisfactionYear;
    }
    return true;
  });

  const getPatientTypeLabel = (type) => {
    switch(type) {
      case 'new': return 'ผู้ป่วยใหม่';
      case 'returning': return 'ผู้ป่วยเก่า';
      case 'appointment': return 'นัดหมาย';
      default: return type;
    }
  };

  const getPatientTypeColor = (type) => {
    switch(type) {
      case 'new': return 'bg-purple-100 text-purple-800';
      case 'returning': return 'bg-blue-100 text-blue-800';
      case 'appointment': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '-';
    try {
      return new Date(dateTimeString).toLocaleString('th-TH', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
    } catch (e) {
      console.error("Error formatting date time:", dateTimeString, e);
      return '-';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">รายงานและสถิติ</h1>
            <p className="text-slate-600">ภาพรวมประสิทธิภาพการจัดการคิว</p>
          </div>
        </div>

        <Tabs defaultValue="service-time" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5"> {/* Changed to 5 columns */}
            <TabsTrigger value="service-time" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              เวลาให้บริการ
            </TabsTrigger>
            <TabsTrigger value="queue-journey" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              การเดินทางของคิว
            </TabsTrigger>
            <TabsTrigger value="queue-volume" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              ปริมาณคิว
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              วิเคราะห์ประสิทธิภาพ
            </TabsTrigger>
            <TabsTrigger value="satisfaction" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              ความพึงพอใจ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="service-time" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  เวลาให้บริการเฉลี่ยต่อห้อง (นาที)
                </CardTitle>
                <Button onClick={exportToCsv} disabled={reportData.length === 0} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="h-96">
                {reportData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="room_name" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(5px)',
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(0, 0, 0, 0.1)',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="average_time" fill="#2563eb" name="Average Time (min)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <p>ไม่มีข้อมูลที่เสร็จสมบูรณ์เพื่อสร้างรายงาน</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue-journey" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  รายงานการเดินทางของคิว
                </CardTitle>
                <Button onClick={exportJourneyToCsv} disabled={queueJourneyData.length === 0} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {queueJourneyData.length > 0 ? (
                  <div className="space-y-4">
                    {queueJourneyData.map((journey) => (
                      <Dialog key={journey.queue_number}>
                        <DialogTrigger asChild>
                           <div className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                  {journey.queue_number.slice(-2)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-slate-900">{journey.queue_number}</h4>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getPatientTypeColor(journey.patient_type)}>
                                      {getPatientTypeLabel(journey.patient_type)}
                                    </Badge>
                                    {journey.patient_name && (
                                      <span className="text-sm text-slate-600">{journey.patient_name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2 text-slate-600">
                                  <Clock className="w-4 h-4" />
                                  <span className="font-medium">{journey.total_journey_time} นาที</span>
                                </div>
                                <div className="text-sm text-slate-500">
                                  ผ่าน {journey.rooms_visited} ห้อง
                                </div>
                                <div className="flex items-center justify-end gap-1 text-blue-600 mt-1 text-xs">
                                  <Eye className="w-3 h-3" />
                                  <span>ดูรายละเอียด</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                              {journey.room_history.map((room, roomIndex) => (
                                <React.Fragment key={roomIndex}>
                                  <span>{room.room_name}</span>
                                  {roomIndex < journey.room_history.length - 1 && (
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              รายละเอียดการเดินทาง: คิว {journey.queue_number}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            {journey.room_history.map((room, index) => (
                              <div key={index} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                                    {index + 1}
                                  </div>
                                  {index < journey.room_history.length - 1 && (
                                    <div className="w-px h-8 bg-slate-200 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-4">
                                  <h4 className="font-semibold text-slate-800">{room.room_name}</h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                                    <div>Check-in:</div>
                                    <div className="font-mono">{formatDateTime(room.entered_at)}</div>
                                    <div>Check-out:</div>
                                    <div className="font-mono">{formatDateTime(room.left_at)}</div>
                                    <div>ระยะเวลา:</div>
                                    <div>{room.duration_minutes !== null ? `${room.duration_minutes} นาที` : '-'}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-800">เสร็จสิ้นกระบวนการ</h4>
                                  <p className="text-sm text-slate-600">
                                    เวลารวมทั้งหมด: {journey.total_journey_time} นาที
                                  </p>
                                </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <p>ไม่มีข้อมูลการเดินทางของคิว</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue-volume" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  วิเคราะห์ปริมาณคิว
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant={volumeFilter === 'day' ? 'default' : 'outline'} onClick={() => setVolumeFilter('day')}>รายวัน</Button>
                  <Button variant={volumeFilter === 'month' ? 'default' : 'outline'} onClick={() => setVolumeFilter('month')}>รายเดือน</Button>
                  <Button variant={volumeFilter === 'year' ? 'default' : 'outline'} onClick={() => setVolumeFilter('year')}>รายปี</Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(volumeDate, "PPP", { locale: th })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={volumeDate}
                        onSelect={setVolumeDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {queueVolumeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={queueVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="room_name" 
                          angle={-45}
                          textAnchor="end"
                          interval={0}
                          height={100}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3b82f6" name="จำนวนคิว" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p>ไม่มีข้อมูลสำหรับช่วงเวลาที่เลือก</p>
                    </div>
                  )}
                </div>
                <div className="mt-8">
                  <h4 className="font-bold mb-2">ตารางข้อมูล</h4>
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-2 font-semibold bg-slate-50 p-2 border-b">
                      <div>ชื่อห้อง</div>
                      <div className="text-right">จำนวนคิว</div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {queueVolumeData.map((item, index) => (
                        <div key={index} className="grid grid-cols-2 p-2 border-b last:border-b-0">
                          <div>{item.room_name}</div>
                          <div className="text-right">{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  การวิเคราะห์ประสิทธิภาพ (วันนี้)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                    <h3 className="text-lg font-medium mb-2">คิวที่ข้าม (Missed Queues)</h3>
                    <p className="text-4xl font-bold text-red-600">{missedQueueCount}</p>
                    <p className="text-sm text-slate-500">จำนวนคิวที่ถูกข้ามในวันนี้</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-4">ช่วงเวลาที่มีผู้ใช้บริการสูงสุด (Peak Hours)</h3>
                  {peakHoursData.length > 0 ? (
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={peakHoursData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="hour" />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="queues" fill="#3b82f6" name="จำนวนคิว" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">
                      <p>ไม่มีข้อมูลปริมาณคิวสำหรับช่วงเวลาที่เลือกในวันนี้</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New TabsContent for Satisfaction Report */}
          <TabsContent value="satisfaction" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  รายงานความพึงพอใจ
                </CardTitle>
                <div className="flex flex-col md:flex-row gap-2 md:items-center">
                  <Button onClick={exportSatisfactionToCsv} disabled={satisfactionReportData.length === 0} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <div className="flex gap-2 items-center">
                    <Button variant={satisfactionFilterType === 'day' ? 'default' : 'outline'} size="sm" onClick={() => setSatisfactionFilterType('day')}>รายวัน</Button>
                    <Button variant={satisfactionFilterType === 'month' ? 'default' : 'outline'} size="sm" onClick={() => setSatisfactionFilterType('month')}>รายเดือน</Button>
                    <Button variant={satisfactionFilterType === 'year' ? 'default' : 'outline'} size="sm" onClick={() => setSatisfactionFilterType('year')}>รายปี</Button>
                    {satisfactionFilterType === 'day' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-[180px] justify-start text-left font-normal" size="sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {satisfactionDate ? format(satisfactionDate, 'PPP', { locale: th }) : 'เลือกวันที่'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={satisfactionDate}
                            onSelect={setSatisfactionDate}
                            initialFocus
                            captionLayout="buttons"
                            fromYear={2023}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    {satisfactionFilterType === 'month' && (
                      <input
                        type="month"
                        className="border rounded px-2 py-1 text-sm"
                        value={satisfactionMonth}
                        onChange={e => setSatisfactionMonth(e.target.value)}
                        placeholder="yyyy-MM"
                        style={{ minWidth: 120 }}
                      />
                    )}
                    {satisfactionFilterType === 'year' && (
                      <input
                        type="number"
                        className="border rounded px-2 py-1 text-sm"
                        value={satisfactionYear}
                        onChange={e => setSatisfactionYear(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        placeholder="yyyy"
                        style={{ minWidth: 80 }}
                      />
                    )}
                    {(satisfactionFilterType === 'day' && satisfactionDate) && (
                      <Button variant="ghost" size="icon" onClick={() => setSatisfactionDate(null)} title="ล้างวันที่">✕</Button>
                    )}
                    {(satisfactionFilterType === 'month' && satisfactionMonth) && (
                      <Button variant="ghost" size="icon" onClick={() => setSatisfactionMonth('')} title="ล้างเดือน">✕</Button>
                    )}
                    {(satisfactionFilterType === 'year' && satisfactionYear) && (
                      <Button variant="ghost" size="icon" onClick={() => setSatisfactionYear('')} title="ล้างปี">✕</Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                {filteredSatisfactionData.length > 0 ? (
                  <div className="space-y-4">
                    {filteredSatisfactionData.map((survey, index) => (
                      <div key={survey.id || survey.queue_id || index} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-800">คิว: {survey.queue_number ?? '-'}</p>
                            <p className="text-sm text-slate-500">ห้อง: {survey.room_name ?? '-'}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {survey.completed_at ? new Date(survey.completed_at).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }) : '-'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-lg text-yellow-500">{survey.rating ?? '-'}</span>
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                          </div>
                        </div>
                        {survey.comments && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md">{survey.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-slate-500">
                    <p>ยังไม่มีข้อมูลการประเมินความพึงพอใจ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function Reports() {
    return (
        <LoginGuard>
            <ReportsContent />
        </LoginGuard>
    )
}
