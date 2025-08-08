// src/Layout.jsx
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
import LoginGuard from "@/components/auth/LoginGuard";

const navigationItems = [
  { title: "Dashboard",           url: createPageUrl("Dashboard"),           icon: LayoutDashboard, requiredLevel: "staff"  },
  { title: "Queue Calling",       url: createPageUrl("QueueCalling"),       icon: Users,           requiredLevel: "staff"  },
  { title: "Appointments",        url: createPageUrl("AppointmentManagement"), icon: Calendar,        requiredLevel: "staff"  },
  { title: "Admin Management",    url: createPageUrl("AdminManagement"),    icon: Settings,        requiredLevel: "admin"  },
  { title: "Monitor Display",     url: createPageUrl("MonitorDisplay"),     icon: Monitor,         requiredLevel: "viewer" },
  { title: "Ticket Kiosk",        url: createPageUrl("TicketKiosk"),        icon: Printer,         requiredLevel: "viewer" },
  { title: "Reports",             url: createPageUrl("Reports"),             icon: BarChart3,       requiredLevel: "staff"  },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = React.useState(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);

  // Load user from localStorage
  React.useEffect(() => {
    const data = localStorage.getItem("user");
    setUser(data ? JSON.parse(data) : null);
    setIsLoadingUser(false);
  }, []);

  // If loaded and no user, kick to login
  React.useEffect(() => {
    if (!isLoadingUser && !user) {
      navigate("/");
    }
  }, [isLoadingUser, user, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const handleLoginSuccess = (u) => {
    setUser(u);
    navigate(u.access_level === "admin" ? "/dashboard" : "/dashboard");
  };

  const hasPermission = (level) => {
    if (!user) return false;
    if (user.access_level === "admin") return true;
    const map = { viewer: 1, staff: 2, admin: 3 };
    return map[user.access_level] >= map[level];
  };


  // While loading, render nothing (or a spinner)
  if (isLoadingUser) return null;


  // If not logged in, show LoginGuard
  if (!user) {
    return <LoginGuard onLoginSuccess={handleLoginSuccess} />;
  }

  const filteredNav = navigationItems.filter(item => hasPermission(item.requiredLevel));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Sidebar */}
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
              <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                Main Modules
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNav.map(item => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`mb-1 rounded-xl px-3 py-3 transition-all duration-200 hover:bg-blue-50 hover:text-blue-700 ${
                          location.pathname === item.url
                            ? 'bg-blue-50 text-blue-700 shadow-sm'
                            : 'text-slate-600'
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
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
              <SidebarGroupLabel className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                System Status
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-3 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                    <span className="text-sm text-slate-600">System Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Notifications</span>
                    <Badge variant="secondary" className="ml-auto">3</Badge>
                  </div>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-200 p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user.full_name || user.username}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.access_level === 'admin'
                      ? 'ผู้ดูแลระบบ'
                      : user.access_level === 'staff'
                      ? 'เจ้าหน้าที่'
                      : 'ผู้ใช้งาน'}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="w-full text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <main className="flex flex-1 flex-col">
          <header className="flex items-center gap-4 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-sm">
            <SidebarTrigger className="rounded-lg p-2 hover:bg-slate-100 transition-colors" />
            <h1 className="text-xl font-semibold text-slate-900">MediQueue</h1>
          </header>
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
