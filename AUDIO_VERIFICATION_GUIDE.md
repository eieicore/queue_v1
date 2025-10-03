# คู่มือตรวจสอบเสียงจาก Supabase Storage

## วิธีการตรวจสอบว่าเสียงออกมาจาก Supabase Storage จริงหรือไม่

### 1. เปิด Developer Console

1. เปิดหน้า Monitor Display
2. กด `F12` หรือ `Ctrl+Shift+I` เพื่อเปิด Developer Tools
3. ไปที่แท็บ **Console**

### 2. ดู Console Log เมื่อมีเสียงประกาศ

เมื่อมีคิวใหม่ที่ต้องประกาศ คุณจะเห็น log ดังนี้:

#### ✅ หากเสียงมาจาก Supabase Storage:
```
🔍 Checking if audio file exists at: https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/A/th/New/A001.mp3
📡 Response status: 200
📡 Response headers: {content-length: "12345", content-type: "audio/mpeg", ...}
✅ Audio file found in Supabase Storage!
🎵 File size: 12345 bytes
🎵 Content type: audio/mpeg
🎵 Audio loading started from Supabase Storage
🎵 Audio ready to play from Supabase Storage
▶️ Attempting to play audio from Supabase Storage...
🎵 Audio is now playing from Supabase Storage
✅ Successfully started playing audio from Supabase Storage!
🎵 Audio playback completed from Supabase Storage
```

#### ❌ หากไฟล์เสียงไม่พบ จะใช้ TTS:
```
🔍 Checking if audio file exists at: https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/A/th/New/A001.mp3
📡 Response status: 404
❌ Audio file not found in Supabase Storage (Status: 404)
🔄 Falling back to TTS...
🔊 Using TTS Fallback (audio file not found in Supabase Storage)
📝 Queue: A001 Room: A Language: th
🔊 TTS Text: ขอเชิญคิว A001 เข้ารับบริการที่ ห้องตรวจ 1
🔊 Using ResponsiveVoice TTS
🔊 TTS started (ResponsiveVoice)
🔊 TTS completed (ResponsiveVoice)
```

### 3. ใช้ปุ่มทดสอบเสียง

1. ลองดูที่ด้านล่างของหน้า Monitor Display
2. คลิกปุ่ม **"ทดสอบเสียง"**
3. ดู Console Log ที่แสดงผลการทดสอบ

### 4. ตรวจสอบการทดสอบอัตโนมัติ

เมื่อโหลดหน้า Monitor Display เสร็จ ระบบจะทดสอบไฟล์เสียงสำหรับคิวที่กำลังให้บริการ:

```
🧪 Testing audio files for serving queues...
🧪 Testing audio file existence: https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/A/th/New/A001.mp3
🧪 Audio file exists: true Status: 200
🧪 File size: 12345 bytes
🧪 Content type: audio/mpeg
```

### 5. สัญญาณบ่งบอก

#### เสียงมาจาก Supabase Storage ✅:
- เห็น ✅ emoji ใน console
- เห็น "Audio file found in Supabase Storage!"
- เห็น "Successfully started playing audio from Supabase Storage!"
- ไม่เห็น "Using TTS Fallback"

#### เสียงมาจาก TTS ❌:
- เห็น ❌ emoji ใน console
- เห็น "Audio file not found in Supabase Storage"
- เห็น "Using TTS Fallback"
- เห็น "TTS started" และ "TTS completed"

### 6. ตัวอย่าง Path ที่ถูกต้อง

```
https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/{room_code}/{language}/{patient_type}/{queue_number}.mp3
```

**ตัวอย่าง:**
- Room Code: `A`
- Language: `th`
- Patient Type: `New`
- Queue Number: `A001`

**Path:** `https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/A/th/New/A001.mp3`

### 7. การแก้ไขปัญหา

หากเสียงไม่มาจาก Supabase Storage:

1. **ตรวจสอบ Path**: ดูว่า path ที่สร้างถูกต้องหรือไม่
2. **ตรวจสอบไฟล์**: ตรวจสอบว่าไฟล์เสียงมีอยู่ใน Supabase Storage หรือไม่
3. **ตรวจสอบ CORS**: ตรวจสอบการตั้งค่า CORS ใน Supabase Storage
4. **ตรวจสอบสิทธิ์**: ตรวจสอบว่าไฟล์เป็น public หรือไม่

### 8. การทดสอบด้วย URL โดยตรง

ลองเปิด URL เสียงโดยตรงใน browser:
```
https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/A/th/New/A001.mp3
```

หากได้ยินเสียง = ไฟล์มีอยู่
หากไม่เห็นเสียง = ไฟล์ไม่มีอยู่หรือมีปัญหา
