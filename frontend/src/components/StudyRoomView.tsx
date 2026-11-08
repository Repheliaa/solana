import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  BookOpen,
  Timer,
  Award,
  History,
  FileText,
} from 'lucide-react';
import { Task, FocusSession } from '../types';
import { api } from '../api';

interface StudyRoomViewProps {
  tasks: Task[];
  initialSelectedTaskId?: number | null;
  onSessionCompleteRefresh: () => void;
}

export const StudyRoomView: React.FC<StudyRoomViewProps> = ({
  tasks,
  initialSelectedTaskId,
  onSessionCompleteRefresh,
}) => {
  const presets = [25, 50, 90, 120];

  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [customInput, setCustomInput] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [totalDuration, setTotalDuration] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Task & Notes
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(
    initialSelectedTaskId || undefined
  );
  const [notes, setNotes] = useState<string>('');

  // Daily statistics & history
  const [todayStats, setTodayStats] = useState<{
    total_sessions: number;
    total_minutes: number;
    sessions: FocusSession[];
  }>({
    total_sessions: 0,
    total_minutes: 0,
    sessions: [],
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState<{
    duration: number;
    points: number;
    taskTitle: string;
  } | null>(null);

  const timerRef = useRef<any>(null);

  // Web Audio chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch {
      // AudioContext might be blocked until user interacts, safely ignored
    }
  };

  const loadTodayStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getFocusToday();
      setTodayStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadTodayStats();
  }, []);

  useEffect(() => {
    if (initialSelectedTaskId) {
      setSelectedTaskId(initialSelectedTaskId);
    }
  }, [initialSelectedTaskId]);

  // Timer Tick
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, totalDuration]);

  const handleSelectPreset = (minutes: number) => {
    if (isActive) {
      if (!window.confirm('Reset timer to new duration?')) return;
    }
    setIsActive(false);
    setIsPaused(false);
    setIsCustom(false);
    setSelectedMinutes(minutes);
    setTimeLeft(minutes * 60);
    setTotalDuration(minutes * 60);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customInput);
    if (!mins || mins <= 0 || mins > 300) {
      alert('Please enter a duration between 1 and 300 minutes.');
      return;
    }
    setIsActive(false);
    setIsPaused(false);
    setIsCustom(true);
    setSelectedMinutes(mins);
    setTimeLeft(mins * 60);
    setTotalDuration(mins * 60);
  };

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    if (isActive && !window.confirm('Cancel the current focus session?')) return;
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(selectedMinutes * 60);
  };

  const handleTimerComplete = async () => {
    setIsActive(false);
    setIsPaused(false);
    playChime();

    const durationMins = Math.round(totalDuration / 60);
    const activeTask = tasks.find((t) => t.id === selectedTaskId);

    try {
      const res = await api.saveFocusSession({
        task_id: selectedTaskId || null,
        duration_minutes: durationMins,
        notes: notes.trim() || undefined,
      });

      setCompletedSessionData({
        duration: durationMins,
        points: res.points_earned,
        taskTitle: activeTask ? activeTask.title : 'Solo Focus Session',
      });
      setShowCompletionModal(true);

      loadTodayStats();
      onSessionCompleteRefresh();
    } catch {
      alert('Session completed, but failed to save history.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const strokeDashoffset = 565.48 - (565.48 * progressPercent) / 100;

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Main Focus Workspace */}
      <div className="bg-white rounded-3xl p-7 border border-[#FFE8E7] shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Preset controls & Task selector */}
        <div className="lg:col-span-5 space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBEBBF] text-[#4b4819] text-xs font-semibold mb-2">
              <Timer className="w-3.5 h-3.5" />
              <span>Pomodoro & Focus</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">
              Focus Room
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Select a task, set your timer, and focus without distractions.
            </p>
          </div>

          {/* Task selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Target Task:
            </label>
            <div className="relative">
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : undefined)}
                disabled={isActive}
                className="w-full text-xs p-3 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none appearance-none disabled:opacity-70 font-medium text-slate-800"
              >
                <option value="">Solo Session (No task selected)</option>
                {tasks
                  .filter((t) => t.status !== 'Done')
                  .map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} {task.class_name ? `• ${task.class_name}` : ''}
                    </option>
                  ))}
              </select>
              <BookOpen className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Timer Presets:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {presets.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={isActive}
                  onClick={() => handleSelectPreset(mins)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    !isCustom && selectedMinutes === mins
                      ? 'bg-[#EFA0A3] text-white border-[#EFA0A3] shadow-xs'
                      : 'bg-[#FFFAF4] text-slate-700 border-[#FFE8E7] hover:bg-white disabled:opacity-60'
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>

            {/* Custom Minutes Input */}
            <form onSubmit={handleApplyCustom} className="flex gap-2 pt-1">
              <input
                type="number"
                min="1"
                max="300"
                placeholder="Custom minutes..."
                disabled={isActive}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isActive || !customInput}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                Set
              </button>
            </form>
          </div>

          {/* Notes input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Session Notes (Optional):
            </label>
            <textarea
              rows={2}
              placeholder="What are your goals for this focus session?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] focus:border-[#EFA0A3] focus:bg-white outline-none resize-none transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        {/* Right Column: Circular Timer Display & Controls */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-2">
          {/* Circular SVG Timer */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                className="stroke-[#FFE8E7]"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                className="stroke-[#EFA0A3] transition-all duration-1000 ease-linear"
                strokeWidth="8"
                strokeDasharray="565.48"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-4xl font-extrabold text-slate-800 font-mono tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                {isActive ? (isPaused ? 'Paused' : 'Focusing') : 'Ready'}
              </span>
              {selectedTaskId && (
                <span className="text-[11px] font-semibold text-[#B7B15A] max-w-[160px] truncate mt-1.5 bg-[#EBEBBF]/40 px-2 py-0.5 rounded-full">
                  {tasks.find((t) => t.id === selectedTaskId)?.title || 'Selected Task'}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 mt-6">
            {!isActive ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-[#EFA0A3] hover:bg-[#e68d90] active:scale-95 text-white font-semibold text-xs transition-all shadow-xs"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Focus</span>
              </button>
            ) : isPaused ? (
              <>
                <button
                  onClick={handleResume}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#B7B15A] hover:bg-[#a59f4d] active:scale-95 text-white font-semibold text-xs transition-all shadow-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-semibold text-xs transition-all shadow-xs"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Today's Study Stats & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Metric 1 */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EBEBBF] text-[#4b4819] flex items-center justify-center flex-shrink-0">
            <Timer className="w-5 h-5 text-[#B7B15A]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Focus Time Today</p>
            <h4 className="text-2xl font-bold text-[#57541f] mt-0.5">
              {todayStats.total_minutes} <span className="text-xs font-semibold text-slate-400">min</span>
            </h4>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE8E7] text-[#9c4146] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-[#EFA0A3]" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Completed Sessions</p>
            <h4 className="text-2xl font-bold text-[#9c4146] mt-0.5">
              {todayStats.total_sessions} <span className="text-xs font-semibold text-slate-400">sessions</span>
            </h4>
          </div>
        </div>

        {/* Metric 3: History */}
        <div className="bg-white rounded-3xl p-5 border border-[#FFE8E7] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Today's Sessions</h4>
            </div>

            {todayStats.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No focus sessions recorded yet today.</p>
            ) : (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {todayStats.sessions.slice(0, 3).map((session, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-[#FFFAF4] border border-[#FFE8E7] flex items-center justify-between text-xs"
                  >
                    <span className="truncate text-slate-700 font-medium">
                      {session.task_title || 'Solo Session'}
                    </span>
                    <span className="text-[#B7B15A] font-bold text-xs">
                      {session.duration_minutes}m
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Session Complete Celebration Modal */}
      {showCompletionModal && completedSessionData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center space-y-4 shadow-xl border border-[#FFE8E7]">
            <div className="w-12 h-12 rounded-2xl bg-[#EBEBBF] text-[#4b4819] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#B7B15A]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">Session Completed!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Great job focusing on <strong>{completedSessionData.taskTitle}</strong>.
              </p>
            </div>

            <div className="p-3 bg-[#FFFAF4] rounded-2xl border border-[#FFE8E7] flex items-center justify-around text-xs">
              <div>
                <p className="text-slate-400">Duration</p>
                <p className="text-base font-bold text-[#57541f]">{completedSessionData.duration} min</p>
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div>
                <p className="text-slate-400">Points</p>
                <p className="text-base font-bold text-[#9c4146]">+{completedSessionData.points} pts</p>
              </div>
            </div>

            <button
              onClick={() => setShowCompletionModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#EFA0A3] hover:bg-[#e68d90] text-white text-xs font-semibold transition-all shadow-xs"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
