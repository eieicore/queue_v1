// Local mock entity implementations for offline/local usage

// Helper for localStorage persistence
function getLocal(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}
function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Queue ---
export const Queue = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue', {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  create: async (data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  update: async (qr_code, data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue?qr_code=eq.${qr_code}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to update queue');
    return Array.isArray(result) ? result[0] : result;
  },
  delete: async (id) => {
    let queues = getLocal('queues');
    queues = queues.filter(q => q.id !== id);
    setLocal('queues', queues);
    return true;
  },
  filter: async (params) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=eq.${encodeURIComponent(value)}`)
      .join('&');
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue?${query}`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  }
};

// --- Room ---
export const Room = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms', {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  create: async (data) => {
    const rooms = getLocal('rooms');
    const newRoom = { ...data, id: Date.now().toString() };
    rooms.push(newRoom);
    setLocal('rooms', rooms);
    return newRoom;
  },
  update: async (id, data) => {
    const rooms = getLocal('rooms');
    const idx = rooms.findIndex(r => r.id === id);
    if (idx !== -1) {
      rooms[idx] = { ...rooms[idx], ...data };
      setLocal('rooms', rooms);
      return rooms[idx];
    }
    throw new Error('Room not found');
  },
  delete: async (id) => {
    let rooms = getLocal('rooms');
    rooms = rooms.filter(r => r.id !== id);
    setLocal('rooms', rooms);
    return true;
  }
};

// --- QueueSettings ---
export const QueueSettings = {
  list: async () => getLocal('queue_settings'),
  create: async (data) => {
    setLocal('queue_settings', [data]);
    return data;
  },
  update: async (id, data) => {
    setLocal('queue_settings', [data]);
    return data;
  }
};

// --- Patient ---
export const Patient = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/patients', {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  create: async (data) => {
    const patients = getLocal('patients');
    const newPatient = { ...data, id: Date.now().toString() };
    patients.push(newPatient);
    setLocal('patients', patients);
    return newPatient;
  },
  update: async (id, data) => {
    const patients = getLocal('patients');
    const idx = patients.findIndex(p => p.id === id);
    if (idx !== -1) {
      patients[idx] = { ...patients[idx], ...data };
      setLocal('patients', patients);
      return patients[idx];
    }
    throw new Error('Patient not found');
  },
  delete: async (id) => {
    let patients = getLocal('patients');
    patients = patients.filter(p => p.id !== id);
    setLocal('patients', patients);
    return true;
  },
  filter: async (params) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=eq.${encodeURIComponent(value)}`)
      .join('&');
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/patients?${query}`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  }
};

// --- Appointment ---
export const Appointment = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/appointments', {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  create: async (data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  update: async (id, data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/appointments?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to update appointment');
    return Array.isArray(result) ? result[0] : result;
  },
  delete: async (id) => {
    let appointments = getLocal('appointments');
    appointments = appointments.filter(a => a.id !== id);
    setLocal('appointments', appointments);
    return true;
  },
  filter: async (params) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    let query = [];
    for (const key in params) {
      if (key.endsWith('_gte')) {
        const field = key.replace('_gte', '');
        query.push(`${field}=gte.${params[key]}`);
      } else {
        query.push(`${key}=eq.${params[key]}`);
      }
    }
    const queryString = query.join('&');
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/appointments?${queryString}`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  }
};

// --- SatisfactionSurvey ---
export const SatisfactionSurvey = {
  list: async () => getLocal('satisfaction_surveys'),
  create: async (data) => {
    const surveys = getLocal('satisfaction_surveys');
    const newSurvey = { ...data, id: Date.now().toString() };
    surveys.push(newSurvey);
    setLocal('satisfaction_surveys', surveys);
    return newSurvey;
  },
  update: async (id, data) => {
    const surveys = getLocal('satisfaction_surveys');
    const idx = surveys.findIndex(s => s.id === id);
    if (idx !== -1) {
      surveys[idx] = { ...surveys[idx], ...data };
      setLocal('satisfaction_surveys', surveys);
      return surveys[idx];
    }
    throw new Error('Survey not found');
  },
  delete: async (id) => {
    let surveys = getLocal('satisfaction_surveys');
    surveys = surveys.filter(s => s.id !== id);
    setLocal('satisfaction_surveys', surveys);
    return true;
  }
};

// --- User (auth) ---
let currentUser = null;
function getCurrentUser() {
  if (currentUser) return currentUser;
  const id = localStorage.getItem('currentUserId');
  if (!id) return null;
  const users = getLocal('users');
  return users.find(u => u.id === id) || null;
}
export const User = {
  list: async () => getLocal('users'),
  me: async () => getCurrentUser(),
  login: async (username, password) => {
    const users = getLocal('users');
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem('currentUserId', user.id);
      return user;
    }
    throw new Error('Invalid credentials');
  },
  logout: async () => {
    currentUser = null;
    localStorage.removeItem('currentUserId');
    return true;
  },
  update: async (id, data) => {
    const users = getLocal('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data };
      setLocal('users', users);
      if (currentUser && currentUser.id === id) currentUser = users[idx];
      if (localStorage.getItem('currentUserId') === id) localStorage.setItem('currentUserId', id);
      return users[idx];
    }
    throw new Error('User not found');
  }
};

// --- Feedback ---
export const Feedback = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/feedbacks', {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  filter: async (params) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const query = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=eq.${encodeURIComponent(value)}`)
      .join('&');
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/feedbacks?${query}`, {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  create: async (data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/feedbacks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result?.message || 'Failed to create feedback');
    return Array.isArray(result) ? result[0] : result;
  },
  update: async (id, data) => {
    const feedbacks = getLocal('feedbacks');
    const idx = feedbacks.findIndex(f => f.id === id);
    if (idx !== -1) {
      feedbacks[idx] = { ...feedbacks[idx], ...data };
      setLocal('feedbacks', feedbacks);
      return feedbacks[idx];
    }
    throw new Error('Feedback not found');
  },
  delete: async (id) => {
    let feedbacks = getLocal('feedbacks');
    feedbacks = feedbacks.filter(f => f.id !== id);
    setLocal('feedbacks', feedbacks);
    return true;
  }
};

const checkAppointment = async (patientIdValue) => {
  if (!patientIdValue.trim()) return null;
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;
  // ต้องส่ง appointment_date_gte ไปด้วย
  const appointments = await Appointment.filter({
    patient_id: patientIdValue,
    appointment_date_gte: today,
  });
  return appointments.length > 0 ? appointments[0] : null;
};