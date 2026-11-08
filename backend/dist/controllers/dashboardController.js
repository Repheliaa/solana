"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardSummary = void 0;
const db_1 = __importDefault(require("../config/db"));
const getLocalDateStr = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user?.id;
        const now = new Date();
        const today = getLocalDateStr(now);
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        // 1. Task counts by status for this user
        const [counts] = await db_1.default.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'To Do' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done,
        SUM(CASE WHEN status != 'Done' AND deadline < NOW() THEN 1 ELSE 0 END) as overdue
      FROM tasks
      WHERE user_id = ?
    `, [userId]);
        // 2. Nearest tasks (upcoming non-done tasks)
        const [nearest] = await db_1.default.query(`
      SELECT t.*, c.name as class_name, cat.name as category_name, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.user_id = ? AND t.status != 'Done'
      ORDER BY t.deadline ASC
      LIMIT 5
    `, [userId]);
        const nearestFormatted = nearest.map((task) => {
            const deadlineDate = new Date(task.deadline);
            const isOverdue = deadlineDate < now;
            const isImminent = !isOverdue && deadlineDate <= in24h;
            return {
                ...task,
                is_overdue: isOverdue,
                is_imminent: isImminent,
            };
        });
        // 3. Urgent and High priority tasks not completed
        const [urgent] = await db_1.default.query(`
      SELECT t.*, c.name as class_name, cat.name as category_name, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.user_id = ? AND t.status != 'Done' AND t.priority IN ('Urgent', 'High')
      ORDER BY FIELD(t.priority, 'Urgent', 'High'), t.deadline ASC
      LIMIT 5
    `, [userId]);
        // 4. Overdue tasks
        const [overdue] = await db_1.default.query(`
      SELECT t.*, c.name as class_name, cat.name as category_name, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.user_id = ? AND t.status != 'Done' AND t.deadline < NOW()
      ORDER BY t.deadline ASC
      LIMIT 5
    `, [userId]);
        // 5. Today's agenda: events & tasks due today
        const [todayEvents] = await db_1.default.query(`
      SELECT e.*, c.name as class_name, cat.name as category_name, cat.color as category_color
      FROM events e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN categories cat ON e.category_id = cat.id
      WHERE e.user_id = ? AND DATE(e.start_time) = ?
      ORDER BY e.start_time ASC
    `, [userId, today]);
        const [todayTasks] = await db_1.default.query(`
      SELECT t.*, c.name as class_name, cat.name as category_name, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.user_id = ? AND DATE(t.deadline) = ?
      ORDER BY t.deadline ASC
    `, [userId, today]);
        // 6. Today's focus sessions
        const [focusToday] = await db_1.default.query(`
      SELECT fs.*, t.title as task_title
      FROM focus_sessions fs
      LEFT JOIN tasks t ON fs.task_id = t.id
      WHERE fs.user_id = ? AND DATE(fs.completed_at) = ?
      ORDER BY fs.completed_at DESC
    `, [userId, today]);
        const totalFocusMinutes = focusToday.reduce((acc, item) => acc + (Number(item.duration_minutes) || 0), 0);
        // 7. User profile stats
        const [userRows] = await db_1.default.query('SELECT name, username, avatar, points, streak, focus_time_total FROM users WHERE id = ?', [userId]);
        const user = userRows[0] || null;
        res.json({
            task_counts: {
                total: Number(counts[0].total) || 0,
                todo: Number(counts[0].todo) || 0,
                in_progress: Number(counts[0].in_progress) || 0,
                done: Number(counts[0].done) || 0,
                overdue: Number(counts[0].overdue) || 0,
            },
            nearest_tasks: nearestFormatted,
            urgent_tasks: urgent,
            overdue_tasks: overdue,
            today_agenda: {
                events: todayEvents,
                tasks: todayTasks,
            },
            focus_summary_today: {
                total_sessions: focusToday.length,
                total_minutes: totalFocusMinutes,
                recent_sessions: focusToday.slice(0, 3),
            },
            user,
        });
    }
    catch (error) {
        console.error('getDashboardSummary error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard summary.', error });
    }
};
exports.getDashboardSummary = getDashboardSummary;
