import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  ArrowRight,
  GraduationCap,
  BookOpen,
  User as UserIcon,
  Timer,
  Check,
  ClipboardList,
  Flame,
} from 'lucide-react';
import { DashboardSummary, Task } from '../types';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onOpenStudy: () => void;
  onOpenTasks: () => void;
  onToggleTaskStatus: (taskId: number, currentStatus: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  loading,
  onOpenStudy,
  onOpenTasks,
  onToggleTaskStatus,
}) => {
  if (loading || !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 gap-3">
        <div className="w-8 h-8 border-3 border-[#FFE8E7] border-t-[#EFA0A3] rounded-full animate-spin" />
        <p className="text-xs">Loading dashboard...</p>
      </div>
    );
  }

  const { task_counts, nearest_tasks, urgent_tasks, overdue_tasks, today_agenda, focus_summary_today } = summary;

  const formatDeadline = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const isToday = date.toDateString() === today.toDateString();
      const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) return `Today, ${time}`;
      return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}, ${time}`;
    } catch {
      return dateStr;
    }
  };

  const getCategoryIcon = (slug?: string) => {
    switch (slug) {
      case 'kuliah':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'lepkom':
      case 'mengajar':
        return <BookOpen className="w-3.5 h-3.5" />;
      default:
        return <UserIcon className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Total Tasks */}
        <div className="bg-white rounded-2xl p-4 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{task_counts.total}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Recorded tasks</p>
          </div>
        </div>

        {/* To Do */}
        <div className="bg-white rounded-2xl p-4 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9c4146]">To Do</span>
            <Clock className="w-4 h-4 text-[#EFA0A3]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{task_counts.todo}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Not started</p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-2xl p-4 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3d5a69]">In Progress</span>
            <span className="w-2 h-2 rounded-full bg-[#97B3C2]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{task_counts.in_progress}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">In motion</p>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#57541f]">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-[#B7B15A]" />
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-800">{task_counts.done}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Finished</p>
          </div>
        </div>

        {/* Overdue */}
        <div
          className={`col-span-2 md:col-span-1 rounded-2xl p-4 border shadow-xs flex flex-col justify-between ${
            task_counts.overdue > 0
              ? 'bg-rose-50/60 border-rose-200'
              : 'bg-white border-[#FFE8E7]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${task_counts.overdue > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
              Overdue
            </span>
            <AlertCircle className={`w-4 h-4 ${task_counts.overdue > 0 ? 'text-rose-600' : 'text-slate-300'}`} />
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold ${task_counts.overdue > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
              {task_counts.overdue}
            </h3>
            <p className={`text-[11px] mt-0.5 ${task_counts.overdue > 0 ? 'text-rose-600/80' : 'text-slate-400'}`}>
              {task_counts.overdue > 0 ? 'Needs attention' : 'All on track'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Upcoming Deadlines & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Nearest Tasks Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#EFA0A3]" />
                <h3 className="text-sm font-bold text-slate-800">Upcoming Deadlines</h3>
              </div>
              <button
                onClick={onOpenTasks}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {nearest_tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No upcoming deadlines. All tasks are completed.
              </div>
            ) : (
              <div className="space-y-2.5">
                {nearest_tasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      task.is_overdue
                        ? 'bg-rose-50/50 border-rose-200'
                        : task.is_imminent
                        ? 'bg-[#FFE8E7]/30 border-[#FFCDCC]'
                        : 'bg-[#FFFAF4] border-[#FFE8E7] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleTaskStatus(task.id, task.status)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                          task.status === 'Done'
                            ? 'bg-[#B7B15A] border-[#B7B15A] text-white'
                            : 'border-slate-300 hover:border-[#EFA0A3]'
                        }`}
                      >
                        {task.status === 'Done' && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {task.title}
                          </p>
                          {task.class_name && (
                            <span className="text-[10px] px-2 py-0.2 rounded-md bg-white text-slate-600 border border-slate-200 font-medium">
                              {task.class_name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{task.category_name || 'Task'}</span>
                          <span>•</span>
                          <span
                            className={
                              task.is_overdue
                                ? 'text-rose-600 font-semibold'
                                : task.is_imminent
                                ? 'text-[#9c4146] font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {task.is_overdue ? 'Overdue: ' : 'Due: '}
                            {formatDeadline(task.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold ${
                          task.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'High'
                            ? 'bg-[#FFE8E7] text-[#9c4146]'
                            : task.priority === 'Medium'
                            ? 'bg-[#EBEBBF] text-[#4b4819]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#B7B15A]" />
                <h3 className="text-sm font-bold text-slate-800">Today's Schedule</h3>
              </div>
            </div>

            {today_agenda.events.length === 0 && today_agenda.tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No events or classes scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Events */}
                {today_agenda.events.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-2xl bg-[#FFFAF4] border border-[#FFE8E7] flex items-center justify-between gap-3 relative overflow-hidden"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: ev.color || '#C66F80' }}
                    />
                    <div className="pl-1">
                      <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(ev.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(ev.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {ev.class_name && ` • ${ev.class_name}`}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-medium text-slate-600 border border-slate-200 capitalize">
                      {ev.event_type}
                    </span>
                  </div>
                ))}

                {/* Tasks due today */}
                {today_agenda.tasks.map((task: any) => (
                  <div
                    key={`task-due-${task.id}`}
                    className="p-3 rounded-2xl bg-[#FFE8E7]/30 border border-[#FFCDCC] flex items-center justify-between gap-3 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#EFA0A3]" />
                    <div className="pl-1">
                      <h4 className="text-xs font-bold text-slate-800">Due: {task.title}</h4>
                      <p className="text-[11px] text-[#9c4146] mt-0.5">
                        {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {task.class_name && ` • ${task.class_name}`}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFA0A3] text-white font-semibold">
                      Today
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Focus Summary & Priority Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Study Room Today Card */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-4 h-4 text-[#B7B15A]" />
              <h3 className="text-sm font-bold text-slate-800">Focus Today</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-[#FFFAF4] rounded-2xl p-3 border border-[#FFE8E7] text-center">
                <p className="text-2xl font-bold text-[#57541f]">
                  {focus_summary_today.total_minutes}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Minutes</p>
              </div>

              <div className="bg-[#FFFAF4] rounded-2xl p-3 border border-[#FFE8E7] text-center">
                <p className="text-2xl font-bold text-[#9c4146]">
                  {focus_summary_today.total_sessions}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sessions</p>
              </div>
            </div>

            {focus_summary_today.recent_sessions && focus_summary_today.recent_sessions.length > 0 && (
              <div className="space-y-1.5 mb-4">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Recent Sessions:
                </p>
                {focus_summary_today.recent_sessions.slice(0, 3).map((s, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] flex items-center justify-between"
                  >
                    <span className="truncate text-slate-700 font-medium">
                      {s.task_title || 'Solo Session'}
                    </span>
                    <span className="text-[#B7B15A] font-bold text-xs">{s.duration_minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenStudy}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#B7B15A] hover:bg-[#a59f4d] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
          >
            <Timer className="w-4 h-4" />
            <span>Open Focus Room</span>
          </button>
        </div>

        {/* Urgent & High Priority Tasks Card */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-800">Priority Tasks</h3>
            </div>

            {urgent_tasks.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No urgent tasks pending.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {urgent_tasks.slice(0, 4).map((task: Task) => (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-2xl bg-[#FFFAF4] border border-[#FFE8E7] hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                            task.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-[#FFE8E7] text-[#9c4146]'
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.class_name && (
                          <span className="text-[10px] font-medium text-slate-500 truncate">
                            {task.class_name}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#FFE8E7] flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {formatDeadline(task.deadline)}
                      </span>
                      <button
                        onClick={() => onToggleTaskStatus(task.id, task.status)}
                        className="text-xs font-semibold text-[#EFA0A3] hover:text-[#9c4146]"
                      >
                        Mark Done
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
