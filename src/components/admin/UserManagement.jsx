import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Edit, Save, X, UserPlus, Shield, Phone, Mail } from 'lucide-react';

export default function UserManagement({ users, onSave }) {
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    department: '',
    position: '',
    access_level: 'staff',
    assigned_rooms: [],
    phone: '',
    is_active: true
  });

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setFormData({
      ...user,
      assigned_rooms: user.assigned_rooms || []
    });
  };

  const handleSave = async () => {
    await onSave(formData);
    setEditingUser(null);
  };

  const handleCancel = () => {
    setEditingUser(null);
  };

  const getAccessLevelColor = (level) => {
    switch (level) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'staff': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelLabel = (level) => {
    switch (level) {
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'staff': return 'เจ้าหน้าที่';
      case 'viewer': return 'ผู้ดู';
      default: return 'ไม่ระบุ';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              จัดการผู้ใช้งาน
            </CardTitle>
            <div className="text-sm text-slate-500">
              <Shield className="w-4 h-4 inline mr-1" />
              ใช้ระบบเชิญผู้ใช้เพื่อเพิ่มสมาชิกใหม่
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {/* Edit Form */}
            {editingUser && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full-name">ชื่อ-นามสกุล</Label>
                      <Input
                        id="full-name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        placeholder="ชื่อ-นามสกุล"
                        disabled
                      />
                      <p className="text-xs text-slate-500">ไม่สามารถแก้ไขได้</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">อีเมล</Label>
                      <Input
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="อีเมล"
                        disabled
                      />
                      <p className="text-xs text-slate-500">ไม่สามารถแก้ไขได้</p>
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
                      <Label htmlFor="position">ตำแหน่ง</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({...formData, position: e.target.value})}
                        placeholder="เช่น พยาบาล"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="เบอร์โทรศัพท์"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="access-level">ระดับสิทธิ์</Label>
                      <Select
                        value={formData.access_level}
                        onValueChange={(value) => setFormData({...formData, access_level: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกระดับสิทธิ์" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">ผู้ดู (Viewer)</SelectItem>
                          <SelectItem value="staff">เจ้าหน้าที่ (Staff)</SelectItem>
                          <SelectItem value="admin">ผู้ดูแลระบบ (Admin)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2 md:col-span-2">
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                      />
                      <Label>เปิดใช้งาน</Label>
                    </div>
                  </div>
                  
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

            {/* Users List */}
            {users.map((user) => (
              <Card key={user.id} className="border border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900">{user.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Phone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {user.department && (
                            <Badge variant="outline" className="text-xs">
                              {user.department}
                            </Badge>
                          )}
                          {user.position && (
                            <Badge variant="outline" className="text-xs">
                              {user.position}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getAccessLevelColor(user.access_level)}>
                        {getAccessLevelLabel(user.access_level)}
                      </Badge>
                      <Badge variant={user.is_active ? "default" : "secondary"}>
                        {user.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </Badge>
                      <Button
                        onClick={() => handleEdit(user)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="w-4 h-4" />
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
  );
}