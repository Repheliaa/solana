import { Request, Response } from 'express';
import pool from '../config/db';

export const saveFocusSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const { task_id, duration_minutes, notes } = req.body;

    if (!duration_minutes || Number(duration_minutes) <= 0) {
      res.status(400).json({ message: 'Focus duration must be greater than 0 minutes.' });
      return;
    }

    // Award 1 point per 5 minutes of focused learning
    const pointsEarned = Math.max(1, Math.floor(Number(duration_minutes) / 5));

    const [result]: any = await pool.query(
      `INSERT INTO focus_sessions (user_id, task_id, duration_minutes, points_earned, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, task_id || null, Number(duration_minutes), pointsEarned, notes || null]
    );

    // Update user's total focus time and points
    await pool.query(
      `UPDATE users 
       SET focus_time_total = focus_time_total + ?, 
           points = points + ? 
       WHERE id = ?`,
      [Number(duration_minutes), pointsEarned, userId]
    );

    const [created]: any = await pool.query(
      `SELECT fs.*, t.title as task_title 
       FROM focus_sessions fs 
       LEFT JOIN tasks t ON fs.task_id = t.id 
       WHERE fs.id = ? AND fs.user_id = ?`,
      [result.insertId, userId]
    );

    res.status(201).json({
      message: 'Focus session recorded successfully.',
      session: created[0],
      points_earned: pointsEarned,
    });
  } catch (error) {
    console.error('saveFocusSession error:', error);
    res.status(500).json({ message: 'Failed to save focus session.', error });
  }
};

const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getFocusToday = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const today = getLocalDateStr();

    const [sessions]: any = await pool.query(
      `SELECT fs.*, t.title as task_title 
       FROM focus_sessions fs 
       LEFT JOIN tasks t ON fs.task_id = t.id 
       WHERE fs.user_id = ? AND DATE(fs.completed_at) = ? 
       ORDER BY fs.completed_at DESC`,
      [userId, today]
    );

    const totalMinutes = sessions.reduce((acc: number, item: any) => acc + (Number(item.duration_minutes) || 0), 0);

    res.json({
      date: today,
      total_sessions: sessions.length,
      total_minutes: totalMinutes,
      sessions,
    });
  } catch (error) {
    console.error('getFocusToday error:', error);
    res.status(500).json({ message: 'Failed to fetch focus sessions today.', error });
  }
};

export const getFocusHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    const limit = Number(req.query.limit) || 20;
    const [sessions]: any = await pool.query(
      `SELECT fs.*, t.title as task_title 
       FROM focus_sessions fs 
       LEFT JOIN tasks t ON fs.task_id = t.id 
       WHERE fs.user_id = ?
       ORDER BY fs.completed_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    res.json({ sessions });
  } catch (error) {
    console.error('getFocusHistory error:', error);
    res.status(500).json({ message: 'Failed to fetch focus session history.', error });
  }
};
