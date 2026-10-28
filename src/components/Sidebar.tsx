import React from 'react';
import { 
  LayoutDashboard, 
  UserPlus, 
  Compass, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Armchair
} from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'registration' | 'roster' | 'tours' | 'seats';
  setCurrentView: (view: 'dashboard' | 'registration' | 'roster' | 'tours' | 'seats') => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  totalEarning: number;
  totalDue: number;
  toursCount: number;
  passengersCount: number;
  allocatedSeatsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  collapsed,
  setCollapsed,
  totalEarning,
  totalDue,
  toursCount,
  passengersCount,
  allocatedSeatsCount = 0,
}) => {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'registration' as const,
      label: 'Registration',
      icon: UserPlus,
      badge: 'Form',
    },
    {
      id: 'roster' as const,
      label: 'Passengers Roster',
      icon: Users,
      badge: passengersCount > 0 ? String(passengersCount) : null,
    },
    {
      id: 'tours' as const,
      label: 'Tours',
      icon: Compass,
      badge: toursCount > 0 ? String(toursCount) : null,
    },
    {
      id: 'seats' as const,
      label: 'Seat Allocation',
      icon: Armchair,
      badge: allocatedSeatsCount > 0 ? `${allocatedSeatsCount}` : null,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-950/60">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
            <Compass className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-sm text-white tracking-tight leading-tight truncate">
                Tour Finance
              </h1>
              <p className="text-[11px] font-semibold text-orange-400">
                Management System
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden lg:block"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">
          {!collapsed && 'Main Menu'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between text-left">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-orange-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Quick Stats Widget at bottom */}
      {!collapsed && (
        <div className="p-3.5 m-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Earning:</span>
            <span className="font-mono font-bold text-emerald-400">{formatINR(totalEarning)}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Due:</span>
            <span className="font-mono font-bold text-rose-400">{formatINR(totalDue)}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
