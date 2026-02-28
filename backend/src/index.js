import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This is the bridge that connects your backend code to your root .env
dotenv.config({
    path: path.resolve(__dirname, '../../.env')
})

import {connectDB} from "./db/index.js";
import { app } from "./server.js";

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
})
.catch((err) => {
    console.log("Failed to connect to MongoDB", err);
});
