# การทดสอบ Path เสียง

## ตัวอย่าง Path ที่ควรจะได้

### ตัวอย่างที่ 1:
- Room ID: `92f58023-db93-44b9-8153-95ca42853dfe`
- Room Code: `A`
- Language: `th`
- Patient Type: `New` (จาก A001)
- Queue Number: `A001`

**Path:** `https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/92f58023-db93-44b9-8153-95ca42853dfe/A/th/New/A001.mp3`

### ตัวอย่างที่ 2:
- Room ID: `12345678-abcd-1234-efgh-123456789012`
- Room Code: `B`
- Language: `en`
- Patient Type: `Returning` (จาก B002)
- Queue Number: `B002`

**Path:** `https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/12345678-abcd-1234-efgh-123456789012/B/en/Returning/B002.mp3`

### ตัวอย่างที่ 3:
- Room ID: `87654321-dcba-4321-hgfe-210987654321`
- Room Code: `C`
- Language: `zh`
- Patient Type: `Appointment` (จาก C003)
- Queue Number: `C003`

**Path:** `https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/87654321-dcba-4321-hgfe-210987654321/C/zh/Appointment/C003.mp3`

## วิธีการทดสอบ

1. เปิดหน้า Monitor Display
2. สร้างคิวใหม่ (เช่น A001, B002, C003)
3. ดู Console Log ใน Developer Tools
4. ตรวจสอบว่า path ที่สร้างถูกต้องตามรูปแบบข้างต้น
5. ฟังเสียงที่เล่นออกมา

## Console Log ที่ควรเห็น

```
📍 Found room from history: {
  room_name: "ห้องตรวจ1",
  room_code: "A",
  room_id: "92f58023-db93-44b9-8153-95ca42853dfe",
  entered_at: "2025-10-03T03:08:44.869Z",
  left_at: null
}
Playing audio from: https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/92f58023-db93-44b9-8153-95ca42853dfe/A/th/New/A001.mp3
Room ID: 92f58023-db93-44b9-8153-95ca42853dfe Room code: A Queue number: A001 Patient type: New
Room history: [array of room history objects]
```

## หากไฟล์เสียงไม่พบ

จะเห็น log:
```
Error playing audio file: [error details]
Audio path: https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/92f58023-db93-44b9-8153-95ca42853dfe/A/th/New/A001.mp3
Falling back to TTS...
```

## โครงสร้างไฟล์เสียงที่ต้องมีใน Supabase Storage

```
voice-queue/
├── 92f58023-db93-44b9-8153-95ca42853dfe/  (Room ID)
│   └── A/  (Room Code)
│       ├── th/
│       │   ├── New/
│       │   │   ├── A001.mp3
│       │   │   ├── A002.mp3
│       │   │   └── ...
│       │   ├── Returning/
│       │   │   └── ...
│       │   └── Appointment/
│       │       └── ...
│       ├── en/
│       │   └── ...
│       └── zh/
│           └── ...
├── 12345678-abcd-1234-efgh-123456789012/  (Room ID)
│   └── B/  (Room Code)
│       └── ...
└── 87654321-dcba-4321-hgfe-210987654321/  (Room ID)
    └── C/  (Room Code)
        └── ...
```
