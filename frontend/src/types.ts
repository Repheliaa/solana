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
  default_timer?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  color: string;
  icon?: string;
}

export interface ClassItem {
  id: number;
  name: string;
  code?: string;
  schedule?: string;
  room?: string;
  color: string;
  category_id?: number | null;
  category_name?: string;
  category_color?: string;
  day_of_week?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  sync_calendar?: boolean;
  recurrence_weeks?: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string;
  estimated_minutes?: number;
  completed_at?: string | null;
  class_id?: number | null;
  class_name?: string;
  class_code?: string;
  class_color?: string;
  category_id?: number | null;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
  is_overdue?: boolean;
  is_imminent?: boolean;
  created_at?: string;
}

export interface CalendarEvent {
  id: number | string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: EventType | 'deadline';
  color?: string;
  class_id?: number | null;
  class_name?: string;
  class_code?: string;
  class_color?: string;
  category_id?: number | null;
  category_name?: string;
  is_task_deadline?: boolean;
  priority?: Priority;
  status?: TaskStatus;
  is_overdue?: boolean;
  is_imminent?: boolean;
}

export interface FocusSession {
  id: number;
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
    recent_sessions: FocusSession[];
  };
  user?: User;
}
