import React, { useState, useEffect } from 'react';
import { api } from './api';
import { User, Task, ClassItem, Category, CalendarEvent, DashboardSummary, TaskStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
import { StudyRoomView } from './components/StudyRoomView';
import { TaskModal } from './components/TaskModal';
import { ClassModal } from './components/ClassModal';
import { EventModal } from './components/EventModal';

export const App: React.FC = () => {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tasks' | 'calendar' | 'study'>('dashboard');

  // Application Data States
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [defaultEventDate, setDefaultEventDate] = useState<Date | undefined>(undefined);

  // Link task to study room
  const [activeStudyTaskId, setActiveStudyTaskId] = useState<number | null>(null);

  // 1. Initial auth check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('solana_token');
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          localStorage.removeItem('solana_token');
          setUser(null);
        }
      }
      setAuthChecking(false);
    };
    checkAuth();
  }, []);

  // 2. Fetch main application data when user is logged in
  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [dashRes, tasksRes, classesRes, catsRes, calRes] = await Promise.all([
        api.getDashboardSummary().catch(() => null),
        api.getTasks().catch(() => []),
        api.getClasses().catch(() => []),
        api.getCategories().catch(() => []),
        api.getCalendarItems().catch(() => ({ all_items: [] })),
      ]);

      if (dashRes) setDashboardSummary(dashRes);
      setTasks(tasksRes);
      setClasses(classesRes);
      setCategories(catsRes);
      setCalendarEvents(calRes.all_items || []);
    } catch (err) {
      console.error('Error fetching Solana data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('solana_token');
    setUser(null);
  };

  // Task Handlers
  const handleOpenNewTask = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleToggleTaskStatus = async (taskId: number, currentStatus: string) => {
    const nextStatus: TaskStatus = currentStatus === 'Done' ? 'To Do' : 'Done';
    try {
      await api.updateTaskStatus(taskId, nextStatus);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update task status');
    }
  };

  const handleStartFocusOnTask = (task: Task) => {
    setActiveStudyTaskId(task.id);
    setActiveTab('study');
  };

  // Event Handlers
  const handleOpenNewEvent = (date?: Date) => {
    setEventToEdit(null);
    setDefaultEventDate(date || new Date());
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsEventModalOpen(true);
  };

  const handleDeleteEvent = async (id: number | string) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.deleteEvent(id);
      fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    }
  };

  // Loading indicator for authentication
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FFFAF4] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#FFE8E7] flex items-center justify-center shadow-inner border border-[#FFCDCC]">
          <div className="w-5 h-5 border-2 border-[#EFA0A3] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-xs font-medium text-slate-400 tracking-wide">
          Loading Solana workspace...
        </p>
      </div>
    );
  }

  // If not logged in, render the Login screen
  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#FFFAF4] text-slate-800">
      {/* Desktop Sidebar */}
      <div className="hidden sm:block">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
          openClassModal={() => setIsClassModalOpen(true)}
          taskCounts={{
            todo: dashboardSummary?.task_counts.todo || 0,
            overdue: dashboardSummary?.task_counts.overdue || 0,
          }}
        />
      </div>

      {/* Main Content Area */}
      <div className="sm:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <Header
          activeTab={activeTab}
          user={user}
          onOpenNewTask={handleOpenNewTask}
          onOpenStudy={() => setActiveTab('study')}
        />

        {/* Tab Content View */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              summary={dashboardSummary}
              loading={loading}
              onOpenStudy={() => setActiveTab('study')}
              onOpenTasks={() => setActiveTab('tasks')}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksView
              tasks={tasks}
              classes={classes}
              categories={categories}
              loading={loading}
              onOpenNewTask={handleOpenNewTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleStatus={(id, status) => handleToggleTaskStatus(id, status)}
              onStartFocusOnTask={handleStartFocusOnTask}
              onOpenClassModal={() => setIsClassModalOpen(true)}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              events={calendarEvents}
              classes={classes}
              loading={loading}
              onOpenNewEvent={handleOpenNewEvent}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
              onOpenClassModal={() => setIsClassModalOpen(true)}
            />
          )}

          {activeTab === 'study' && (
            <StudyRoomView
              tasks={tasks}
              initialSelectedTaskId={activeStudyTaskId}
              onSessionCompleteRefresh={fetchAllData}
            />
          )}
        </main>

        {/* Mobile Navigation */}
        <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskToEdit={taskToEdit}
        classes={classes}
        categories={categories}
        onSuccess={fetchAllData}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        classes={classes}
        categories={categories}
        onRefresh={fetchAllData}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        classes={classes}
        defaultDate={defaultEventDate}
        onSuccess={fetchAllData}
      />
    </div>
  );
};

export default App;
