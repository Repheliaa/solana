import React, { useState } from 'react';
import {
  Search,
  Plus,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  Timer,
  ArrowUpDown,
  Check,
} from 'lucide-react';
import { Task, ClassItem, Category, Priority, TaskStatus } from '../types';

interface TasksViewProps {
  tasks: Task[];
  classes: ClassItem[];
  categories: Category[];
  loading: boolean;
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onToggleStatus: (taskId: number, currentStatus: TaskStatus) => void;
  onStartFocusOnTask: (task: Task) => void;
  onOpenClassModal: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  classes,
  categories,
  loading,
  onOpenNewTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
  onStartFocusOnTask,
  onOpenClassModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline_asc');

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchClass = t.class_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchClass) return false;
    }

    if (selectedCategory !== 'all') {
      if (t.category_slug !== selectedCategory && String(t.category_id) !== selectedCategory) {
        return false;
      }
    }

    if (selectedStatus !== 'all' && t.status !== selectedStatus) {
      return false;
    }

    if (selectedPriority !== 'all' && t.priority !== selectedPriority) {
      return false;
    }

    if (selectedClass !== 'all' && String(t.class_id) !== selectedClass) {
      return false;
    }

    return true;
  });

  // Sort logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'deadline_asc') {
      if (a.status === 'Done' && b.status !== 'Done') return 1;
      if (a.status !== 'Done' && b.status === 'Done') return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    if (sortBy === 'deadline_desc') {
      if (a.status === 'Done' && b.status !== 'Done') return 1;
      if (a.status !== 'Done' && b.status === 'Done') return -1;
      return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    }
    if (sortBy === 'priority_desc') {
      const weights: Record<Priority, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      return weights[b.priority] - weights[a.priority];
    }
    return 0;
  });

  const formatDeadline = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5 pb-20">
      {/* 1. Top Controls Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs space-y-4">
        {/* Row 1: Search, Sort, Manage Courses, New Task */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, or courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white rounded-2xl outline-none text-slate-800 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Sort Dropdown */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-8 pr-6 py-2.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] rounded-2xl outline-none text-slate-700 font-medium cursor-pointer"
              >
                <option value="deadline_asc">Due Date (Earliest)</option>
                <option value="deadline_desc">Due Date (Latest)</option>
                <option value="priority_desc">Highest Priority</option>
              </select>
            </div>

            <button
              onClick={onOpenClassModal}
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-[#FFFAF4] hover:bg-[#FFE8E7] border border-[#FFE8E7] rounded-2xl transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#B7B15A]" />
              <span>Manage Courses</span>
            </button>

            <button
              onClick={onOpenNewTask}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#EFA0A3] hover:bg-[#e68d90] rounded-2xl transition-all shadow-xs shadow-[#EFA0A3]/20"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Row 2: Category Filter Tabs & Secondary Filters */}
        <div className="flex items-center justify-between border-t border-[#FFE8E7] pt-3.5 flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${selectedCategory === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-[#FFFAF4] text-slate-600 hover:bg-[#FFE8E7]'
                }`}
            >
              All Categories ({tasks.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${selectedCategory === cat.slug
                    ? 'text-white shadow-xs'
                    : 'bg-[#FFFAF4] text-slate-600 hover:bg-[#FFE8E7]'
                  }`}
                style={{
                  backgroundColor: selectedCategory === cat.slug ? cat.color || '#EFA0A3' : undefined,
                }}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Status, Priority, and Class filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] rounded-xl text-slate-700 outline-none"
            >
              <option value="all">Status: All</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Completed</option>
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] rounded-xl text-slate-700 outline-none"
            >
              <option value="all">Priority: All</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {classes.length > 0 && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 text-xs bg-[#FFFAF4] border border-[#FFE8E7] rounded-xl text-slate-700 outline-none"
              >
                <option value="all">Course: All</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* 2. Task Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs">Loading tasks...</div>
      ) : sortedTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#FFE8E7] shadow-xs space-y-2">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No tasks found</h3>
          <p className="text-xs text-slate-400">
            {search ? 'Try adjusting your search query or filters.' : 'Add your first task to get started.'}
          </p>
          {!search && (
            <button
              onClick={onOpenNewTask}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#EFA0A3] hover:bg-[#e68d90] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-3xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between group ${task.status === 'Done'
                  ? 'border-slate-200 bg-slate-50/50 opacity-75'
                  : task.is_overdue
                    ? 'border-rose-200 bg-rose-50/20'
                    : task.is_imminent
                      ? 'border-[#FFCDCC] bg-[#FFE8E7]/10'
                      : 'border-[#FFE8E7] hover:border-[#EFA0A3]'
                }`}
            >
              {/* Card Top */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${task.priority === 'Urgent'
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

                    {task.category_name && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {task.category_name}
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${task.status === 'Done'
                        ? 'bg-[#EBEBBF] text-[#4b4819]'
                        : task.status === 'In Progress'
                          ? 'bg-[#C8DBE4] text-[#2c4756]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                  >
                    {task.status}
                  </span>
                </div>

                {/* Overdue / Imminent Pill */}
                {task.is_overdue && (
                  <div className="mb-2 px-2.5 py-1 rounded-xl bg-rose-100/80 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Past deadline</span>
                  </div>
                )}
                {task.is_imminent && (
                  <div className="mb-2 px-2.5 py-1 rounded-xl bg-[#FFE8E7] border border-[#FFCDCC] text-[#9c4146] text-[11px] font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Due in less than 24h</span>
                  </div>
                )}

                {/* Task Title & Class */}
                <div className="space-y-1">
                  <h4
                    className={`text-sm font-bold text-slate-800 line-clamp-2 ${task.status === 'Done' ? 'line-through text-slate-400' : ''
                      }`}
                  >
                    {task.title}
                  </h4>

                  {task.class_name && (
                    <div
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: task.class_color || '#C66F80' }}
                    >
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{task.class_name} {task.class_code ? `(${task.class_code})` : ''}</span>
                    </div>
                  )}

                  {task.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 pt-0.5 font-normal leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Bottom */}
              <div className="mt-4 pt-3 border-t border-[#FFE8E7] space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span
                      className={`text-[11px] font-medium ${task.is_overdue ? 'text-rose-600 font-bold' : task.is_imminent ? 'text-[#9c4146] font-bold' : ''
                        }`}
                    >
                      {formatDeadline(task.deadline)}
                    </span>
                  </div>

                  {task.estimated_minutes && (
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-medium">
                      {task.estimated_minutes}m
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <button
                    onClick={() => onToggleStatus(task.id, task.status)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${task.status === 'Done'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-[#FFFAF4] text-[#9c4146] hover:bg-[#FFE8E7] border border-[#FFE8E7]'
                      }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{task.status === 'Done' ? 'Undo' : 'Complete'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {task.status !== 'Done' && (
                      <button
                        onClick={() => onStartFocusOnTask(task)}
                        className="p-1.5 text-slate-400 hover:text-[#B7B15A] hover:bg-[#EBEBBF]/30 rounded-lg transition-colors"
                        title="Focus on this task"
                      >
                        <Timer className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
