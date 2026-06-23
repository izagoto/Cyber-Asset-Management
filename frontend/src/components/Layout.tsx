import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  LayoutDashboard, Package, ArrowLeftRight, LogOut, ChevronRight, Settings, Clock, Calendar, ChevronLeft
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
  },
  {
    title: "Administration",
    items: [
      { id: "users", path: "/users", label: "User Management", icon: Settings, adminOnly: true },
    ]
  }
];

const pageLabels: Record<string, string> = {
  "/": "Dashboard",
  "/assets": "Asset Inventory",
  "/loans": "Loan Tracking",
  "/users": "User Management",
};

function Sidebar({ isAdmin, pendingCount, isOpen, onToggle }: { isAdmin: boolean; pendingCount: number; isOpen: boolean; onToggle: () => void }) {
  const location = useLocation();

  return (
    <aside className={`${isOpen ? 'w-[240px]' : 'w-[80px]'} min-h-screen bg-[#18181B] flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.1)] transition-all duration-300 relative border-r-8 border-[#B91C1C]`}>
      <button
        onClick={onToggle}
        className="absolute -right-5 top-8 w-5 h-12 bg-[#B91C1C] rounded-r-md flex items-center justify-center text-white hover:bg-[#DC2626] transition-colors z-50 cursor-pointer border-y border-r border-[#B91C1C]/50 shadow-[4px_0_10px_rgba(0,0,0,0.1)]"
      >
        {isOpen ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
      </button>

      {/* Logo */}
      <div className="h-16 border-b border-[#27272A] flex items-center justify-center overflow-hidden">
        <div className="text-base font-bold font-mono tracking-tight whitespace-nowrap">
          {isOpen ? (
            <><span className="text-[#DC2626]">Inventaris</span> <span className="text-white">Siber</span></>
          ) : (
            <span className="text-[#DC2626]">I<span className="text-white">S</span></span>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`sidebar-nav flex-1 ${isOpen ? 'pl-3' : 'pl-2'} py-4 space-y-4 overflow-y-auto`}>
        {navGroups.map((group, i) => (
          <div key={i} className="space-y-1">
            {isOpen && (
              <div className="px-3 mb-2 mt-2">
                <span className="text-[10px] font-bold text-[#71717A] tracking-wider uppercase">{group.title}</span>
              </div>
            )}
            {group.items.map((item) => {
              const isActive = location.pathname === item.path;
              const isLocked = item.adminOnly && !isAdmin;
              const showBadge = item.id === "loans" && pendingCount > 0;
              return (
                <Link
                  key={item.id}
                  to={isLocked ? '#' : item.path}
                  title={!isOpen ? item.label : undefined}
                  className={[
                    `flex items-center ${isOpen ? 'gap-3.5 pl-3' : 'justify-center pl-0'} py-3 text-[15px] font-medium relative group focus:outline-none`,
                    isActive
                      ? "sidebar-item-active z-10 bg-linear-to-r from-[#DC2626] to-[#B91C1C] text-white"
                      : "text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#27272A] rounded-xl mr-3 transition-colors duration-200",
                    isLocked ? "opacity-35 cursor-not-allowed" : "cursor-pointer",
                  ].join(" ")}
                >
                  <item.icon
                    size={22}
                    className={isActive ? "text-white" : "text-[#71717A] group-hover:text-[#A1A1AA]"}
                  />
                  {isOpen && <span className={`flex-1 text-left whitespace-nowrap overflow-hidden text-ellipsis ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                  
                  {showBadge && (
                    <span className={`flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm transition-all animate-pulse ${isOpen ? 'h-5 w-5 mr-3' : 'absolute top-1 right-1.5 h-3.5 w-3.5 text-[8px]'} ${isActive ? 'bg-white text-[#DC2626]' : 'bg-[#DC2626] text-white'}`}>
                      {isOpen ? pendingCount : pendingCount > 9 ? '9+' : pendingCount}
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', String(newState));
      return newState;
    });
  };

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
      <Sidebar isAdmin={isAdmin} pendingCount={pendingCount} isOpen={isSidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top header */}
        <header
          className="shrink-0 h-16 flex items-center justify-between px-8 bg-transparent z-10"
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium hidden sm:inline"><span className="text-[#DC2626]">Inventaris</span> <span className="text-[#71717A]">Siber</span></span>
            <span className="text-base text-[#A1A1AA] hidden sm:inline">© 2026</span>
            <ChevronRight size={18} className="text-[#DC2626] hidden sm:inline" />
            <div className="text-lg font-bold text-[#18181B]">{pageTitle}</div>
          </div>

          <div className="flex items-center gap-5 mt-1">
            <div className="flex items-center gap-4 bg-[#FFFFFF] px-5 py-2 rounded-full border border-[#E4E4E7] text-sm font-mono font-bold text-[#18181B] shadow-sm">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#DC2626]" />
                <span className="w-[68px] text-center">{currentTime.toLocaleTimeString('en-GB')}</span>
              </div>
              <div className="text-[#E4E4E7]">|</div>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#DC2626]" />
                <span className="text-[#52525B]">{currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-[#DC2626]" />

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center justify-center w-9 h-9 rounded-full bg-[#18181B] text-white font-bold text-sm shadow-md hover:bg-[#27272A] hover:scale-105 hover:shadow-lg transition-all border border-[#27272A]">
                {user?.fullname ? user.fullname.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#FFFFFF] rounded-xl shadow-lg shadow-black/5 overflow-hidden z-50 border border-[#E4E4E7] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-[#F4F4F5]/50 border-b border-[#E4E4E7]/50">
                    <div className="text-sm font-bold text-[#18181B] truncate">{user?.fullname || 'User'}</div>
                    <div className="text-[10px] text-[#71717A] uppercase tracking-wider font-bold mt-0.5">{user?.role || 'ADMIN'}</div>
                  </div>

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
