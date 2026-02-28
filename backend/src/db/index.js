import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    const uri = `${process.env.MONGODB_URI}/${DB_NAME}`;
    console.log(`[DB] Connecting to MongoDB (${DB_NAME})…`);

    const opts = {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        retryWrites: true,
    };

    const attempt = async () => {
        try {
            const conn = await mongoose.connect(uri, opts);
            console.log(`[DB] ✅ Connected — host: ${conn.connection.host}`);
            return true;
        } catch (error) {
            console.error("[DB] ❌ Connection failed:", error.message);
            return false;
        }
    };

    const ok = await attempt();
    if (!ok) {
        console.error("[DB] ⚠️  Server will start without DB — retrying in background every 5s…");
        console.error("[DB] Check: 1) Atlas IP whitelist  2) MONGODB_URI  3) Network/firewall");
        const retryLoop = setInterval(async () => {
            if (mongoose.connection.readyState === 1) { clearInterval(retryLoop); return; }
            console.log("[DB] Retrying connection…");
            const success = await attempt();
            if (success) clearInterval(retryLoop);
        }, 5000);
    }
};

export { connectDB };