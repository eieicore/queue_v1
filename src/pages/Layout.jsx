
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Monitor, 
  Printer, 
  BarChart3,
  Activity,
  Bell,
  LogOut,
  User as UserIcon,
  Calendar
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import LoginGuard from "@/components/auth/LoginGuard";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    requiredLevel: "staff"
  },
  {
    title: "Queue Calling",
    url: createPageUrl("QueueCalling"),
    icon: Users,
    requiredLevel: "staff" || "admin"
  },
  {
    title: "Appointments",
    url: createPageUrl("AppointmentManagement"),
    icon: Calendar,
    requiredLevel: "staff"
  },
  {
    title: "Admin Management",
    url: createPageUrl("AdminManagement"),
    icon: Settings,
    requiredLevel: "admin"
  },
  {
    title: "Monitor Display",
    url: createPageUrl("MonitorDisplay"),
    icon: Monitor,
    requiredLevel: "viewer"
  },
  {
    title: "Ticket Kiosk",
    url: createPageUrl("TicketKiosk"),
    icon: Printer,
    requiredLevel: "viewer"
  },
  {
    title: "Reports",
    url: createPageUrl("Reports"),
    icon: BarChart3,
    requiredLevel: "staff"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [user, setUser] = React.useState(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    // โหลด user จาก localStorage แทน User.me()
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      setUser(null);
    }
    setIsLoadingUser(false);
  }, []);

  React.useEffect(() => {
    if (!isLoadingUser && user === null) {
      navigate("/");
    }
  }, [user, isLoadingUser, navigate]);

  // handleLogout: ออกจากระบบแล้ว redirect ทันที
  const handleLogout = async () => {
    await User.logout();
    setUser(null);
    navigate('/');
  };

  // เพิ่มฟังก์ชันสำหรับอัปเดต user หลัง login สำเร็จ (ส่ง prop นี้ไป LoginGuard หรือหน้า login)
  const handleLoginSuccess = (user) => {
    setUser(user);
    // redirect ตามสิทธิ์
    if (user.access_level === 'admin') {
      navigate('/dashboard');
    } else if (user.access_level === 'staff') {
      navigate('/dashboard');
    } else {
      navigate('/monitor'); // หรือหน้าที่เหมาะสมสำหรับ user
    }
  };

  const hasPermission = (requiredLevel) => {
    if (!user) return false;
    const userLevel = (user.access_level || 'staff').toLowerCase();
    if (userLevel === 'admin') return true; // admin เข้าทุกเมนู
    const levelHierarchy = {
      'viewer': 1,
      'staff': 2,
      'admin': 3
    };
    const userLevelValue = levelHierarchy[userLevel] || 1;
    const requiredLevelValue = levelHierarchy[requiredLevel] || 2;
    return userLevelValue >= requiredLevelValue;
  };

  // Filter navigation items based on user permissions
  const filteredNavItems = navigationItems.filter(item => 
    hasPermission(item.requiredLevel)
  );

  const hideSidebar = location.pathname.startsWith('/QueueStatus');
  const hideHeader = location.pathname.startsWith('/QueueStatus');

  if (!user && !isLoadingUser) {
    // แสดงหน้า login
    return <LoginGuard onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Hide sidebar for QueueStatus */}
        {!hideSidebar && (
          <Sidebar className="border-r border-slate-200 bg-white/80 backdrop-blur-sm">
            <SidebarHeader className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">MediQueue</h2>
                  <p className="text-xs text-slate-500">Hospital Queue System</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  Main Modules
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-xl mb-1 ${
                            location.pathname === item.url ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-3 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 py-2">
                  System Status
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-3 py-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-600">System Online</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Notifications</span>
                      <Badge variant="secondary" className="ml-auto">3</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-4">
                      <div>Local Time</div>
                      <div className="font-mono text-sm text-slate-700">
                        {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
                      </div>
                    </div>
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200 p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">
                      {user?.full_name || user?.username || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.access_level === 'admin' ? 'ผู้ดูแลระบบ' : 
                       user?.access_level === 'staff' ? 'เจ้าหน้าที่' : 'ผู้ใช้'}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  ออกจากระบบ
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        )}

        <main className="flex-1 flex flex-col">
          {/* Hide header for QueueStatus */}
          {!hideHeader && (
          <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-center gap-4">
            <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-lg transition-colors duration-200" />
            <h1 className="text-xl font-semibold text-slate-900">MediQueue</h1>
          </header>
          )}

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
