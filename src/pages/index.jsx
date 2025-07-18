import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import QueueCalling from "./QueueCalling";

import AdminManagement from "./AdminManagement";

import MonitorDisplay from "./MonitorDisplay";

import TicketKiosk from "./TicketKiosk";

import Reports from "./Reports";

import QueueStatus from "./QueueStatus";

import AppointmentManagement from "./AppointmentManagement";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    QueueCalling: QueueCalling,
    
    AdminManagement: AdminManagement,
    
    MonitorDisplay: MonitorDisplay,
    
    TicketKiosk: TicketKiosk,
    
    Reports: Reports,
    
    QueueStatus: QueueStatus,
    
    AppointmentManagement: AppointmentManagement,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/QueueCalling" element={<QueueCalling />} />
                
                <Route path="/AdminManagement" element={<AdminManagement />} />
                
                <Route path="/MonitorDisplay" element={<MonitorDisplay />} />
                
                <Route path="/TicketKiosk" element={<TicketKiosk />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/QueueStatus" element={<QueueStatus />} />
                
                <Route path="/AppointmentManagement" element={<AppointmentManagement />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}