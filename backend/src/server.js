import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENGINE_DIR = path.resolve(__dirname, '../../acee-engine');
const STATS_FILE = path.join(ENGINE_DIR, 'dashboard_data.json');
const STATUS_FILE = path.join(ENGINE_DIR, 'run_status.json');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

const allowedOrigins = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
].filter(Boolean);

app.use(
    cors({
        origin: (origin, cb) => {
            // Allow requests with no origin (e.g. curl, Postman)
            if (!origin) return cb(null, true);
            // Allow any localhost port in development
            if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error('Not allowed by CORS'));
        },
        credentials: true
    })
);

app.use(express.static('public'));
app.use(cookieParser());

import { userRouter } from './routes/user.route.js';
app.use("/api/v1/users", userRouter);

// ── Health Check (keeps Render free tier alive) ───────────────────────────────
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const readJSON = (filePath, fallback) => {
    try {
        if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (_) { }
    return fallback;
};

// ── GET /api/v1/dashboard ─────────────────────────────────────────────────────
app.get('/api/v1/dashboard', (req, res) => {
    const data = readJSON(STATS_FILE, {
        totalScanned: 0,
        successfulFixes: 0,
        syntaxErrorsPrevented: 0,
        totalCharsSaved: 0,
        completionTime: null,
        repoUrl: null,
    });
    res.json({ data });
});

// ── GET /api/v1/status ────────────────────────────────────────────────────────
app.get('/api/v1/status', (req, res) => {
    const data = readJSON(STATUS_FILE, { status: 'idle', repoUrl: null });
    res.json({ data });
});

// ── POST /api/v1/evolve ───────────────────────────────────────────────────────
app.post('/api/v1/evolve', (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl || !repoUrl.startsWith('https://github.com/')) {
        return res.status(400).json({ message: 'A valid GitHub repo URL is required.' });
    }

    // Reject if already running
    const current = readJSON(STATUS_FILE, { status: 'idle' });
    if (current.status === 'running') {
        return res.status(409).json({ message: 'An evolution run is already in progress.' });
    }

    // Spawn engine as background process — detached so it outlives this request
    const child = spawn('node', ['main.js', repoUrl], {
        cwd: ENGINE_DIR,
        detached: true,
        stdio: 'ignore',
    });
    child.unref();

    res.status(202).json({ message: 'Evolution started.', repoUrl });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// Required for asyncHandler + ApiError to return proper JSON error responses
app.use((err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    return res.status(statusCode).json({
        success: false,
        message,
        errors: err.errors || [],
    });
});

export { app };
