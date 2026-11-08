import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar as CalendarIcon,
  Timer,
  BookOpen,
  LogOut,
  Flame,
  Award,
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: 'dashboard' | 'tasks' | 'calendar' | 'study';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'calendar' | 'study') => void;
  user: User | null;
  onLogout: () => void;
  openClassModal: () => void;
  taskCounts?: { todo: number; overdue: number };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  openClassModal,
  taskCounts,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'tasks',
      label: 'Tasks & Courses',
      icon: CheckSquare,
      badge: taskCounts?.overdue ? `${taskCounts.overdue} overdue` : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarIcon,
      badge: null,
    },
    {
      id: 'study',
      label: 'Focus Room',
      icon: Timer,
      badge: null,
      badgeColor: 'bg-[#EBEBBF] text-[#4b4819]',
    },
  ] as const;

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <aside className="w-64 bg-white/90 backdrop-blur-md border-r border-[#FFE8E7] flex flex-col justify-between p-5 min-h-screen fixed left-0 top-0 z-30 transition-all">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-1 mb-6">
          <img
            src="/logo-solana.png"
            alt="Solana Logo"
            className="h-12 w-auto object-contain"
          />
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-800">Solana</h1>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Workspace</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#FFE8E7] text-[#9c4146] shadow-2xs font-bold'
                    : 'text-slate-600 hover:bg-[#FFFAF4] hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#EFA0A3]' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Shortcut: Courses */}
        <div className="mt-8 pt-6 border-t border-[#FFE8E7]">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Academics
          </p>
          <button
            onClick={openClassModal}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-[#FFFAF4] hover:text-slate-900 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-[#B7B15A]" />
            <span>Manage Courses</span>
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="pt-4 border-t border-[#FFE8E7] space-y-3">
        {user && (
          <div className="bg-[#FFFAF4] rounded-2xl p-3 border border-[#FFE8E7]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#C8DBE4] text-[#2c4756] font-bold text-xs flex items-center justify-center shadow-xs border border-white">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">@{user.username || user.email}</p>
              </div>
            </div>

            {/* Streak & Points */}
            <div className="mt-2.5 pt-2 border-t border-[#FFE8E7]/70 flex items-center justify-around text-xs">
              <div className="flex items-center gap-1 text-[#B7B15A] font-semibold" title="Daily streak">
                <Flame className="w-3.5 h-3.5 fill-[#B7B15A]/20" />
                <span>{user.streak || 1} Days</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-1 text-[#EFA0A3] font-semibold" title="Focus points">
                <Award className="w-3.5 h-3.5" />
                <span>{user.points || 0} Pts</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
