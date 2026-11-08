import React from 'react';
import { Plus, Timer } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeTab: 'dashboard' | 'tasks' | 'calendar' | 'study';
  user: User | null;
  onOpenNewTask: () => void;
  onOpenStudy: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  user,
  onOpenNewTask,
  onOpenStudy,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview';
      case 'tasks':
        return 'Tasks & Courses';
      case 'calendar':
        return 'Calendar';
      case 'study':
        return 'Focus Room';
    }
  };

  const getFormattedDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-[#FFE8E7] sticky top-0 z-20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>{getGreeting()}, <strong className="text-slate-700 font-semibold">{user?.name || 'User'}</strong></span>
          <span>•</span>
          <span>{getFormattedDate()}</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenStudy}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#4e4917] bg-[#EBEBBF] hover:bg-[#e4e4a9] rounded-xl transition-all active:scale-95 shadow-xs"
        >
          <Timer className="w-4 h-4 text-[#B7B15A]" />
          <span>Focus Timer</span>
        </button>

        <button
          onClick={onOpenNewTask}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#EFA0A3] hover:bg-[#e68d90] rounded-xl transition-all shadow-xs shadow-[#EFA0A3]/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
