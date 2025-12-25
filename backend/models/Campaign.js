import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema({
    name: { type: String, unique: true },
    message: String,
    date: { type: Date, default: Date.now },
    totalSent: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    interval: { type: Number, default: 0 }, // Interval in minutes
    startTime: { type: Date, default: Date.now },
    status: { type: String, default: "QUEUED" }, // QUEUED, RUNNING, PAUSED, COMPLETED, CANCELED
    lastSent: { type: Date, default: null }
});

export default mongoose.model("Campaign", CampaignSchema);
