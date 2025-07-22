import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Edit, Save, X, Languages, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function RoomManagement({ rooms, onSave, onDelete }) {
  const [editingRoom, setEditingRoom] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortedRooms, setSortedRooms] = useState([]);
  const [formData, setFormData] = useState({
    room_name: '',
    room_code: '',
    department: '',
    is_active: true,
    staff_assigned: '',
    average_service_time: 15,
    display_order: 0,
    room_names: {
      th: '',
      en: '',
      zh: ''
    }
  });

  React.useEffect(() => {
    // จัดเรียงห้องตาม display_order
    const sorted = [...rooms].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    setSortedRooms(sorted);
  }, [rooms]);

  const handleEdit = (room) => {
    setEditingRoom(room.room_code); 
    setFormData({
      ...room,
      room_names: room.room_names ? {
        th: room.room_names.th || room.room_name || '',
        en: room.room_names.en || '',
        zh: room.room_names.zh || ''
      } : {
        th: room.room_name || '',
        en: '',
        zh: ''
      }
    });
    setShowAddForm(false);
  };

  const handleAdd = () => {
    setEditingRoom(null);
    setFormData({
      room_name: '',
      room_code: '',
      department: '',
      is_active: true,
      staff_assigned: '',
      average_service_time: 15,
      display_order: rooms.length,
      room_names: {
        th: '',
        en: '',
        zh: ''
      }
    });
    setShowAddForm(true);
  };

  const handleSave = async () => {
    // Make sure room_name is synced with Thai name
    const finalData = {
      ...formData,
      room_name: formData.room_names.th || formData.room_name
    };
    
    await onSave(finalData);
    setEditingRoom(null);
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setEditingRoom(null);
    setShowAddForm(false);
  };

  const updateRoomName = (language, value) => {
    const newRoomNames = {
      ...formData.room_names,
      [language]: value
    };
    
    setFormData({
      ...formData,
      room_names: newRoomNames,
      // Update main room_name if Thai language is being changed
      ...(language === 'th' && { room_name: value })
    });
  };

  const handleRoomNameChange = (value) => {
    setFormData({
      ...formData,
      room_name: value,
      room_names: {
        ...formData.room_names,
        th: value
      }
    });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const newSortedRooms = Array.from(sortedRooms);
    const [reorderedRoom] = newSortedRooms.splice(result.source.index, 1);
    newSortedRooms.splice(result.destination.index, 0, reorderedRoom);

    // อัพเดต display_order
    const updatedRooms = newSortedRooms.map((room, index) => ({
      ...room,
      display_order: index
    }));

    setSortedRooms(updatedRooms);

    // บันทึกการเปลี่ยนแปลงลงฐานข้อมูล
    try {
      for (const room of updatedRooms) {
        await onSave(room);
      }
    } catch (error) {
      console.error('Error updating room order:', error);
    }
  };

  const moveRoomUp = async (index) => {
    if (index === 0) return;
    
    const newSortedRooms = [...sortedRooms];
    [newSortedRooms[index], newSortedRooms[index - 1]] = [newSortedRooms[index - 1], newSortedRooms[index]];
    
    const updatedRooms = newSortedRooms.map((room, i) => ({
      ...room,
      display_order: i
    }));

    setSortedRooms(updatedRooms);

    try {
      // Only save the two moved rooms, as their order changed
      await onSave(updatedRooms[index]);
      await onSave(updatedRooms[index - 1]);
    } catch (error) {
      console.error('Error moving room up:', error);
    }
  };

  const moveRoomDown = async (index) => {
    if (index === sortedRooms.length - 1) return;
    
    const newSortedRooms = [...sortedRooms];
    [newSortedRooms[index], newSortedRooms[index + 1]] = [newSortedRooms[index + 1], newSortedRooms[index]];
    
    const updatedRooms = newSortedRooms.map((room, i) => ({
      ...room,
      display_order: i
    }));

    setSortedRooms(updatedRooms);

    try {
      // Only save the two moved rooms, as their order changed
      await onSave(updatedRooms[index]);
      await onSave(updatedRooms[index + 1]);
    } catch (error) {
      console.error('Error moving room down:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              จัดการห้องตรวจ
            </CardTitle>
            <Button onClick={handleAdd} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มห้องใหม่
            </Button>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            <GripVertical className="w-4 h-4 inline mr-1" />
            ลากวางเพื่อจัดเรียงลำดับห้อง หรือใช้ปุ่มลูกศรเพื่อเลื่อนขึ้น-ลง
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {/* Add/Edit Form */}
            {(showAddForm || editingRoom) && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <Tabs defaultValue="basic" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="basic">ข้อมูลพื้นฐาน</TabsTrigger>
                      <TabsTrigger value="languages" className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        ชื่อหลายภาษา
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="basic">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="room-name">ชื่อห้อง (ไทย)</Label>
                          <Input
                            id="room-name"
                            value={formData.room_name}
                            onChange={(e) => handleRoomNameChange(e.target.value)}
                            placeholder="เช่น ห้องตรวจ 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="room-code">รหัสห้อง</Label>
                          <Input
                            id="room-code"
                            value={formData.room_code}
                            onChange={(e) => setFormData({...formData, room_code: e.target.value.toUpperCase()})}
                            placeholder="เช่น A, B, C"
                            maxLength={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">แผนก</Label>
                          <Input
                            id="department"
                            value={formData.department}
                            onChange={(e) => setFormData({...formData, department: e.target.value})}
                            placeholder="เช่น อายุรกรรม"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff">เจ้าหน้าที่ประจำ</Label>
                          <Input
                            id="staff"
                            value={formData.staff_assigned}
                            onChange={(e) => setFormData({...formData, staff_assigned: e.target.value})}
                            placeholder="เช่น นพ.สมชาย"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="service-time">เวลาบริการเฉลี่ย (นาที)</Label>
                          <Input
                            id="service-time"
                            type="number"
                            value={formData.average_service_time}
                            onChange={(e) => setFormData({...formData, average_service_time: parseInt(e.target.value) || 0})}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                          />
                          <Label>เปิดใช้งาน</Label>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="languages">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name-th">ภาษาไทย</Label>
                          <Input
                            id="name-th"
                            value={formData.room_names.th}
                            onChange={(e) => updateRoomName('th', e.target.value)}
                            placeholder="ห้องตรวจ 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name-en">English</Label>
                          <Input
                            id="name-en"
                            value={formData.room_names.en}
                            onChange={(e) => updateRoomName('en', e.target.value)}
                            placeholder="Examination Room 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name-zh">中文</Label>
                          <Input
                            id="name-zh"
                            value={formData.room_names.zh}
                            onChange={(e) => updateRoomName('zh', e.target.value)}
                            placeholder="检查室1"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-900 mb-2">ตัวอย่างการประกาศ:</h4>
                        <div className="text-sm text-slate-600 space-y-1">
                          <p><strong>ไทย:</strong> คิวหมายเลข A001 กรุณาเข้า{formData.room_names.th || 'ห้องตรวจ'}</p>
                          <p><strong>English:</strong> Queue A001, please proceed to {formData.room_names.en || 'Examination Room'}</p>
                          <p><strong>中文:</strong> A001号，请到{formData.room_names.zh || '检查室'}</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      บันทึก
                    </Button>
                    <Button onClick={handleCancel} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      ยกเลิก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Draggable Rooms List */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="rooms">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {sortedRooms.map((room, index) => (
                      <Draggable key={room.room_code} draggableId={room.room_code.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`mb-4 ${snapshot.isDragging ? 'z-50' : ''}`}
                          >
                            <Card className={`border border-slate-200 ${snapshot.isDragging ? 'shadow-lg rotate-3' : ''}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-center gap-1">
                                      <div {...provided.dragHandleProps} className="cursor-move p-1 hover:bg-slate-100 rounded">
                                        <GripVertical className="w-5 h-5 text-slate-400" />
                                      </div>
                                      <div className="flex flex-col">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => moveRoomUp(index)}
                                          disabled={index === 0}
                                          className="h-6 w-6 p-0"
                                        >
                                          <ChevronUp className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => moveRoomDown(index)}
                                          disabled={index === sortedRooms.length - 1}
                                          className="h-6 w-6 p-0"
                                        >
                                          <ChevronDown className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                      {room.room_code}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-slate-900">{room.room_name}</h3>
                                      <p className="text-sm text-slate-500">{room.department}</p>
                                      {room.staff_assigned && (
                                        <p className="text-sm text-slate-600">เจ้าหน้าที่: {room.staff_assigned}</p>
                                      )}
                                      {room.room_names && (room.room_names.th || room.room_names.en || room.room_names.zh) && (
                                        <div className="text-xs text-slate-500 mt-1">
                                          <Languages className="w-3 h-3 inline mr-1" />
                                          รองรับหลายภาษา
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={room.is_active ? "default" : "secondary"}>
                                      {room.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                                    </Badge>
                                    <Badge variant="outline">
                                      {room.average_service_time} นาที
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-50">
                                      ลำดับ {index + 1}
                                    </Badge>
                                    <Button
                                      onClick={() => handleEdit(room)}
                                      variant="outline"
                                      size="icon"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      onClick={() => onDelete(room.room_code)}
                                      variant="outline"
                                      size="icon"
                                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
