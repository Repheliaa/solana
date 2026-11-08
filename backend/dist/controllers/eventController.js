"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEvents = void 0;
const db_1 = __importDefault(require("../config/db"));
const toSqlDateTime = (val) => {
    if (!val)
        return '';
    const clean = val.replace('T', ' ').trim();
    if (clean.length === 16) {
        return `${clean}:00`;
    }
    return clean.slice(0, 19);
};
const getEvents = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { month, year, start, end } = req.query;
        let startDate;
        let endDate;
        if (start && end) {
            startDate = String(start);
            endDate = String(end);
        }
        else {
            const currentYear = year ? Number(year) : new Date().getFullYear();
            const currentMonth = month ? Number(month) : new Date().getMonth() + 1;
            // Buffer 15 days before and after so trailing and leading calendar grid days are included
            const monthStart = new Date(currentYear, currentMonth - 1, 1);
            monthStart.setDate(monthStart.getDate() - 15);
            const y1 = monthStart.getFullYear();
            const m1 = String(monthStart.getMonth() + 1).padStart(2, '0');
            const d1 = String(monthStart.getDate()).padStart(2, '0');
            startDate = `${y1}-${m1}-${d1} 00:00:00`;
            const monthEnd = new Date(currentYear, currentMonth, 0);
            monthEnd.setDate(monthEnd.getDate() + 15);
            const y2 = monthEnd.getFullYear();
            const m2 = String(monthEnd.getMonth() + 1).padStart(2, '0');
            const d2 = String(monthEnd.getDate()).padStart(2, '0');
            endDate = `${y2}-${m2}-${d2} 23:59:59`;
        }
        // 1. Fetch custom events
        const eventQuery = `
      SELECT e.*, 
             c.name as class_name, c.code as class_code, c.color as class_color,
             cat.name as category_name, cat.color as category_color
      FROM events e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN categories cat ON e.category_id = cat.id
      WHERE e.user_id = ? AND ((e.start_time BETWEEN ? AND ?) OR (e.end_time BETWEEN ? AND ?))
      ORDER BY e.start_time ASC
    `;
        const [rawEvents] = await db_1.default.query(eventQuery, [userId, startDate, endDate, startDate, endDate]);
        // Ensure events adopt their class's distinctive color
        const events = rawEvents.map((ev) => ({
            ...ev,
            color: ev.class_color || ev.color,
        }));
        // 2. Fetch tasks with deadlines in this date range
        const taskQuery = `
      SELECT t.id, t.title, t.description, t.deadline, t.priority, t.status,
             t.class_id, t.category_id,
             c.name as class_name, c.color as class_color,
             cat.name as category_name, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.user_id = ? AND t.deadline BETWEEN ? AND ?
      ORDER BY t.deadline ASC
    `;
        const [tasks] = await db_1.default.query(taskQuery, [userId, startDate, endDate]);
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        // Transform tasks to calendar deadline items
        const taskCalendarItems = tasks.map((task) => {
            const deadlineDate = new Date(task.deadline);
            const isDone = task.status === 'Done';
            const isOverdue = !isDone && deadlineDate < now;
            const isImminent = !isDone && !isOverdue && deadlineDate <= in24h;
            return {
                id: `task-${task.id}`,
                taskId: task.id,
                title: `Deadline: ${task.title}`,
                description: task.description,
                start_time: task.deadline,
                end_time: task.deadline,
                event_type: 'deadline',
                color: isOverdue ? '#EFA0A3' : (isImminent ? '#EFA0A3' : (task.class_color || task.category_color || '#B7B15A')),
                is_task_deadline: true,
                priority: task.priority,
                status: task.status,
                class_id: task.class_id,
                class_name: task.class_name,
                class_color: task.class_color,
                category_name: task.category_name,
                is_overdue: isOverdue,
                is_imminent: isImminent,
            };
        });
        res.json({
            events,
            task_deadlines: taskCalendarItems,
            all_items: [...events, ...taskCalendarItems],
        });
    }
    catch (error) {
        console.error('getEvents error:', error);
        res.status(500).json({ message: 'Failed to fetch calendar data.', error });
    }
};
exports.getEvents = getEvents;
const createEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, start_time, end_time, event_type = 'personal', color, class_id, category_id, } = req.body;
        if (!title || !title.trim()) {
            res.status(400).json({ message: 'Event title is required.' });
            return;
        }
        if (!start_time || !end_time) {
            res.status(400).json({ message: 'Start and end times are required.' });
            return;
        }
        const formattedStart = toSqlDateTime(start_time);
        const formattedEnd = toSqlDateTime(end_time);
        // Default color based on class or event_type
        let eventColor = color;
        if (!eventColor && class_id) {
            const [classRows] = await db_1.default.query('SELECT color FROM classes WHERE id = ? AND user_id = ?', [class_id, userId]);
            if (classRows.length > 0 && classRows[0].color) {
                eventColor = classRows[0].color;
            }
        }
        if (!eventColor) {
            switch (event_type) {
                case 'kuliah':
                    eventColor = '#C66F80';
                    break;
                case 'lepkom':
                case 'mengajar':
                    eventColor = '#4A6644';
                    break;
                case 'personal':
                    eventColor = '#F4C7D0';
                    break;
                default:
                    eventColor = '#C66F80';
                    break;
            }
        }
        const [result] = await db_1.default.query(`INSERT INTO events (user_id, class_id, category_id, title, description, start_time, end_time, event_type, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            class_id || null,
            category_id || null,
            title.trim(),
            description || null,
            formattedStart,
            formattedEnd,
            event_type,
            eventColor,
        ]);
        const [created] = await db_1.default.query(`SELECT e.*, c.name as class_name, cat.name as category_name 
       FROM events e 
       LEFT JOIN classes c ON e.class_id = c.id 
       LEFT JOIN categories cat ON e.category_id = cat.id 
       WHERE e.id = ? AND e.user_id = ?`, [result.insertId, userId]);
        res.status(201).json({ message: 'Event scheduled successfully.', event: created[0] });
    }
    catch (error) {
        console.error('createEvent error:', error);
        res.status(500).json({ message: 'Failed to create event.', error });
    }
};
exports.createEvent = createEvent;
const updateEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { title, description, start_time, end_time, event_type, color, class_id, category_id, } = req.body;
        if (!title || !title.trim()) {
            res.status(400).json({ message: 'Event title is required.' });
            return;
        }
        const formattedStart = toSqlDateTime(start_time);
        const formattedEnd = toSqlDateTime(end_time);
        await db_1.default.query(`UPDATE events 
       SET title = ?, description = ?, start_time = ?, end_time = ?, 
           event_type = ?, color = ?, class_id = ?, category_id = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`, [
            title.trim(),
            description || null,
            formattedStart,
            formattedEnd,
            event_type || 'personal',
            color || '#97B3C2',
            class_id || null,
            category_id || null,
            id,
            userId,
        ]);
        const [updated] = await db_1.default.query('SELECT * FROM events WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Event updated successfully.', event: updated[0] });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update event.', error });
    }
};
exports.updateEvent = updateEvent;
const deleteEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        await db_1.default.query('DELETE FROM events WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Event deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete event.', error });
    }
};
exports.deleteEvent = deleteEvent;
