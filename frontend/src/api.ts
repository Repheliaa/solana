import {
  User,
  Category,
  ClassItem,
  Task,
  CalendarEvent,
  FocusSession,
  DashboardSummary,
  TaskStatus,
} from './types';

const API_BASE = 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('solana_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Auth
  register: async (data: { username: string; name: string; email: string; password: string }): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Registration failed' }));
      throw new Error(err.message || 'Registration failed');
    }
    const resData = await res.json();
    localStorage.setItem('solana_token', resData.token);
    return resData;
  },

  login: async (username: string, password: string): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Sign in failed' }));
      throw new Error(err.message || 'Sign in failed');
    }
    const data = await res.json();
    localStorage.setItem('solana_token', data.token);
    return data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Session expired');
    return res.json();
  },

  getCategories: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE}/auth/categories`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.categories || [];
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load dashboard summary');
    return res.json();
  },

  // Classes / Courses
  getClasses: async (): Promise<ClassItem[]> => {
    const res = await fetch(`${API_BASE}/classes`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.classes || [];
  },

  createClass: async (data: Partial<ClassItem>): Promise<ClassItem> => {
    const res = await fetch(`${API_BASE}/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create course');
    }
    const json = await res.json();
    return json.classItem;
  },

  updateClass: async (id: number, data: Partial<ClassItem>): Promise<ClassItem> => {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update course');
    const json = await res.json();
    return json.classItem;
  },

  deleteClass: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete course');
  },

  syncClass: async (id: number, weeks: number = 16): Promise<{ message: string; syncedCount: number }> => {
    const res = await fetch(`${API_BASE}/classes/${id}/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ weeks }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to sync course to calendar');
    }
    return res.json();
  },

  // Tasks
  getTasks: async (params?: Record<string, string>): Promise<Task[]> => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/tasks${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    });
    const data = await res.json();
    return data.tasks || [];
  },

  createTask: async (data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create task');
    }
    const json = await res.json();
    return json.task;
  },

  updateTask: async (id: number, data: Partial<Task>): Promise<Task> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update task');
    }
    const json = await res.json();
    return json.task;
  },

  updateTaskStatus: async (id: number, status: TaskStatus): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update task status');
  },

  deleteTask: async (id: number): Promise<void> => {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  // Calendar & Events
  getCalendarItems: async (params?: { month?: number; year?: number }): Promise<{
    events: CalendarEvent[];
    task_deadlines: CalendarEvent[];
    all_items: CalendarEvent[];
  }> => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/events${query ? `?${query}` : ''}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load calendar');
    return res.json();
  },

  createEvent: async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create event');
    }
    const json = await res.json();
    return json.event;
  },

  updateEvent: async (id: number | string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update event');
    const json = await res.json();
    return json.event;
  },

  deleteEvent: async (id: number | string): Promise<void> => {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete event');
  },

  // Focus Study Sessions
  saveFocusSession: async (data: {
    task_id?: number | null;
    duration_minutes: number;
    notes?: string;
  }): Promise<{ message: string; session: FocusSession; points_earned: number }> => {
    const res = await fetch(`${API_BASE}/focus`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to save focus session');
    }
    return res.json();
  },

  getFocusToday: async (): Promise<{
    date: string;
    total_sessions: number;
    total_minutes: number;
    sessions: FocusSession[];
  }> => {
    const res = await fetch(`${API_BASE}/focus/today`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load focus sessions');
    return res.json();
  },

  getFocusHistory: async (limit = 20): Promise<{ sessions: FocusSession[] }> => {
    const res = await fetch(`${API_BASE}/focus/history?limit=${limit}`, {
      headers: getHeaders(),
    });
    return res.json();
  },
};
