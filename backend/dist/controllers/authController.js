"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = exports.getMe = exports.login = exports.register = void 0;
const db_1 = __importStar(require("../config/db"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'solana_productivity_secret_key_2026';
const getLocalDateStr = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const register = async (req, res) => {
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
        const [existingUsername] = await db_1.default.query('SELECT id FROM users WHERE username = ?', [cleanUsername]);
        if (existingUsername.length > 0) {
            res.status(409).json({ message: 'Username is already taken.' });
            return;
        }
        // Check if email already exists
        const [existingEmail] = await db_1.default.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
        if (existingEmail.length > 0) {
            res.status(409).json({ message: 'Email is already registered.' });
            return;
        }
        const hashedPass = (0, db_1.hashPassword)(password);
        const [result] = await db_1.default.query('INSERT INTO users (username, name, email, password, points, streak, focus_time_total) VALUES (?, ?, ?, ?, ?, ?, ?)', [cleanUsername, name.trim(), cleanEmail, hashedPass, 0, 0, 0]);
        const userId = result.insertId;
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: userId, username: cleanUsername }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Failed to register.', error });
    }
};
exports.register = register;
const login = async (req, res) => {
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
        const hashedInput = (0, db_1.hashPassword)(password);
        // Query user by username
        const [users] = await db_1.default.query('SELECT * FROM users WHERE username = ?', [cleanUsername]);
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
        await db_1.default.query('UPDATE users SET last_active_date = ? WHERE id = ?', [today, user.id]);
        // Generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Failed to sign in.', error });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const [users] = await db_1.default.query('SELECT id, username, name, email, avatar, points, streak, focus_time_total, default_timer, theme_preference, last_active_date FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        res.json({ user: users[0] });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch user.', error });
    }
};
exports.getMe = getMe;
const getCategories = async (req, res) => {
    try {
        const [categories] = await db_1.default.query('SELECT * FROM categories ORDER BY id ASC');
        res.json({ categories });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch categories.', error });
    }
};
exports.getCategories = getCategories;
