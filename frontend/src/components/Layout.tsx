import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  LayoutDashboard, Package, ArrowLeftRight, LogOut, ChevronRight, Settings, Clock, Calendar
} from 'lucide-react';

const navGroups = [
  {
    title: "Main Menu",
    items: [
      { id: "dashboard", path: "/", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    ]
  },
  {
    title: "Asset Operations",
    items: [
      { id: "assets", path: "/assets", label: "Asset Inventory", icon: Package, adminOnly: true },
      { id: "loans", path: "/loans", label: "Loan Tracking", icon: ArrowLeftRight, adminOnly: false },
    ]
  }
];

const pageLabels: Record<string, string> = {
  "/": "Dashboard",
  "/assets": "Asset Inventory",
  "/loans": "Loan Tracking",
  "/users": "User Management",
};

function Sidebar({ isAdmin, pendingCount }: { isAdmin: boolean; pendingCount: number }) {
  const location = useLocation();

  return (
    <aside className="w-[240px] min-h-screen bg-[#18181B] flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.1)] relative">
      {/* Logo */}
      <div className="px-5 h-16 border-b border-[#27272A] flex flex-col justify-center">
        <div className="text-lg font-bold text-[#FAFAFA] tracking-tight leading-none">
          CyberSec <span className="text-[#DC2626] font-medium">AMS</span>
        </div>
      </div>



      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, i) => (
          <div key={i} className="space-y-1">
            <div className="px-3 mb-2 mt-2">
              <span className="text-[10px] font-bold text-[#71717A] tracking-wider uppercase">{group.title}</span>
            </div>
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              const isLocked = item.adminOnly && !isAdmin;
              const showBadge = item.id === "loans" && pendingCount > 0;
              return (
                <Link
                  key={item.id}
                  to={isLocked ? '#' : item.path}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white shadow-md shadow-[#DC2626]/20"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A]",
                    isLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  <item.icon
                    size={16}
                    className={isActive ? "text-white" : "text-[#71717A] group-hover:text-[#A1A1AA]"}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {showBadge && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white shadow-sm transition-all animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await api.get('/loans');
        const allLoans = res.data.data ?? [];
        const count = allLoans.filter((l: any) => l.status === 'REQUESTED').length;
        setPendingCount(count);
      } catch (err) {
        console.error("Failed to fetch loans count for sidebar", err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 5000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pageTitle = pageLabels[location.pathname] || 'Page';

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: "#F4F4F5", color: "#18181B" }}
    >
      <Sidebar isAdmin={isAdmin} pendingCount={pendingCount} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top header */}
        <header
          className="shrink-0 h-16 flex items-center justify-between px-8 bg-transparent z-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-medium text-[#71717A]">CyberSec</span>
            <ChevronRight size={14} className="text-[#A1A1AA]" />
            <div className="text-sm font-bold text-[#18181B]">{pageTitle}</div>
          </div>

          <div className="flex items-center gap-5 mt-1">
            <div className="flex items-center gap-3 bg-[#FFFFFF] px-4 py-1.5 rounded-full border border-[#E4E4E7] text-xs font-mono font-bold text-[#18181B] shadow-sm">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#DC2626]" />
                <span className="w-[60px] text-center">{currentTime.toLocaleTimeString('en-GB')}</span>
              </div>
              <div className="text-[#E4E4E7]">|</div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-[#DC2626]" />
                <span className="text-[#52525B]">{currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-[#E4E4E7]" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] font-bold text-sm shadow-sm hover:opacity-80 transition-all">
                {user?.fullname ? user.fullname.substring(0, 2).toUpperCase() : 'US'}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-[#F4F4F5]/50 border-b border-[#E4E4E7]/50">
                    <div className="text-sm font-bold text-[#18181B] truncate">{user?.fullname || 'User'}</div>
                    <div className="text-[10px] text-[#71717A] uppercase tracking-wider font-bold mt-0.5">{user?.role || 'ADMIN'}</div>
                  </div>
                  {isAdmin && (
                    <Link
                      to="/users"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#52525B] hover:bg-[#F4F4F5] hover:text-[#18181B] transition-colors"
                    >
                      <Settings size={14} />
                      User Management
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-[#DC2626] hover:bg-[#FEF2F2] transition-colors text-left"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: "none" }}>
          <style>{`
            main::-webkit-scrollbar { display: none; }
          `}</style>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
