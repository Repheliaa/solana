"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const auth_1 = require("./middleware/auth");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const classRoutes_1 = __importDefault(require("./routes/classRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const focusRoutes_1 = __importDefault(require("./routes/focusRoutes"));
const dashboardRoutes_1 = __importDefault(require("./routes/dashboardRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: '*', // Allow all in local development
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/classes', auth_1.authMiddleware, classRoutes_1.default);
app.use('/api/tasks', auth_1.authMiddleware, taskRoutes_1.default);
app.use('/api/events', auth_1.authMiddleware, eventRoutes_1.default);
app.use('/api/focus', auth_1.authMiddleware, focusRoutes_1.default);
app.use('/api/dashboard', auth_1.authMiddleware, dashboardRoutes_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        app: 'Solana Productivity API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// Root welcome
app.get('/', (req, res) => {
    res.send('🌿 Solana Productivity Backend is running smoothly.');
});
// Start Server and initialize DB
const startServer = async () => {
    try {
        await (0, db_1.initDatabase)();
        app.listen(PORT, () => {
            console.log(`🚀 Solana server running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start Solana server:', error);
        process.exit(1);
    }
};
startServer();
