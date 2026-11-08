"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTaskStatus = exports.updateTask = exports.createTask = exports.getTaskById = exports.getTasks = void 0;
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
const getTasks = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { status, priority, category_id, category_slug, class_id, search, sort } = req.query;
        let query = `
      SELECT t.*, 
             c.name as class_name, c.code as class_code, c.color as class_color,
             cat.name as category_name, cat.slug as category_slug, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.user_id = ?
    `;
        const params = [userId];
        if (status && status !== 'all') {
            query += ' AND t.status = ?';
            params.push(status);
        }
        if (priority && priority !== 'all') {
            query += ' AND t.priority = ?';
            params.push(priority);
        }
        if (category_id && category_id !== 'all') {
            query += ' AND t.category_id = ?';
            params.push(category_id);
        }
        if (category_slug && category_slug !== 'all') {
            query += ' AND cat.slug = ?';
            params.push(category_slug);
        }
        if (class_id && class_id !== 'all') {
            query += ' AND t.class_id = ?';
            params.push(class_id);
        }
        if (search && String(search).trim() !== '') {
            query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
            const term = `%${String(search).trim()}%`;
            params.push(term, term);
        }
        // Sorting
        switch (sort) {
            case 'deadline_asc':
                query += ' ORDER BY t.status = "Done" ASC, t.deadline ASC';
                break;
            case 'deadline_desc':
                query += ' ORDER BY t.status = "Done" ASC, t.deadline DESC';
                break;
            case 'priority_desc':
                query += ` ORDER BY t.status = "Done" ASC, FIELD(t.priority, 'Urgent', 'High', 'Medium', 'Low')`;
                break;
            case 'created_asc':
                query += ' ORDER BY t.created_at ASC';
                break;
            case 'created_desc':
            default:
                query += ' ORDER BY t.status = "Done" ASC, t.deadline ASC, t.created_at DESC';
                break;
        }
        const [rows] = await db_1.default.query(query, params);
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tasks = rows.map((task) => {
            const deadlineDate = new Date(task.deadline);
            const isDone = task.status === 'Done';
            const isOverdue = !isDone && deadlineDate < now;
            const isImminent = !isDone && !isOverdue && deadlineDate <= in24h;
            return {
                ...task,
                is_overdue: isOverdue,
                is_imminent: isImminent,
            };
        });
        res.json({ tasks });
    }
    catch (error) {
        console.error('getTasks error:', error);
        res.status(500).json({ message: 'Failed to fetch tasks.', error });
    }
};
exports.getTasks = getTasks;
const getTaskById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const query = `
      SELECT t.*, 
             c.name as class_name, c.code as class_code, c.color as class_color,
             cat.name as category_name, cat.slug as category_slug, cat.color as category_color
      FROM tasks t
      LEFT JOIN classes c ON t.class_id = c.id
      LEFT JOIN categories cat ON t.category_id = cat.id
      WHERE t.id = ? AND t.user_id = ?
    `;
        const [rows] = await db_1.default.query(query, [id, userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }
        const task = rows[0];
        const deadlineDate = new Date(task.deadline);
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const isDone = task.status === 'Done';
        res.json({
            task: {
                ...task,
                is_overdue: !isDone && deadlineDate < now,
                is_imminent: !isDone && deadlineDate >= now && deadlineDate <= in24h,
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch task details.', error });
    }
};
exports.getTaskById = getTaskById;
const createTask = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, priority = 'Medium', status = 'To Do', deadline, estimated_minutes = 30, class_id, category_id, } = req.body;
        if (!title || !title.trim()) {
            res.status(400).json({ message: 'Task title is required.' });
            return;
        }
        if (!deadline) {
            res.status(400).json({ message: 'Due date is required.' });
            return;
        }
        const formattedDeadline = toSqlDateTime(deadline);
        const [result] = await db_1.default.query(`INSERT INTO tasks (user_id, class_id, category_id, title, description, priority, status, deadline, estimated_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            class_id || null,
            category_id || null,
            title.trim(),
            description || null,
            priority,
            status,
            formattedDeadline,
            Number(estimated_minutes) || 30,
        ]);
        const [created] = await db_1.default.query(`SELECT t.*, c.name as class_name, c.color as class_color, cat.name as category_name, cat.color as category_color 
       FROM tasks t 
       LEFT JOIN classes c ON t.class_id = c.id 
       LEFT JOIN categories cat ON t.category_id = cat.id 
       WHERE t.id = ?`, [result.insertId]);
        res.status(201).json({ message: 'Task created successfully.', task: created[0] });
    }
    catch (error) {
        console.error('createTask error:', error);
        res.status(500).json({ message: 'Failed to create task.', error });
    }
};
exports.createTask = createTask;
const updateTask = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { title, description, priority, status, deadline, estimated_minutes, class_id, category_id, } = req.body;
        if (!title || !title.trim()) {
            res.status(400).json({ message: 'Task title is required.' });
            return;
        }
        const formattedDeadline = deadline ? toSqlDateTime(deadline) : null;
        const completedAt = status === 'Done' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        await db_1.default.query(`UPDATE tasks 
       SET title = ?, description = ?, priority = ?, status = ?, 
           deadline = COALESCE(?, deadline), 
           estimated_minutes = ?, class_id = ?, category_id = ?, 
           completed_at = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`, [
            title.trim(),
            description || null,
            priority || 'Medium',
            status || 'To Do',
            formattedDeadline,
            Number(estimated_minutes) || 30,
            class_id || null,
            category_id || null,
            completedAt,
            id,
            userId,
        ]);
        const [updated] = await db_1.default.query(`SELECT t.*, c.name as class_name, c.color as class_color, cat.name as category_name, cat.color as category_color 
       FROM tasks t 
       LEFT JOIN classes c ON t.class_id = c.id 
       LEFT JOIN categories cat ON t.category_id = cat.id 
       WHERE t.id = ? AND t.user_id = ?`, [id, userId]);
        res.json({ message: 'Task updated successfully.', task: updated[0] });
    }
    catch (error) {
        console.error('updateTask error:', error);
        res.status(500).json({ message: 'Failed to update task.', error });
    }
};
exports.updateTask = updateTask;
const updateTaskStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['To Do', 'In Progress', 'Done'].includes(status)) {
            res.status(400).json({ message: 'Invalid status.' });
            return;
        }
        const completedAt = status === 'Done' ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null;
        await db_1.default.query(`UPDATE tasks SET status = ?, completed_at = ?, updated_at = NOW() WHERE id = ? AND user_id = ?`, [status, completedAt, id, userId]);
        res.json({ message: `Task status updated to ${status}.`, status });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update task status.', error });
    }
};
exports.updateTaskStatus = updateTaskStatus;
const deleteTask = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        await db_1.default.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Task deleted successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete task.', error });
    }
};
exports.deleteTask = deleteTask;
