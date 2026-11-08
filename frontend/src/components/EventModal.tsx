import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, BookOpen, AlertTriangle } from 'lucide-react';
import { CalendarEvent, ClassItem, EventType } from '../types';
import { api } from '../api';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  classes: ClassItem[];
  defaultDate?: Date;
  onSuccess: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  classes,
  defaultDate,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState<EventType>('kuliah');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [classId, setClassId] = useState<number | undefined>(undefined);
  const [color, setColor] = useState('#97B3C2');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setEventType((eventToEdit.event_type as EventType) || 'kuliah');
      setColor(eventToEdit.color || '#97B3C2');
      setClassId(eventToEdit.class_id || undefined);

      const pad = (n: number) => String(n).padStart(2, '0');
      if (eventToEdit.start_time) {
        const s = new Date(eventToEdit.start_time);
        setStartTime(`${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}T${pad(s.getHours())}:${pad(s.getMinutes())}`);
      }
      if (eventToEdit.end_time) {
        const e = new Date(eventToEdit.end_time);
        setEndTime(`${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}T${pad(e.getHours())}:${pad(e.getMinutes())}`);
      }
    } else {
      const base = defaultDate || new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const start = new Date(base);
      start.setHours(9, 0, 0, 0);
      const end = new Date(base);
      end.setHours(11, 0, 0, 0);

      setTitle('');
      setDescription('');
      setEventType('kuliah');
      setColor('#97B3C2');
      setClassId(undefined);
      setStartTime(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T09:00`);
      setEndTime(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T11:00`);
    }
    setError(null);
  }, [eventToEdit, isOpen, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      setError('Title and time range are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (eventToEdit && typeof eventToEdit.id === 'number') {
        await api.updateEvent(eventToEdit.id, {
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          event_type: eventType,
          color,
          class_id: classId,
        });
      } else {
        await api.createEvent({
          title,
          description,
          start_time: startTime,
          end_time: endTime,
          event_type: eventType,
          color,
          class_id: classId,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (type: EventType) => {
    setEventType(type);
    switch (type) {
      case 'kuliah':
        setColor('#C66F80');
        break;
      case 'lepkom':
        setColor('#4A6644');
        break;
      case 'personal':
        setColor('#F4C7D0');
        break;
      case 'belajar':
        setColor('#9FAA74');
        break;
      default:
        setColor('#C66F80');
        break;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-xl border border-[#FFE8E7]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-[#FFE8E7] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFE8E7] text-[#9c4146] flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {eventToEdit ? 'Edit Event' : 'Schedule Event'}
              </h3>
              <p className="text-xs text-slate-400">Add lectures, labs, or personal activities</p>
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
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Computer Networks Lab"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none transition-all"
            />
          </div>

          {/* Event Type selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Event Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'kuliah', label: 'Lecture', color: '#C66F80' },
                { id: 'lepkom', label: 'Lab', color: '#4A6644' },
                { id: 'personal', label: 'Personal', color: '#F4C7D0' },
                { id: 'belajar', label: 'Study', color: '#9FAA74' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTypeSelect(t.id as EventType)}
                  className={`py-2 text-xs rounded-xl font-semibold transition-all border ${
                    eventType === t.id
                      ? t.id === 'personal'
                        ? 'bg-[#F4C7D0] text-slate-800 border-[#F4C7D0] shadow-2xs'
                        : 'text-white shadow-2xs'
                      : 'bg-[#FFFAF4] text-slate-600 border-[#FFE8E7] hover:bg-white'
                  }`}
                  style={{
                    backgroundColor: eventType === t.id ? t.color : undefined,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Linked Class */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Linked Course
            </label>
            <div className="relative">
              <select
                value={classId || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  setClassId(val);
                  if (val) {
                    const foundClass = classes.find((c) => c.id === val);
                    if (foundClass?.color) {
                      setColor(foundClass.color);
                    }
                  }
                }}
                className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none appearance-none font-medium"
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

            {classId && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[11px] text-slate-600 font-medium">
                  Using color of course: {classes.find((c) => c.id === classId)?.name}
                </span>
              </div>
            )}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Start Time *
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                End Time *
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
              Location / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Room 304, prepare chapter 3 slides..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none transition-all resize-none"
            />
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
              {loading ? 'Saving...' : eventToEdit ? 'Update Event' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
