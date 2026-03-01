import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { Run } from './models/run.model.js';
import { verifyJWT } from './middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENGINE_DIR = path.resolve(__dirname, '../../acee-engine');

// Maximum time (ms) a run can stay "running" before we mark it as timed-out
const RUN_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

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
            if (!origin) return cb(null, true);
            if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true);

            const normalizedOrigin = origin.replace(/\/$/, "");
            const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ""));

            if (normalizedAllowed.includes(normalizedOrigin) || normalizedOrigin.endsWith(".vercel.app")) {
                return cb(null, true);
            }
            cb(new Error(`CORS Error: Origin ${origin} not allowed`));
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    })
);

app.use(express.static('public'));
app.use(cookieParser());

import { userRouter } from './routes/user.route.js';
app.use("/api/v1/users", userRouter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// ── Helper: auto-timeout stale runs ───────────────────────────────────────────
async function timeoutStaleRun(userId) {
    const stale = await Run.findOne({ user: userId, status: 'running' });
    if (stale && Date.now() - new Date(stale.startedAt).getTime() > RUN_TIMEOUT_MS) {
        stale.status = 'error';
        stale.errorMessage = 'Run timed out (exceeded 10 minutes).';
        stale.finishedAt = new Date();
        await stale.save();
        return true;
    }
    return false;
}

// ── GET /api/v1/dashboard  (per-user stats from last completed run) ──────────
app.get('/api/v1/dashboard', verifyJWT, async (req, res) => {
    try {
        // Auto-timeout any stale running job for this user
        await timeoutStaleRun(req.user._id);

        const lastRun = await Run.findOne(
            { user: req.user._id, status: { $in: ['done', 'error'] } }
        ).sort({ finishedAt: -1 });

        if (!lastRun) {
            return res.json({
                data: {
                    totalScanned: 0,
                    successfulFixes: 0,
                    syntaxErrorsPrevented: 0,
                    totalCharsSaved: 0,
                    completionTime: null,
                    repoUrl: null,
                }
            });
        }

        const s = lastRun.stats;
        return res.json({
            data: {
                totalScanned: s.totalScanned,
                successfulFixes: s.successfulFixes,
                syntaxErrorsPrevented: s.syntaxErrorsPrevented,
                totalCharsSaved: s.totalCharsSaved,
                completionTime: lastRun.finishedAt ? lastRun.finishedAt.toLocaleString() : null,
                repoUrl: lastRun.repoUrl,
            }
        });
    } catch (err) {
        console.error('[dashboard] Error:', err.message);
        res.status(500).json({ message: 'Failed to load dashboard data.' });
    }
});

// ── GET /api/v1/status  (per-user current run status) ────────────────────────
app.get('/api/v1/status', verifyJWT, async (req, res) => {
    try {
        // Auto-timeout stale runs
        await timeoutStaleRun(req.user._id);

        const activeRun = await Run.findOne(
            { user: req.user._id, status: 'running' }
        );

        if (activeRun) {
            return res.json({ data: { status: 'running', repoUrl: activeRun.repoUrl } });
        }

        // No active run — return idle
        return res.json({ data: { status: 'idle', repoUrl: null } });
    } catch (err) {
        console.error('[status] Error:', err.message);
        res.status(500).json({ message: 'Failed to fetch status.' });
    }
});

// ── POST /api/v1/evolve  (start per-user evolution) ──────────────────────────
app.post('/api/v1/evolve', verifyJWT, async (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl || !repoUrl.startsWith('https://github.com/')) {
        return res.status(400).json({ message: 'A valid GitHub repo URL is required.' });
    }

    try {
        // Auto-timeout stale runs
        await timeoutStaleRun(req.user._id);

        // Reject if user already has a running job
        const existing = await Run.findOne({ user: req.user._id, status: 'running' });
        if (existing) {
            return res.status(409).json({ message: 'An evolution run is already in progress.' });
        }

        // Create a new run document
        const run = await Run.create({
            user: req.user._id,
            repoUrl,
            status: 'running',
            startedAt: new Date(),
        });

        // Forward all relevant env vars to the child engine process
        const childEnv = {
            ...process.env,
            ACEE_RUN_ID: run._id.toString(),
            ACEE_MONGODB_URI: process.env.MONGODB_URI,
        };

        // Spawn engine as background process
        const child = spawn('node', ['main.js', repoUrl], {
            cwd: ENGINE_DIR,
            detached: true,
            stdio: 'ignore',
            env: childEnv,
        });
        child.unref();

        res.status(202).json({ message: 'Evolution started.', repoUrl, runId: run._id });
    } catch (err) {
        console.error('[evolve] Error:', err.message);
        res.status(500).json({ message: 'Failed to start evolution run.' });
    }
});

// ── Global Error Handler ──────────────────────────────────────────────────────
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
