import React, { useState } from 'react';
import { X, Edit2, Trash2, BookOpen, Clock, MapPin, Tag, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ClassItem, Category } from '../types';
import { api } from '../api';
import { CLASS_COLOR_PRESETS, DEFAULT_CLASS_COLOR, isLightColor } from '../utils/colors';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassItem[];
  categories: Category[];
  onRefresh: () => void;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  classes,
  categories,
  onRefresh,
}) => {
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(DEFAULT_CLASS_COLOR);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  
  // Structured schedule fields
  const [dayOfWeek, setDayOfWeek] = useState<number>(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');
  const [syncCalendar, setSyncCalendar] = useState(true);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(16);

  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const dayNames = [
    { id: 1, label: 'Monday' },
    { id: 2, label: 'Tuesday' },
    { id: 3, label: 'Wednesday' },
    { id: 4, label: 'Thursday' },
    { id: 5, label: 'Friday' },
    { id: 6, label: 'Saturday' },
    { id: 7, label: 'Sunday' },
  ];

  const colorPresets = CLASS_COLOR_PRESETS;

  const handleStartEdit = (item: ClassItem) => {
    setEditingClass(item);
    setName(item.name);
    setCode(item.code || '');
    setRoom(item.room || '');
    setColor(item.color || DEFAULT_CLASS_COLOR);
    setCategoryId(item.category_id || undefined);
    setDayOfWeek(item.day_of_week || 1);
    setStartTime(item.start_time || '08:00');
    setEndTime(item.end_time || '10:30');
    setSyncCalendar(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingClass(null);
    setName('');
    setCode('');
    setRoom('');
    setColor(DEFAULT_CLASS_COLOR);
    setCategoryId(undefined);
    setDayOfWeek(1);
    setStartTime('08:00');
    setEndTime('10:30');
    setSyncCalendar(true);
    setError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const selectedDay = dayNames.find((d) => d.id === Number(dayOfWeek))?.label || 'Monday';
    const scheduleSummary = `${selectedDay}, ${startTime} - ${endTime}`;

    try {
      if (editingClass) {
        const res = await api.updateClass(editingClass.id, {
          name,
          code,
          schedule: scheduleSummary,
          room,
          color,
          category_id: categoryId,
          day_of_week: Number(dayOfWeek),
          start_time: startTime,
          end_time: endTime,
          sync_calendar: syncCalendar,
          recurrence_weeks: recurrenceWeeks,
        });
        setSuccessMsg(`Course "${res.name}" updated successfully.`);
      } else {
        const res = await api.createClass({
          name,
          code,
          schedule: scheduleSummary,
          room,
          color,
          category_id: categoryId,
          day_of_week: Number(dayOfWeek),
          start_time: startTime,
          end_time: endTime,
          sync_calendar: syncCalendar,
          recurrence_weeks: recurrenceWeeks,
        });
        setSuccessMsg(`Course "${res.name}" added and synced to calendar.`);
      }
      handleCancelEdit();
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = async (classId: number, className: string) => {
    setSyncingId(classId);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.syncClass(classId, recurrenceWeeks);
      setSuccessMsg(`Synced ${res.syncedCount} sessions for "${className}".`);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sync to calendar');
    } finally {
      setSyncingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this course? Its calendar sessions will be cleared. Linked tasks will remain saved.')) {
      return;
    }
    try {
      await api.deleteClass(id);
      setSuccessMsg('Course deleted successfully.');
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-xl border border-[#FFE8E7]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#FFE8E7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE8E7] text-[#9c4146] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Manage Courses & Schedules</h3>
              <p className="text-xs text-slate-400">Configure courses, label colors, and weekly schedule sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs border border-rose-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSave} className="bg-[#FFFAF4] p-4.5 rounded-2xl border border-[#FFE8E7] space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {editingClass ? 'Edit Course' : 'Add New Course'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Web Development"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g., CS-301"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Location / Platform</label>
                <input
                  type="text"
                  placeholder="e.g., Lab 2 / Zoom"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white transition-all shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white transition-all shadow-2xs"
                >
                  <option value="">Select Category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Meeting Day *</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white font-medium transition-all shadow-2xs"
                >
                  {dayNames.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white transition-all shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-[#EFA0A3] outline-none bg-white transition-all shadow-2xs"
                  />
                </div>
              </div>

              {/* Color Picker */}
              <div className="sm:col-span-2 bg-white p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">Course Label Color</label>
                  <span className="text-xs text-slate-400 font-mono">{color}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {colorPresets.map((c) => {
                    const isSelected = color.toLowerCase() === c.hex.toLowerCase();
                    const isLight = isLightColor(c.hex);
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setColor(c.hex)}
                        title={`${c.name} (${c.hex})`}
                        className={`w-7 h-7 rounded-xl border-2 transition-all flex items-center justify-center ${
                          isSelected
                            ? 'scale-110 border-slate-800 shadow-xs ring-2 ring-slate-400/40'
                            : 'border-slate-200/60 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isLight ? 'bg-slate-800' : 'bg-white'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}

                  <label
                    title="Custom color hex"
                    className="w-7 h-7 rounded-xl border border-dashed border-slate-300 hover:border-slate-500 flex items-center justify-center cursor-pointer bg-slate-50"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className="text-[10px] text-slate-500 font-bold">+</span>
                  </label>
                </div>
              </div>

              {/* Sync to Calendar Option */}
              <div className="sm:col-span-2 bg-white border border-[#FFE8E7] p-3 rounded-xl flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncCalendar}
                    onChange={(e) => setSyncCalendar(e.target.checked)}
                    className="w-4 h-4 rounded text-[#EFA0A3] focus:ring-[#EFA0A3] accent-[#EFA0A3]"
                  />
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#EFA0A3]" />
                    Sync weekly schedule to Calendar
                  </span>
                </label>

                {syncCalendar && (
                  <select
                    value={recurrenceWeeks}
                    onChange={(e) => setRecurrenceWeeks(Number(e.target.value))}
                    className="text-[11px] p-1 rounded-lg border border-slate-200 bg-[#FFFAF4] text-slate-700 outline-none font-medium"
                  >
                    <option value={16}>16 Weeks (Semester)</option>
                    <option value={8}>8 Weeks</option>
                    <option value={4}>4 Weeks</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {editingClass && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#EFA0A3] hover:bg-[#e68d90] transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingClass ? 'Save Changes' : 'Add Course'}
              </button>
            </div>
          </form>

          {/* Classes list */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Enrolled Courses ({classes.length})
              </h4>
            </div>

            {classes.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-[#FFE8E7] text-center text-slate-400 text-xs">
                No courses added yet. Add a course above to organize your schedules.
              </div>
            ) : (
              <div className="space-y-2">
                {classes.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl bg-white border border-[#FFE8E7] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-bold text-slate-800">{c.name}</h5>
                          {c.code && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
                              {c.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                          {c.schedule && (
                            <span className="flex items-center gap-1 font-medium text-slate-500">
                              <Clock className="w-3 h-3 text-[#B7B15A]" />
                              <span>{c.schedule}</span>
                            </span>
                          )}
                          {c.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#97B3C2]" />
                              <span>{c.room}</span>
                            </span>
                          )}
                          {c.category_name && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              <span>{c.category_name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center">
                      <button
                        onClick={() => handleManualSync(c.id, c.name)}
                        disabled={syncingId === c.id}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-[#9c4146] bg-[#FFFAF4] hover:bg-[#FFE8E7] border border-[#FFE8E7] rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Sync schedule to calendar"
                      >
                        <RefreshCw className={`w-3 h-3 ${syncingId === c.id ? 'animate-spin' : ''}`} />
                        <span>{syncingId === c.id ? 'Syncing...' : 'Sync'}</span>
                      </button>

                      <button
                        onClick={() => handleStartEdit(c)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit course"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete course"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
