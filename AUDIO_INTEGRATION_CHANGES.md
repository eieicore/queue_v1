# การเปลี่ยนแปลงระบบเสียงใน Monitor Display

## สรุปการเปลี่ยนแปลง

ได้แก้ไขระบบการเรียกเสียงในหน้า Monitor Display ให้ดึงเสียงจาก Supabase Storage แทนการใช้ Text-to-Speech (TTS) ตามที่ร้องขอ

## ไฟล์ที่แก้ไข

- `src/pages/MonitorDisplay.jsx`

## การเปลี่ยนแปลงหลัก

### 1. เพิ่มฟังก์ชันสร้าง Path เสียง

```javascript
// Function to build audio file path from Supabase Storage
const buildAudioPath = (roomId, language, patientType, queueNumber) => {
  const baseUrl = 'https://supabase3.rg.in.th/storage/v1/object/public/voice-queue';
  return `${baseUrl}/${roomId}/${language}/${patientType}/${queueNumber}.mp3`;
};
```

### 2. ฟังก์ชันกำหนดประเภทผู้ป่วยจากหมายเลขคิว

```javascript
// Function to get patient type from queue number prefix
const getPatientTypeFromQueueNumber = (queueNumber) => {
  if (!queueNumber) return 'New';
  
  const firstChar = queueNumber.charAt(0).toUpperCase();
  switch (firstChar) {
    case 'A':
      return 'New';
    case 'B':
      return 'Returning';
    case 'C':
      return 'Appointment';
    default:
      return 'New';
  }
};
```

### 3. แก้ไขฟังก์ชัน processNextAnnouncement

- เปลี่ยนจากการใช้ TTS เป็นการเล่นไฟล์เสียงจาก Supabase Storage
- ใช้ `Audio` object เพื่อเล่นไฟล์ MP3
- มีระบบ fallback กลับไปใช้ TTS หากไฟล์เสียงไม่พบ

### 4. ฟังก์ชัน fallbackToTTS

- ใช้เมื่อไฟล์เสียงไม่พบใน Storage
- กลับไปใช้ระบบ TTS เดิม (ResponsiveVoice หรือ Web Speech API)

## โครงสร้าง Path เสียง

ตามรูปแบบที่ระบุ:
```
https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/{room_id}/{room_code}/{language}/{patient_type}/{queue_number}.mp3
```

### ตัวอย่าง:
- Room ID: `92f58023-db93-44b9-8153-95ca42853dfe` (จาก rooms array)
- Room Code: `A` (จาก rooms array)
- Language: `th`
- Patient Type: `New`
- Queue Number: `A001`

Path ที่ได้: `https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/92f58023-db93-44b9-8153-95ca42853dfe/A/th/New/A001.mp3`

**หมายเหตุ:** ระบบจะใช้ `room_id` (UUID) และ `room_code` (A, B, C) ทั้งคู่ใน path เสียง

## การทำงานของระบบ

1. เมื่อมีคิวใหม่ที่ต้องประกาศ ระบบจะสร้าง path เสียงตามข้อมูล:
   - `room_id`: ID ของห้อง (UUID จาก rooms array)
   - `room_code`: รหัสห้อง (จาก room_history ล่าสุด โดยหา room_code จาก rooms array)
   - `language`: ภาษาที่เลือก (จาก queue.language หรือ selectedLanguage)
   - `patient_type`: ประเภทผู้ป่วย (A=New, B=Returning, C=Appointment)
   - `queue_number`: หมายเลขคิว

### การหา room_code จาก room_history:

ระบบจะหาห้องล่าสุดจาก `room_history` โดย:
1. หาห้องที่มี `left_at: null` (ยังอยู่ในห้องนั้น)
2. หากไม่พบ จะใช้ห้องสุดท้ายใน history
3. ใช้ `room_name` จาก history หา `room_id` และ `room_code` ใน rooms array

2. ระบบจะพยายามเล่นไฟล์เสียงจาก Supabase Storage

3. หากไฟล์เสียงไม่พบหรือมีข้อผิดพลาด ระบบจะ fallback ไปใช้ TTS แทน

4. ระบบยังคงรองรับการเล่นเสียงแบบเดิมหากต้องการ

### ตัวอย่าง room_history:
```json
{
  "room_history": [
    {
      "left_at": "2025-10-03T03:08:44.869Z",
      "room_name": "ห้องซักประวัติ",
      "entered_at": "2025-10-03T03:04:34.876Z",
      "duration_minutes": 4
    },
    {
      "left_at": null,
      "room_id": "1",
      "room_name": "ห้องตรวจ1",
      "entered_at": "2025-10-03T03:08:44.869Z",
      "duration_minutes": null
    }
  ]
}
```

ในกรณีนี้ ระบบจะใช้ "ห้องตรวจ1" และหา room_id และ room_code ที่ตรงกับ room_name นี้ใน rooms array

## ข้อดีของการเปลี่ยนแปลง

- เสียงที่ชัดเจนและสม่ำเสมอ (ไฟล์เสียงที่บันทึกไว้)
- สามารถปรับแต่งเสียงได้ตามต้องการ
- ลดการใช้ CPU ในการสร้างเสียงจาก TTS
- รองรับหลายภาษาได้ดีขึ้น
- มีระบบ fallback ที่แข็งแกร่ง

## การทดสอบ

1. เปิดหน้า Monitor Display
2. สร้างคิวใหม่
3. ตรวจสอบ console log เพื่อดู path เสียงที่สร้าง
4. ฟังเสียงที่เล่นออกมา
5. หากไฟล์เสียงไม่พบ จะเห็น log "Falling back to TTS..."

## การแก้ไขปัญหา

### ปัญหาที่พบและแก้ไขแล้ว:
1. **PowerShell ไม่รองรับ `&&`** - ต้องใช้ `;` แทน
2. **Path เสียงไม่ถูกต้อง** - แก้ไขให้ใช้ `room_code` (A, B, C) แทน UUID
3. **NotSupportedError** - เกิดจาก path ไม่ถูกต้อง

### Path ที่ถูกต้อง:
```
https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/{room_code}/{language}/{patient_type}/{queue_number}.mp3
```

## หมายเหตุ

- ระบบจะยังคงใช้ TTS เป็น fallback หากไฟล์เสียงไม่พบ
- ต้องแน่ใจว่าไฟล์เสียงถูกอัปโหลดใน Supabase Storage ตามโครงสร้างที่กำหนด
- การตั้งค่า CORS ใน Supabase Storage ต้องอนุญาตให้เข้าถึงไฟล์เสียงได้
- `queue.room_id` ในระบบนี้จริงๆ แล้วเป็น `room_code` (เช่น A, B, C) ไม่ใช่ UUID
