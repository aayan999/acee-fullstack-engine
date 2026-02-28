import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (local dev) — on Render, env vars are set in the dashboard
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { connectDB } from "./db/index.js";
import { app } from "./server.js";

const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        // Start server even if DB fails (connectDB handles retry internally)
        console.log("⚠️ Initial DB connection failed, starting server anyway...", err.message);
        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT} (DB reconnecting in background)`);
        });
    });
