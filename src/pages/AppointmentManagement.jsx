import React, { useState, useEffect } from 'react';
import { Appointment, Patient, Room, Queue } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Search,
  User,
  Phone,
  Mail,
  Save,
  X,
  Download
} from 'lucide-react';

import LoginGuard from '../components/auth/LoginGuard';
import PermissionGuard from '../components/auth/PermissionGuard';
import * as XLSX from 'xlsx';

function AppointmentManagementContent() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    appointment_date: '',
    appointment_time: '',
    room_id: '',
    doctor_name: '',
    department: '',
    appointment_type: 'follow_up',
    notes: '',
    phone: '',
    status: 'scheduled'
  });
  const [patientSearched, setPatientSearched] = useState(false);

  useEffect(() => {
    loadData();
    // ไม่ใช้ auto-refresh สำหรับหน้านี้ เพื่อลด API calls
    
    // Cleanup timeout on unmount
    return () => {
      if (autocompleteTimeout) {
        clearTimeout(autocompleteTimeout);
      }
    };
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsData, patientsData, roomsData] = await Promise.all([
        Appointment.list('-appointment_date'),
        Patient.list(),
        Room.list()
      ]);

      setAppointments(appointmentsData);
      setPatients(patientsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 429) {
        setMessage('ระบบกำลังยุ่ง กรุณารอสักครู่แล้วลองใหม่');
        setTimeout(() => setMessage(''), 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if patient is searched and found
    if (!patientSearched || !formData.patient_name) {
      setMessage('กรุณาค้นหาและยืนยันข้อมูลผู้ป่วยก่อนบันทึกการนัดหมาย');
      if (!formData.patient_id) {
        document.getElementById('patient-search')?.focus();
      }
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Validate required fields
    const requiredFields = [
      { field: 'patient_name', label: 'ชื่อ-นามสกุล' },
      { field: 'appointment_date', label: 'วันที่นัด' },
      { field: 'appointment_time', label: 'เวลานัด' },
      { field: 'room_id', label: 'ห้องตรวจ' },
      { field: 'appointment_type', label: 'ประเภทการนัด' }
    ];

    // Check for empty required fields
    const emptyFields = requiredFields.filter(({ field }) =>
      !formData[field] || String(formData[field]).trim() === ''
    );

    if (emptyFields.length > 0) {
      const fieldNames = emptyFields.map(({ label }) => label).join(', ');
      setMessage(`กรุณากรอกข้อมูลให้ครบถ้วน: ${fieldNames}`);
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Validate appointment date (not in the past)
    const appointmentDate = new Date(formData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      setMessage('ไม่สามารถนัดหมายในวันที่ผ่านมาแล้วได้');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    // Validate appointment time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.appointment_time)) {
      setMessage('รูปแบบเวลาไม่ถูกต้อง กรุณาใช้รูปแบบ HH:MM');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    try {
      if (editingAppointment) {
        await Appointment.update(editingAppointment.id, formData);
        setMessage('อัพเดตการนัดหมายเรียบร้อยแล้ว');
      } else {
        await Appointment.create(formData);
        setMessage('สร้างการนัดหมายเรียบร้อยแล้ว');
      }

      setShowAddDialog(false);
      setEditingAppointment(null);
      resetForm();
      loadData();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData(appointment);
    setShowAddDialog(true);
  };

  const handleDelete = async (id) => {
    if (confirm('คุณแน่ใจที่จะลบการนัดหมายนี้?')) {
      try {
        // 1. ดึง appointment ที่จะลบ
        const appointment = appointments.find(a => a.id === id);

        // 2. ลบ queue ที่เกี่ยวข้อง (ถ้ามี)
        if (appointment) {
          try {
            const relatedQueues = await Queue.filter({
              patient_id: appointment.patient_id,
              room_id: appointment.room_id,
              appointment_time: appointment.appointment_time,
              appointment_type: appointment.appointment_type,
              department: appointment.department,
              doctor_name: appointment.doctor_name
            });
            console.log('relatedQueues', relatedQueues);
            for (const q of relatedQueues) {
              await Queue.delete(q.id);
            }
          } catch (err) {
            console.error('Error deleting related queues:', err);
          }
        }

        // 3. ลบ appointment
        console.log('Deleting appointment ID:', id);
        await Appointment.delete(id);
        console.log('Appointment deleted successfully');

        // ลบออกจาก state ทันที
        setAppointments(prev => prev.filter(a => a.id !== id));

        setMessage('ลบการนัดหมายเรียบร้อยแล้ว');
        // ไม่ต้องเรียก loadData() ก็ได้
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Delete error:', error);
        setMessage('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      patient_id: '',
      patient_name: '',
      appointment_date: '',
      appointment_time: '',
      room_id: '',
      doctor_name: '',
      department: '',
      appointment_type: 'follow_up',
      notes: '',
      phone: '',
      status: 'scheduled'
    });
    setPatientSearched(false);
    setSearchError('');
    setIsSearching(false);
  };

  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false);
  const [autocompleteTimeout, setAutocompleteTimeout] = useState(null);

  const searchPatientAutocomplete = async (query) => {
    if (!query || query.trim() === '') {
      setAutocompleteSuggestions([]);
      setShowSuggestions(false);
      setIsAutocompleteLoading(false);
      return;
    }

    // Clear previous timeout
    if (autocompleteTimeout) {
      clearTimeout(autocompleteTimeout);
    }

    // Set loading state
    setIsAutocompleteLoading(true);

    // Debounce the API call by 300ms
    const timeout = setTimeout(async () => {
      try {
        // ยิง API ไปค้นหาผู้ป่วยจริงๆ
        const allPatients = await Patient.list();
        
        // ค้นหาผู้ป่วยที่ตรงกับ query (ชื่อ, นามสกุล, หรือรหัสบัตร)
        const filteredPatients = allPatients.filter(patient => {
          const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.toLowerCase();
          const idCard = (patient.id_card || '').toLowerCase();
          const hnNumber = (patient.hn_number || '').toLowerCase();
          const searchQuery = query.toLowerCase();
          
          return fullName.includes(searchQuery) || 
                 idCard.includes(searchQuery) || 
                 hnNumber.includes(searchQuery);
        });

        // จำกัดผลลัพธ์ให้แสดงแค่ 5 รายการ
        const suggestions = filteredPatients.slice(0, 5).map(patient => ({
          id: patient.id,
          name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
          idCard: patient.id_card || patient.hn_number || '',
          phone: patient.phone || ''
        }));

        setAutocompleteSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error searching patients for autocomplete:', error);
        setAutocompleteSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsAutocompleteLoading(false);
      }
    }, 300);

    setAutocompleteTimeout(timeout);
  };

  const searchPatient = async (query) => {
    if (!query) {
      setPatientSearched(false);
      setSearchError('');
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setShowSuggestions(false);

    try {
      const patient = await Patient.findByHNOrIDCard(query);
      if (patient) {
        setFormData(prev => ({
          ...prev,
          patient_id: patient.id_card || patient.hn_number,
          patient_name: `${patient.first_name} ${patient.last_name}`.trim(),
          phone: patient.phone || ''
        }));
        setPatientSearched(true);
      } else {
        setFormData(prev => ({
          ...prev,
          patient_id: query, // Keep the search query for reference
          patient_name: '',
          phone: ''
        }));
        setPatientSearched(false);
        setSearchError('ไม่พบข้อมูลผู้ป่วย กรุณาตรวจสอบเลขบัตรประชาชนหรือ HN อีกครั้ง');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setPatientSearched(false);
      setSearchError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSearching(false);
    }
  };

  const selectPatientFromSuggestion = (suggestion) => {
    setFormData(prev => ({
      ...prev,
      patient_id: suggestion.idCard,
      patient_name: suggestion.name,
      phone: suggestion.phone
    }));
    setPatientSearched(true);
    setShowSuggestions(false);
    setAutocompleteSuggestions([]);
    setSearchError('');
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.patient_id.includes(searchTerm);
    const matchesDate = selectedDate === '' || appointment.appointment_date === selectedDate;
    return matchesSearch && matchesDate;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'scheduled': return 'นัดหมาย';
      case 'checked_in': return 'เช็คอิน';
      case 'completed': return 'เสร็จสิ้น';
      case 'cancelled': return 'ยกเลิก';
      case 'no_show': return 'ไม่มา';
      default: return status;
    }
  };
  const exportToExcel = () => {
    // Prepare data for export
    const dataToExport = appointments.map(appointment => {
      const patient = patients.find(p => p.id === appointment.patient_id) || {};
      const room = rooms.find(r => r.id === appointment.room_id) || {};

      return {
        'วันที่นัด': appointment.appointment_date,
        'เวลานัด': appointment.appointment_time,
        'เลขบัตรประชาชน/HN': patient.id_card_number || patient.hn_number || appointment.patient_id,
        'ชื่อ-นามสกุล': patient.name || appointment.patient_name,
        'เบอร์โทร': patient.phone || appointment.phone || '-',
        'ห้องตรวจ': room.room_name || room.name || appointment.room_id,
        'แพทย์': appointment.doctor_name || '-',
        'แผนก': appointment.department || '-',
        'ประเภทการนัด': appointment.appointment_type === 'follow_up' ? 'นัดติดตาม' : 'นัดใหม่',
        'สถานะ': getStatusLabel(appointment.status),
        'หมายเหตุ': appointment.notes || '-'
      };
    });

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'รายการนัดหมาย');

    // Generate Excel file
    const fileName = `รายการนัดหมาย_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900">จัดการการนัดหมาย</h1>
          <p className="text-slate-600">ระบบจัดการการนัดหมายผู้ป่วย</p>
        </div>

        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <div className="flex justify-between items-center">
              
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                การนัดหมาย
              </CardTitle>
              <div className="flex gap-2">
              <Button
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white ml-2"
                onClick={exportToExcel}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ส่งออก Excel
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { resetForm(); setEditingAppointment(null); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มการนัดหมาย
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" aria-describedby="appointment-form-desc">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAppointment ? 'แก้ไขการนัดหมาย' : 'เพิ่มการนัดหมาย'}
                    </DialogTitle>
                  </DialogHeader>

                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="patient-search">ค้นหาผู้ป่วย (ID Card/HN) <span className="text-red-500">*</span></Label>
                            <div className="space-y-1">
                              <div className="relative">
                                <Input
                                  id="patient-search"
                                  placeholder="กรอกเลขบัตรประชาชนหรือ HN *"
                                  value={formData.patient_id || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setFormData(prev => ({
                                      ...prev,
                                      patient_id: value,
                                      patient_name: value === '' ? '' : prev.patient_name
                                    }));
                                    if (value === '') {
                                      setPatientSearched(false);
                                      setSearchError('');
                                      setShowSuggestions(false);
                                    } else {
                                      // เรียก autocomplete เมื่อพิมพ์ 3 ตัวอักษรขึ้นไป
                                      searchPatientAutocomplete(value);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      if (showSuggestions && selectedSuggestionIndex >= 0) {
                                        selectPatientFromSuggestion(autocompleteSuggestions[selectedSuggestionIndex]);
                                      } else {
                                        searchPatient(e.target.value);
                                      }
                                    } else if (e.key === 'ArrowDown') {
                                      e.preventDefault();
                                      setSelectedSuggestionIndex(prev => 
                                        prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                                      );
                                    } else if (e.key === 'ArrowUp') {
                                      e.preventDefault();
                                      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                                    } else if (e.key === 'Escape') {
                                      setShowSuggestions(false);
                                      setSelectedSuggestionIndex(-1);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // หน่วงเวลาการซ่อน suggestions เพื่อให้คลิกได้
                                    setTimeout(() => {
                                      setShowSuggestions(false);
                                      setSelectedSuggestionIndex(-1);
                                    }, 200);
                                  }}
                                  onFocus={() => {
                                    if (autocompleteSuggestions.length > 0) {
                                      setShowSuggestions(true);
                                    }
                                  }}
                                  required
                                  className={`pr-10 ${searchError ? 'border-red-500' : ''} ${patientSearched ? 'bg-green-50 border-green-500' : ''}`}
                                  disabled={isSearching}
                                />
                                <Button
                                  type="button"
                                  variant={patientSearched ? 'outline' : 'default'}
                                  className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${patientSearched ? 'bg-green-100 hover:bg-green-200 text-green-700' : ''}`}
                                  onClick={() => searchPatient(formData.patient_id)}
                                  disabled={isSearching || !formData.patient_id}
                                >
                                  {isSearching ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                  ) : patientSearched ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                  ) : (
                                    <Search className="w-4 h-4" />
                                  )}
                                </Button>
                                
                                {/* Autocomplete Suggestions */}
                                {showSuggestions && (
                                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {isAutocompleteLoading ? (
                                      <div key="loading" className="px-4 py-3 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                          กำลังค้นหา...
                                        </div>
                                      </div>
                                    ) : autocompleteSuggestions.length > 0 ? (
                                      autocompleteSuggestions.map((suggestion, index) => (
                                        <div
                                          key={suggestion.id || `suggestion-${index}`}
                                          className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-blue-50 ${
                                            index === selectedSuggestionIndex ? 'bg-blue-50' : ''
                                          }`}
                                          onClick={() => selectPatientFromSuggestion(suggestion)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div>
                                              <div className="font-medium text-gray-900">{suggestion.name}</div>
                                              <div className="text-sm text-gray-500">รหัสบัตร: {suggestion.idCard}</div>
                                            </div>
                                            {suggestion.phone && (
                                              <div className="text-sm text-gray-400">{suggestion.phone}</div>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div key="no-results" className="px-4 py-3 text-center text-gray-500">
                                        ไม่พบข้อมูลผู้ป่วย
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              {searchError && (
                                <p className="text-sm text-red-500">{searchError}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="patient-name">
                              ชื่อ-นามสกุล <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="patient-name"
                              value={formData.patient_name}
                              readOnly
                              className="bg-gray-100"
                              placeholder="ชื่อ-นามสกุล (จะถูกเติมให้อัตโนมัติหลังค้นหา)"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="appointment-date">
                              วันที่นัด <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="appointment-date"
                              type="date"
                              value={formData.appointment_date}
                              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                              min={new Date().toISOString().split('T')[0]}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="appointment-time">
                              เวลานัด <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="appointment-time"
                              type="time"
                              value={formData.appointment_time}
                              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="room">
                              ห้อง <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.room_id}
                              onValueChange={(value) => {
                                const room = rooms.find(r => r.room_code === value);
                                setFormData({
                                  ...formData,
                                  room_id: value,
                                  department: room?.department || ''
                                });
                              }}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกห้อง" />
                              </SelectTrigger>
                              <SelectContent>
                                {rooms.map(room => (
                                  <SelectItem key={room.id} value={room.room_code}>
                                    {room.room_name} - {room.department}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="doctor">ชื่อแพทย์ <span className="text-red-500">*</span></Label>
                            <Input
                              id="doctor"
                              value={formData.doctor_name}
                              onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                              placeholder="ชื่อแพทย์"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="appointment-type">
                              ประเภทการนัด <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={formData.appointment_type}
                              onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
                              required
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="เลือกประเภท" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="follow_up">ตรวจติดตาม</SelectItem>
                                <SelectItem value="check_up">ตรวจสุขภาพ</SelectItem>
                                <SelectItem value="consultation">ปรึกษา</SelectItem>
                                <SelectItem value="procedure">หัตถการ</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="phone">เบอร์โทรติดต่อ</Label>
                            <Input
                              id="phone"
                              value={formData.phone}
                              onChange={(e) => {
                                const onlyNumbers = e.target.value.replace(/\D/g, ''); // เอาเฉพาะตัวเลข
                                if (onlyNumbers.length <= 10) {
                                  setFormData({ ...formData, phone: onlyNumbers });
                                }
                              }}
                              placeholder="เบอร์โทรติดต่อ"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">หมายเหตุ</Label>
                          <Input
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="หมายเหตุ (ถ้ามี)"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowAddDialog(false);
                              setEditingAppointment(null);
                              resetForm();
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            ยกเลิก
                          </Button>
                          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            <Save className="w-4 h-4 mr-2" />
                            บันทึก
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </DialogContent>
              </Dialog>
            </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="ค้นหาด้วยชื่อหรือรหัสผู้ป่วย..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-48">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredAppointments.map((appointment) => (
                <Card key={appointment.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{appointment.patient_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {appointment.appointment_date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {appointment.appointment_time}
                            </div>
                            <div>ห้อง: {appointment.room_id}</div>
                            {appointment.doctor_name && <div>แพทย์: {appointment.doctor_name}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                        <Button
                          onClick={() => handleEdit(appointment)}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(appointment.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AppointmentManagement() {
  return (
    <LoginGuard>
      <PermissionGuard requiredLevel="staff">
        <AppointmentManagementContent />
      </PermissionGuard>
    </LoginGuard>
  );
}
