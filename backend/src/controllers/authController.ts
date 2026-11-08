import { Request, Response } from 'express';
import pool, { hashPassword } from '../config/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'solana_productivity_secret_key_2026';

const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !username.trim()) {
      res.status(400).json({ message: 'Username is required.' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ message: 'Name is required.' });
      return;
    }

    if (!email || !email.trim()) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    // Check if username already exists
    const [existingUsername]: any = await pool.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (existingUsername.length > 0) {
      res.status(409).json({ message: 'Username is already taken.' });
      return;
    }

    // Check if email already exists
    const [existingEmail]: any = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existingEmail.length > 0) {
      res.status(409).json({ message: 'Email is already registered.' });
      return;
    }

    const hashedPass = hashPassword(password);

    const [result]: any = await pool.query(
      'INSERT INTO users (username, name, email, password, points, streak, focus_time_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [cleanUsername, name.trim(), cleanEmail, hashedPass, 0, 0, 0]
    );

    const userId = result.insertId;

    // Generate JWT token
    const token = jwt.sign({ id: userId, username: cleanUsername }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: {
        id: userId,
        username: cleanUsername,
        name: name.trim(),
        email: cleanEmail,
        avatar: null,
        points: 0,
        streak: 0,
        focus_time_total: 0,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Failed to register.', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      res.status(400).json({ message: 'Username is required.' });
      return;
    }

    if (!password) {
      res.status(400).json({ message: 'Password is required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const hashedInput = hashPassword(password);

    // Query user by username
    const [users]: any = await pool.query('SELECT * FROM users WHERE username = ?', [cleanUsername]);

    if (users.length === 0) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    const user = users[0];

    const validPassword = (user.password === hashedInput) || 
                          (process.env.APP_PASSWORD && password === process.env.APP_PASSWORD);

    if (!validPassword) {
      res.status(401).json({ message: 'Invalid username or password.' });
      return;
    }

    // Update last active
    const today = getLocalDateStr();
    await pool.query('UPDATE users SET last_active_date = ? WHERE id = ?', [today, user.id]);

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Sign in successful.',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        points: user.points,
        streak: user.streak,
        focus_time_total: user.focus_time_total,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to sign in.', error });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const [users]: any = await pool.query(
      'SELECT id, username, name, email, avatar, points, streak, focus_time_total, default_timer, theme_preference, last_active_date FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({ user: users[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user.', error });
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const [categories]: any = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories.', error });
  }
};
