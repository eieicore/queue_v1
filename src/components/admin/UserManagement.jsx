import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Edit, Save, X, UserPlus, Shield, Phone, Mail, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function UserManagement({ users = [], onSave, onCreate }) {
  const [editingUser, setEditingUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    department: '',
    position: '',
    access_level: 'staff',
    password: '',
    confirmPassword: '',
    phone: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'กรุณาระบุชื่อผู้ใช้';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'ชื่อผู้ใช้สามารถใช้ได้เฉพาะตัวอักษรภาษาอังกฤษ ตัวเลข และ _';
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'กรุณาระบุชื่อ-นามสกุล';
    }
    
    if (!formData.email) {
      newErrors.email = 'กรุณาระบุอีเมล';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'รูปแบบอีเมลไม่ถูกต้อง';
    }
    
    if (isAddingUser) {
      if (!formData.password) {
        newErrors.password = 'กรุณาระบุรหัสผ่าน';
      } else if (formData.password.length < 6) {
        newErrors.password = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEdit = (user) => {
    setEditingUser(user.id);
    setIsAddingUser(false);
    setFormData({
      ...user,
      password: '',
      confirmPassword: '',
      assigned_rooms: user.assigned_rooms || []
    });
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setIsAddingUser(true);
    setFormData({
      username: '',
      full_name: '',
      email: '',
      department: '',
      position: '',
      access_level: 'staff',
      password: '',
      confirmPassword: '',
      phone: '',
      is_active: true
    });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      if (editingUser) {
        await onSave(formData);
        toast({
          title: 'อัปเดตผู้ใช้สำเร็จ',
          description: 'ข้อมูลผู้ใช้ถูกอัปเดตเรียบร้อยแล้ว',
          variant: 'default',
        });
      } else if (isAddingUser) {
        await onCreate(formData);
        toast({
          title: 'เพิ่มผู้ใช้สำเร็จ',
          description: 'เพิ่มผู้ใช้ใหม่เรียบร้อยแล้ว',
          variant: 'default',
        });
      }
      
      setEditingUser(null);
      setIsAddingUser(false);
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setIsAddingUser(false);
    setErrors({});
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
            <Button 
              onClick={handleAddNew} 
              size="sm" 
              className="gap-2"
              disabled={isLoading}
            >
              <UserPlus className="w-4 h-4" />
              เพิ่มผู้ใช้ใหม่
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4">
            {/* Add/Edit Form */}
            {(editingUser || isAddingUser) && (
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">ชื่อผู้ใช้ <span className="text-red-500">*</span></Label>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="ชื่อผู้ใช้ (ภาษาอังกฤษเท่านั้น)"
                        disabled={!!editingUser || isLoading}
                        className={errors.username ? 'border-red-500' : ''}
                      />
                      {errors.username && (
                        <p className="text-xs text-red-500">{errors.username}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder="ชื่อ-นามสกุล"
                        disabled={isLoading}
                        className={errors.full_name ? 'border-red-500' : ''}
                      />
                      {errors.full_name && (
                        <p className="text-xs text-red-500">{errors.full_name}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">อีเมล <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="อีเมล"
                        disabled={!!editingUser || isLoading}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500">{errors.email}</p>
                      )}
                    </div>
                    {isAddingUser && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="password">รหัสผ่าน <span className="text-red-500">*</span></Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="รหัสผ่าน"
                            disabled={isLoading}
                            className={errors.password ? 'border-red-500' : ''}
                          />
                          {errors.password && (
                            <p className="text-xs text-red-500">{errors.password}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            placeholder="ยืนยันรหัสผ่าน"
                            disabled={isLoading}
                            className={errors.confirmPassword ? 'border-red-500' : ''}
                          />
                          {errors.confirmPassword && (
                            <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                          )}
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="department">แผนก</Label>
                      <Input
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        placeholder="เช่น อายุรกรรม"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">ตำแหน่ง</Label>
                      <Input
                        id="position"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        placeholder="เช่น พยาบาล"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="เบอร์โทรศัพท์"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="access_level">ระดับสิทธิ์</Label>
                      <Select
                        value={formData.access_level}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, access_level: value }))}
                        disabled={isLoading}
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
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                        disabled={isLoading}
                      />
                      <Label htmlFor="is_active">เปิดใช้งาน</Label>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleSave} 
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          กำลังดำเนินการ...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingUser ? 'อัปเดต' : 'เพิ่มผู้ใช้'}
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={handleCancel} 
                      variant="outline"
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      ยกเลิก
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users List */}
            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">ยังไม่มีผู้ใช้งาน</h3>
                <p className="text-gray-500 mb-4">เริ่มต้นด้วยการเพิ่มผู้ใช้ใหม่</p>
                <Button onClick={handleAddNew} disabled={isLoading}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  เพิ่มผู้ใช้ใหม่
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้ใช้</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">แผนก</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.username || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 rounded-full text-white font-bold">
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.full_name || '-'}</div>
                              <div className="text-sm text-gray-500">{user.position || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email || '-'}</div>
                          {user.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="w-3 h-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.department || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {user.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            แก้ไข
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}