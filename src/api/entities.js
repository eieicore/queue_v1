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
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms', {
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
  update: async (room_code, data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms?room_code=eq.${room_code}`, {
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
    if (!res.ok) throw new Error(result?.message || 'Failed to update room');
    return Array.isArray(result) ? result[0] : result;
  },
  delete: async (room_code) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms?room_code=eq.${room_code}`, {
      method: 'DELETE',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return res.ok;
  }
};

// --- QueueSettings ---
export const QueueSettings = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    try {
      const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue_settings?select=*', {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      const data = await res.json();
      if (data.length > 0) {
        return data;
      } else {
        // Create a default settings object with a temporary ID
        const defaultSettings = {
          id: 'default-settings',
          ticket_format: {
            new_patient_prefix: 'N',
            returning_patient_prefix: 'R',
            appointment_prefix: 'A'
          },
          voice_announcements: true,
          auto_skip_timeout: 5,
          email_notifications: false,
          working_hours: {
            monday: { open: '08:00', close: '17:00' },
            tuesday: { open: '08:00', close: '17:00' },
            wednesday: { open: '08:00', close: '17:00' },
            thursday: { open: '08:00', close: '17:00' },
            friday: { open: '08:00', close: '17:00' },
            saturday: { open: '08:00', close: '12:00' },
            sunday: { open: '00:00', close: '00:00' }
          },
          actions: 'default',
          created_at: new Date().toISOString()
        };
        return [defaultSettings];
      }
    } catch (error) {
      console.error('Error fetching queue settings:', error);
      return [];
    }
  },
  create: async (data) => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue_settings', {
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
    
    try {
      // First, check if the record exists
      const checkRes = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue_settings?id=eq.${id}`, {
        headers: {
          'apikey': API_KEY,
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      
      const existingRecords = await checkRes.json();
      
      if (existingRecords && existingRecords.length > 0) {
        // Update existing record
        const res = await fetch(`https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue_settings?id=eq.${id}`, {
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
        return result;
      } else {
        // If no record exists with this ID, create a new one
        const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue_settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': API_KEY,
            'Authorization': `Bearer ${API_KEY}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ ...data, id })
        });
        const result = await res.json();
        return result;
      }
    } catch (error) {
      console.error('Error in QueueSettings.update:', error);
      throw error;
    }
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
  const users = getLocal('user');
  return users.find(u => u.id === id) || null;
}
export const User = {
  list: async () => {
    const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY';
    const res = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/user', {
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    return await res.json();
  },
  me: async () => getCurrentUser(),
  login: async (username, password) => {
    const users = getLocal('user');
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