import React, { useState, useEffect } from 'react';
import { X, CheckSquare, BookOpen, Tag, AlertTriangle } from 'lucide-react';
import { Task, ClassItem, Category, Priority, TaskStatus } from '../types';
import { api } from '../api';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  classes: ClassItem[];
  categories: Category[];
  onSuccess: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  classes,
  categories,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('To Do');
  const [deadline, setDeadline] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [classId, setClassId] = useState<number | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'To Do');

      if (taskToEdit.deadline) {
        const d = new Date(taskToEdit.deadline);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDeadline(formatted);
      } else {
        setDeadline('');
      }

      setEstimatedMinutes(taskToEdit.estimated_minutes || 30);
      setClassId(taskToEdit.class_id || undefined);
      setCategoryId(taskToEdit.category_id || undefined);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 0, 0);
      const pad = (n: number) => String(n).padStart(2, '0');
      const formatted = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T23:59`;

      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('To Do');
      setDeadline(formatted);
      setEstimatedMinutes(30);
      setClassId(undefined);
      setCategoryId(categories.length > 0 ? categories[0].id : undefined);
    }
    setError(null);
  }, [taskToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      setError('Title and deadline are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (taskToEdit) {
        await api.updateTask(taskToEdit.id, {
          title,
          description,
          priority,
          status,
          deadline,
          estimated_minutes: estimatedMinutes,
          class_id: classId,
          category_id: categoryId,
        });
      } else {
        await api.createTask({
          title,
          description,
          priority,
          status,
          deadline,
          estimated_minutes: estimatedMinutes,
          class_id: classId,
          category_id: categoryId,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-[#FFE8E7]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#FFE8E7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE8E7] text-[#9c4146] flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {taskToEdit ? 'Edit Task' : 'New Task'}
              </h3>
              <p className="text-xs text-slate-400">Set task details, deadline, and priority</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Prepare course presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none transition-all text-slate-800"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Add details, instructions, or references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none transition-all resize-none text-slate-800"
            />
          </div>

          {/* Category & Course row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <div className="relative">
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none appearance-none"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <Tag className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Linked Course
              </label>
              <div className="relative">
                <select
                  value={classId || ''}
                  onChange={(e) => setClassId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none appearance-none"
                >
                  <option value="">None (General)</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
                <BookOpen className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Priority & Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Low', 'Medium', 'High', 'Urgent'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 text-[11px] rounded-xl font-bold transition-all border ${priority === p
                        ? p === 'Urgent'
                          ? 'bg-rose-100 text-rose-700 border-rose-300'
                          : p === 'High'
                            ? 'bg-[#FFE8E7] text-[#9c4146] border-[#FFCDCC]'
                            : p === 'Medium'
                              ? 'bg-[#EBEBBF] text-[#4b4819] border-[#d8d89e]'
                              : 'bg-[#C8DBE4] text-[#244252] border-[#a5c2d1]'
                        : 'bg-[#FFFAF4] text-slate-600 border-[#FFE8E7] hover:bg-white'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['To Do', 'In Progress', 'Done'] as TaskStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`py-2 text-[11px] rounded-xl font-semibold transition-all border ${status === s
                        ? s === 'Done'
                          ? 'bg-[#B7B15A] text-white border-[#B7B15A]'
                          : s === 'In Progress'
                            ? 'bg-[#97B3C2] text-white border-[#97B3C2]'
                            : 'bg-[#EFA0A3] text-white border-[#EFA0A3]'
                        : 'bg-[#FFFAF4] text-slate-600 border-[#FFE8E7] hover:bg-white'
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Deadline & Estimated Minutes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Due Date *
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Estimated Duration
              </label>
              <div className="flex items-center gap-1.5">
                {[15, 30, 45, 60, 90, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins)}
                    className={`flex-1 py-2 text-[11px] rounded-xl font-medium border transition-colors ${estimatedMinutes === mins
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-[#FFFAF4] text-slate-600 border-[#FFE8E7] hover:bg-white'
                      }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[#FFE8E7] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#EFA0A3] hover:bg-[#e68d90] transition-all shadow-xs disabled:opacity-50"
            >
              {loading ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
