// src/Pages.jsx
import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './Layout';
import Dashboard from './Dashboard';
import QueueCalling from './QueueCalling';
import AdminManagement from './AdminManagement';
import MonitorDisplay from './MonitorDisplay';
import TicketKiosk from './TicketKiosk';
import Reports from './Reports';
import QueueStatus from './QueueStatus';
import AppointmentManagement from './AppointmentManagement';

export const LanguageContext = createContext({
  selectedLanguage: 'th',
  setSelectedLanguage: () => {},
});

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        {/* หน้าแรก (index) */}
        <Route index element={<Dashboard />} />

        {/* กำหนด path สำหรับแต่ละหน้า */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="queuecalling" element={<QueueCalling />} />
        <Route path="adminmanagement" element={<AdminManagement />} />
        <Route path="monitordisplay" element={<MonitorDisplay />} />
        <Route path="ticketkiosk" element={<TicketKiosk />} />
        <Route path="reports" element={<Reports />} />
        <Route path="appointmentmanagement" element={<AppointmentManagement />} />
      </Routes>
    </Layout>
  );
}

export default function Pages() {
  const [selectedLanguage, setSelectedLanguage] = useState('th');

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
      <Router>
        <Routes>
          {/* 1) Public route: ไม่ต้อง login */}
          <Route path="/queuestatus" element={<QueueStatus />} />

          {/* 2) Protected routes: หุ้มด้วย Layout (มี LoginGuard) */}
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </Router>
    </LanguageContext.Provider>
  );
}
