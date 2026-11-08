import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar as CalendarIcon,
  BookOpen,
  Trash2,
  Edit2,
  Layers,
} from 'lucide-react';
import { CalendarEvent, ClassItem } from '../types';
import { isLightColor, DEFAULT_CLASS_COLOR } from '../utils/colors';

interface CalendarViewProps {
  events: CalendarEvent[];
  classes: ClassItem[];
  loading: boolean;
  onOpenNewEvent: (date?: Date) => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: number | string) => void;
  onOpenClassModal?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  classes,
  loading,
  onOpenNewEvent,
  onEditEvent,
  onDeleteEvent,
  onOpenClassModal,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(new Date());
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | 'all'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayDate(today);
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(year, month, 1);
  let startingDayOfWeek = firstDayOfMonth.getDay();
  // Shift to Monday-start: 1 is Mon, 7 is Sun
  startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: Array<{
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, daysInPrevMonth - i);
    calendarDays.push({
      date: d,
      dayNumber: daysInPrevMonth - i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Current month days
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    calendarDays.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: true,
      isToday,
    });
  }

  // Next month leading days to complete full grid
  const remainingDays = 42 - calendarDays.length;
  for (let i = 1; i <= (remainingDays >= 7 ? remainingDays - 7 : remainingDays); i++) {
    const d = new Date(year, month + 1, i);
    calendarDays.push({
      date: d,
      dayNumber: i,
      isCurrentMonth: false,
      isToday: false,
    });
  }

  // Filter events based on selected class
  const filteredEvents = events.filter((item) => {
    if (selectedClassFilter === 'all') return true;
    return item.class_id === selectedClassFilter;
  });

  const formatLocalDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatEventTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const timePart = timeStr.includes('T') ? timeStr.split('T')[1] : timeStr.split(' ')[1];
    if (timePart) {
      const parts = timePart.split(':');
      return `${parts[0]}:${parts[1]}`;
    }
    try {
      return new Date(timeStr.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeStr;
    }
  };

  const getItemsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return filteredEvents.filter((item) => {
      const itemStartStr = item.start_time ? item.start_time.split('T')[0].split(' ')[0] : '';
      return itemStartStr === dateStr;
    });
  };

  const selectedDayItems = selectedDayDate ? getItemsForDate(selectedDayDate) : [];
  const activeFilteredClass = classes.find((c) => c.id === selectedClassFilter);

  return (
    <div className="space-y-5 pb-20">
      {/* 1. Header controls */}
      <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFE8E7] text-[#9c4146] flex items-center justify-center shadow-inner">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {monthNames[month]} {year}
            </h3>
            <p className="text-xs text-slate-400">
              Schedule, courses, and deadlines overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleToday}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-[#FFFAF4] hover:bg-[#FFE8E7] border border-[#FFE8E7] rounded-xl transition-colors"
          >
            Today
          </button>

          <div className="flex items-center bg-[#FFFAF4] border border-[#FFE8E7] rounded-xl p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onOpenClassModal && (
            <button
              onClick={onOpenClassModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-[#FFFAF4] hover:bg-[#FFE8E7] border border-[#FFE8E7] rounded-xl transition-colors"
            >
              <BookOpen className="w-4 h-4 text-[#9c4146]" />
              <span>Manage Courses</span>
            </button>
          )}

          <button
            onClick={() => onOpenNewEvent(selectedDayDate || new Date())}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#EFA0A3] hover:bg-[#e68d90] rounded-xl transition-all shadow-xs shadow-[#EFA0A3]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {/* 2. Course Color Filter Bar */}
      <div className="bg-white rounded-3xl p-4 border border-[#FFE8E7] shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Filter by Course:
            </span>
          </div>

          {classes.length === 0 && onOpenClassModal && (
            <button
              onClick={onOpenClassModal}
              className="text-xs font-semibold text-[#EFA0A3] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add courses to sync with calendar</span>
            </button>
          )}
        </div>

        {/* Course Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedClassFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedClassFilter === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-[#FFFAF4] text-slate-600 hover:bg-[#FFE8E7] border border-[#FFE8E7]'
            }`}
          >
            <span>All Schedules</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/40 font-mono">
              {events.length}
            </span>
          </button>

          {classes.map((cls) => {
            const count = events.filter((e) => e.class_id === cls.id).length;
            const isSelected = selectedClassFilter === cls.id;
            const isLight = isLightColor(cls.color);

            return (
              <button
                key={cls.id}
                onClick={() => setSelectedClassFilter(cls.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border ${
                  isSelected
                    ? isLight
                      ? 'text-slate-800 shadow-xs ring-2 ring-slate-400/40 border-slate-300'
                      : 'text-white shadow-xs ring-2 ring-offset-1 ring-slate-800/30'
                    : 'bg-[#FFFAF4] hover:bg-white text-slate-700 border-[#FFE8E7]'
                }`}
                style={{
                  backgroundColor: isSelected ? cls.color : undefined,
                  borderColor: isSelected ? (isLight ? '#cbd5e1' : cls.color) : undefined,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 border"
                  style={{
                    backgroundColor: isSelected ? (isLight ? '#1e293b' : '#ffffff') : cls.color,
                    borderColor: isSelected ? (isLight ? 'rgba(0,0,0,0.15)' : 'transparent') : 'transparent',
                  }}
                />
                <span>{cls.name}</span>
                {cls.code && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected
                        ? isLight
                          ? 'bg-black/10 text-slate-800'
                          : 'bg-black/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cls.code}
                  </span>
                )}
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? isLight
                          ? 'bg-black/10 text-slate-800'
                          : 'bg-white/30 text-white'
                        : 'bg-slate-200/50 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Alert Banner */}
        {selectedClassFilter !== 'all' && activeFilteredClass && (
          <div
            className="p-2.5 rounded-2xl border flex items-center justify-between text-xs transition-all"
            style={{
              backgroundColor: `${activeFilteredClass.color}15`,
              borderColor: `${activeFilteredClass.color}40`,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: activeFilteredClass.color }}
              />
              <span className="font-semibold text-slate-800">
                Filtered view: <strong>{activeFilteredClass.name}</strong>{' '}
                {activeFilteredClass.schedule ? `(${activeFilteredClass.schedule})` : ''}
              </span>
            </div>
            <button
              onClick={() => setSelectedClassFilter('all')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 underline ml-2"
            >
              Reset filter
            </button>
          </div>
        )}
      </div>

      {/* 3. Grid & Selected Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Calendar Grid (3 columns) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
              <div
                key={day}
                className={`py-2 text-xs font-bold uppercase tracking-wider ${
                  idx >= 5 ? 'text-rose-500' : 'text-slate-400'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const dayItems = getItemsForDate(cell.date);
              const isSelected =
                selectedDayDate &&
                cell.date.toDateString() === selectedDayDate.toDateString();

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayDate(cell.date)}
                  className={`min-h-[92px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'ring-2 ring-[#EFA0A3] bg-[#FFE8E7]/30 border-[#FFCDCC]'
                      : cell.isCurrentMonth
                      ? 'bg-white border-slate-100 hover:border-[#FFE8E7] hover:bg-[#FFFAF4]'
                      : 'bg-slate-50/50 border-transparent opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        cell.isToday
                          ? 'bg-[#EFA0A3] text-white shadow-xs'
                          : cell.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {dayItems.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events preview */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayItems.slice(0, 2).map((item, i) => {
                      const itemColor = item.class_color || item.color || DEFAULT_CLASS_COLOR;
                      const isLight = isLightColor(itemColor);

                      return (
                        <div
                          key={i}
                          className={`text-[10px] px-1.5 py-0.5 rounded-lg truncate font-semibold border ${
                            item.is_task_deadline
                              ? item.is_overdue || item.is_imminent
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-[#FFE8E7] text-[#9c4146] border-[#FFCDCC]'
                              : isLight
                              ? 'text-slate-800 shadow-2xs'
                              : 'text-white'
                          }`}
                          style={{
                            backgroundColor: !item.is_task_deadline ? itemColor : undefined,
                            borderColor: !item.is_task_deadline
                              ? isLight
                                ? 'rgba(0,0,0,0.1)'
                                : itemColor
                              : undefined,
                          }}
                          title={`${item.title}${item.class_name ? ` (${item.class_name})` : ''}`}
                        >
                          {item.title}
                        </div>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-bold pl-1">
                        +{dayItems.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector (1 column) */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#FFE8E7] mb-3.5">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Daily Schedule
                </p>
                <h4 className="text-sm font-bold text-slate-800">
                  {selectedDayDate ? selectedDayDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }) : 'Select Date'}
                </h4>
              </div>
              <button
                onClick={() => onOpenNewEvent(selectedDayDate || new Date())}
                className="w-7 h-7 rounded-full bg-[#FFFAF4] hover:bg-[#FFE8E7] text-[#EFA0A3] flex items-center justify-center transition-colors border border-[#FFE8E7]"
                title="Add Schedule"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {selectedDayItems.length === 0 ? (
              <div className="py-14 text-center text-slate-400 space-y-2">
                <p className="text-xs">No events or deadlines for this date.</p>
                <button
                  onClick={() => onOpenNewEvent(selectedDayDate || new Date())}
                  className="text-xs font-semibold text-[#EFA0A3] hover:underline"
                >
                  + Add Event
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {selectedDayItems.map((item, idx) => {
                  const itemColor = item.class_color || item.color || DEFAULT_CLASS_COLOR;
                  const isLight = isLightColor(itemColor);

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all relative overflow-hidden ${
                        item.is_task_deadline
                          ? item.is_overdue || item.is_imminent
                            ? 'bg-rose-50 border-rose-200'
                            : 'bg-[#FFE8E7]/30 border-[#FFCDCC]'
                          : 'bg-[#FFFAF4] border-[#FFE8E7]'
                      }`}
                    >
                      {/* Left accent color bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: itemColor }}
                      />

                      <div className="flex items-start justify-between gap-2 pl-1.5">
                        <div className="min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            {item.class_name ? (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border"
                                style={{
                                  backgroundColor: isLight ? itemColor : `${itemColor}20`,
                                  color: isLight ? '#1e293b' : itemColor,
                                  borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'transparent',
                                }}
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>{item.class_name}</span>
                              </span>
                            ) : (
                              <span
                                className="text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider text-slate-600 bg-slate-100"
                              >
                                {item.is_task_deadline ? 'Deadline' : item.event_type}
                              </span>
                            )}

                            {item.is_imminent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                                &lt; 24h
                              </span>
                            )}
                            {item.is_overdue && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-bold">
                                Overdue
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h5 className="text-xs font-bold text-slate-800 leading-snug">
                            {item.title}
                          </h5>

                          {/* Description */}
                          {item.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {/* Time */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>
                              {formatEventTime(item.start_time)}
                              {item.end_time && item.end_time !== item.start_time && (
                                ` - ${formatEventTime(item.end_time)}`
                              )}
                            </span>
                          </div>
                        </div>

                        {!item.is_task_deadline && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => onEditEvent(item)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                              title="Edit Event"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEvent(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                              title="Delete Event"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
