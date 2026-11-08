export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type EventType = 'kuliah' | 'lepkom' | 'personal' | 'belajar' | 'custom';

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  points?: number;
  streak?: number;
  focus_time_total?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: number;
  user_id?: number | null;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  created_at?: string;
}

export interface ClassItem {
  id: number;
  user_id?: number | null;
  category_id?: number | null;
  category_name?: string;
  category_color?: string;
  name: string;
  code?: string;
  schedule?: string;
  room?: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  user_id?: number | null;
  class_id?: number | null;
  class_name?: string;
  class_code?: string;
  category_id?: number | null;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  estimated_minutes?: number;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  is_overdue?: boolean;
  is_imminent?: boolean; // deadline within 24 hours
}

export interface CalendarEvent {
  id: number;
  user_id?: number | null;
  class_id?: number | null;
  class_name?: string;
  category_id?: number | null;
  category_name?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: EventType;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FocusSession {
  id: number;
  user_id?: number | null;
  task_id?: number | null;
  task_title?: string;
  duration_minutes: number;
  points_earned?: number;
  notes?: string;
  completed_at: string;
}

export interface DashboardSummary {
  task_counts: {
    total: number;
    todo: number;
    in_progress: number;
    done: number;
    overdue: number;
  };
  nearest_tasks: Task[];
  urgent_tasks: Task[];
  overdue_tasks: Task[];
  today_agenda: {
    events: CalendarEvent[];
    tasks: Task[];
  };
  focus_summary_today: {
    total_sessions: number;
    total_minutes: number;
  };
}
