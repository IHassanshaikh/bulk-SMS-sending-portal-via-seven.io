import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import contactRoutes from "./routes/contacts.js";
import smsRoutes from "./routes/sms.js";
import campaignRoutes from "./routes/campaigns.js";
import { startWorker } from "./utils/scheduler.js";

dotenv.config();

import authRoutes from "./routes/auth.js";
import authMiddleware from "./middleware/auth.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("SMS System Backend is Running");
});

// Auth Routes (Public)
app.use("/api/auth", authRoutes);

// Protected Routes
import webhookRoutes from "./routes/webhooks.js";

// Public Webhook (Must come before auth protected routes)
// Maps POST /api/sms/webhook -> webhookRoutes (which handles "/")
app.use("/api/sms/webhook", webhookRoutes);

// Protected Routes
app.use("/api/contacts", authMiddleware, contactRoutes);
app.use("/api/sms", authMiddleware, smsRoutes);
app.use("/api/campaigns", authMiddleware, campaignRoutes);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log("Starting server initialization...");
        await connectDB();

        // Start Background Worker
        startWorker();

        app.listen(PORT, "0.0.0.0", () => console.log(`[SERVER-V4] Running on port ${PORT}`));
    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
};

startServer();
