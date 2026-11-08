"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncClass = exports.deleteClass = exports.updateClass = exports.createClass = exports.getClasses = void 0;
const db_1 = __importDefault(require("../config/db"));
const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Helper to generate recurring weekly class sessions in the events table
const generateClassSessions = async (classItem, weeksCount = 16) => {
    if (!classItem.day_of_week || !classItem.start_time || !classItem.end_time) {
        return 0;
    }
    const targetDay = Number(classItem.day_of_week);
    if (targetDay < 1 || targetDay > 7)
        return 0;
    // Find Monday of current week
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const currentDay = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (currentDay - 1));
    // Determine event_type based on category
    let eventType = 'kuliah';
    if (classItem.category_id) {
        const [cat] = await db_1.default.query('SELECT slug FROM categories WHERE id = ?', [classItem.category_id]);
        if (cat.length > 0 && cat[0].slug === 'lepkom') {
            eventType = 'lepkom';
        }
    }
    let createdCount = 0;
    for (let w = 0; w < weeksCount; w++) {
        const sessionDate = new Date(monday);
        sessionDate.setDate(monday.getDate() + (targetDay - 1) + (w * 7));
        const y = sessionDate.getFullYear();
        const m = String(sessionDate.getMonth() + 1).padStart(2, '0');
        const d = String(sessionDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        const startTimeFormatted = `${dateStr} ${classItem.start_time}:00`;
        const endTimeFormatted = `${dateStr} ${classItem.end_time}:00`;
        const description = [
            classItem.room ? `Room: ${classItem.room}` : '',
            classItem.code ? `Code: ${classItem.code}` : '',
        ].filter(Boolean).join(' • ') || 'Weekly lecture session';
        await db_1.default.query(`INSERT INTO events (user_id, class_id, category_id, title, description, start_time, end_time, event_type, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            classItem.user_id,
            classItem.id,
            classItem.category_id || null,
            classItem.name,
            description,
            startTimeFormatted,
            endTimeFormatted,
            eventType,
            classItem.color || '#C66F80',
        ]);
        createdCount++;
    }
    return createdCount;
};
const getClasses = async (req, res) => {
    try {
        const userId = req.user?.id;
        const query = `
      SELECT c.*, cat.name as category_name, cat.color as category_color 
      FROM classes c 
      LEFT JOIN categories cat ON c.category_id = cat.id 
      WHERE c.user_id = ?
      ORDER BY c.name ASC
    `;
        const [rows] = await db_1.default.query(query, [userId]);
        res.json({ classes: rows });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch courses.', error });
    }
};
exports.getClasses = getClasses;
const createClass = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, code, schedule, room, color, category_id, day_of_week, start_time, end_time, sync_calendar = true, recurrence_weeks = 16, } = req.body;
        if (!name || !name.trim()) {
            res.status(400).json({ message: 'Course name is required.' });
            return;
        }
        const formattedSchedule = day_of_week && start_time && end_time
            ? `${dayNames[Number(day_of_week)] || 'Schedule'}, ${start_time} - ${end_time}`
            : schedule || null;
        const [result] = await db_1.default.query(`INSERT INTO classes (user_id, category_id, name, code, schedule, room, color, day_of_week, start_time, end_time) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            userId,
            category_id || null,
            name.trim(),
            code || null,
            formattedSchedule,
            room || null,
            color || '#C66F80',
            day_of_week ? Number(day_of_week) : null,
            start_time || null,
            end_time || null,
        ]);
        const [created] = await db_1.default.query('SELECT * FROM classes WHERE id = ? AND user_id = ?', [result.insertId, userId]);
        const classItem = created[0];
        let syncedEvents = 0;
        if (sync_calendar && day_of_week && start_time && end_time) {
            syncedEvents = await generateClassSessions(classItem, Number(recurrence_weeks) || 16);
        }
        res.status(201).json({
            message: `Course added successfully${syncedEvents > 0 ? ` and synchronized (${syncedEvents} calendar sessions)` : ''}.`,
            classItem,
            syncedEvents,
        });
    }
    catch (error) {
        console.error('createClass error:', error);
        res.status(500).json({ message: 'Failed to create course.', error });
    }
};
exports.createClass = createClass;
const updateClass = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { name, code, schedule, room, color, category_id, day_of_week, start_time, end_time, sync_calendar = true, recurrence_weeks = 16, } = req.body;
        if (!name || !name.trim()) {
            res.status(400).json({ message: 'Course name is required.' });
            return;
        }
        const formattedSchedule = day_of_week && start_time && end_time
            ? `${dayNames[Number(day_of_week)] || 'Schedule'}, ${start_time} - ${end_time}`
            : schedule || null;
        await db_1.default.query(`UPDATE classes 
       SET name = ?, code = ?, schedule = ?, room = ?, color = ?, category_id = ?,
           day_of_week = ?, start_time = ?, end_time = ?, updated_at = NOW() 
       WHERE id = ? AND user_id = ?`, [
            name.trim(),
            code || null,
            formattedSchedule,
            room || null,
            color || '#C66F80',
            category_id || null,
            day_of_week ? Number(day_of_week) : null,
            start_time || null,
            end_time || null,
            id,
            userId,
        ]);
        // Update existing events for this class
        await db_1.default.query(`UPDATE events 
       SET title = ?, color = ? 
       WHERE class_id = ? AND user_id = ?`, [name.trim(), color || '#97B3C2', id, userId]);
        let syncedEvents = 0;
        if (sync_calendar && day_of_week && start_time && end_time) {
            await db_1.default.query('DELETE FROM events WHERE class_id = ? AND user_id = ? AND start_time >= CURDATE()', [id, userId]);
            const [updated] = await db_1.default.query('SELECT * FROM classes WHERE id = ? AND user_id = ?', [id, userId]);
            if (updated.length > 0) {
                syncedEvents = await generateClassSessions(updated[0], Number(recurrence_weeks) || 16);
            }
        }
        const [updated] = await db_1.default.query('SELECT * FROM classes WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({
            message: `Course updated successfully${syncedEvents > 0 ? ` and synchronized (${syncedEvents} calendar sessions)` : ''}.`,
            classItem: updated[0],
            syncedEvents,
        });
    }
    catch (error) {
        console.error('updateClass error:', error);
        res.status(500).json({ message: 'Failed to update course.', error });
    }
};
exports.updateClass = updateClass;
const deleteClass = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        await db_1.default.query('DELETE FROM events WHERE class_id = ? AND user_id = ?', [id, userId]);
        await db_1.default.query('UPDATE tasks SET class_id = NULL WHERE class_id = ? AND user_id = ?', [id, userId]);
        await db_1.default.query('DELETE FROM classes WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ message: 'Course and its calendar sessions were deleted.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete course.', error });
    }
};
exports.deleteClass = deleteClass;
const syncClass = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { weeks = 16 } = req.body;
        const [rows] = await db_1.default.query('SELECT * FROM classes WHERE id = ? AND user_id = ?', [id, userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Course not found.' });
            return;
        }
        const classItem = rows[0];
        if (!classItem.day_of_week || !classItem.start_time || !classItem.end_time) {
            res.status(400).json({
                message: 'This course does not have a complete weekly schedule configured.',
            });
            return;
        }
        await db_1.default.query('DELETE FROM events WHERE class_id = ? AND user_id = ? AND start_time >= CURDATE()', [id, userId]);
        const count = await generateClassSessions(classItem, Number(weeks) || 16);
        res.json({
            message: `Successfully synced ${count} sessions for "${classItem.name}".`,
            syncedCount: count,
        });
    }
    catch (error) {
        console.error('syncClass error:', error);
        res.status(500).json({ message: 'Failed to sync course to calendar.', error });
    }
};
exports.syncClass = syncClass;
