require('dotenv').config({ path: '.env.local' });
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET /queues - ดึงข้อมูลคิวทั้งหมด
app.get('/queues', async (req, res) => {
  const { data, error } = await supabase
    .from('queues')
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /queues - เพิ่มคิวใหม่
app.post('/queues', async (req, res) => {
  const { patient_id, doctor_id, queue_number, status } = req.body;
  const { data, error } = await supabase
    .from('queues')
    .insert([
      { patient_id, doctor_id, queue_number, status }
    ])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 