import express from "express";
import Contact from "../models/Contact.js";
import SmsLog from "../models/SmsLog.js";
import Campaign from "../models/Campaign.js";
import { sendSMS } from "../utils/sendSMS.js";
import axios from "axios";
import QueueItem from "../models/QueueItem.js";

const router = express.Router();

// Webhook Management
router.get("/hooks", async (req, res) => {
    try {
        const response = await axios.get("https://gateway.seven.io/api/hooks", {
            headers: { "X-Api-Key": process.env.SEVEN_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post("/hooks", async (req, res) => {
    try {
        const { target_url, event_type } = req.body;
        const response = await axios.post("https://gateway.seven.io/api/hooks", {
            target_url,
            event_type: event_type || "all",
            request_method: "POST"
        }, {
            headers: {
                "X-Api-Key": process.env.SEVEN_API_KEY,
                "Content-Type": "application/json"
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Account Balance
router.get("/balance", async (req, res) => {
    try {
        const response = await axios.get("https://gateway.seven.io/api/balance", {
            headers: { "X-Api-Key": process.env.SEVEN_API_KEY }
        });
        console.log("Seven.io Balance Response:", response.data);
        res.json({ balance: response.data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clear All SMS Logs
router.delete("/logs", async (req, res) => {
    try {
        await SmsLog.deleteMany({});
        res.json({ message: "All logs cleared" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Bulk SMS Sender
router.post("/bulk", async (req, res) => {
    try {
        const { message, campaignId, interval, startTime, campaignName, batchSize, msgLimit } = req.body;
        console.log("Bulk SMS Request - DEBUG:", { interval, batchSize, startTime, campaignName, msgLimit });
        console.log("Raw Body Interval:", req.body.interval, "Type:", typeof req.body.interval);

        // Validation for Interval
        let iVal = parseFloat(interval);
        if (isNaN(iVal)) iVal = 0;
        // If an interval was provided but less than 1 minute, enforce minimum 1 minute
        if (req.body.interval != null && req.body.interval !== "" && iVal > 0 && iVal < 1) {
            console.log(`[Interval Adjust] Provided interval ${iVal} < 1 minute. Enforcing minimum of 1 minute.`);
            iVal = 1;
        }

        // We no longer support batch-mode scheduling; always apply per-message interval.
        console.log(`Parsed Values: iVal=${iVal}`);

        // Check Campaign Name Uniqueness
        if (campaignName) {
            const existingCampaign = await Campaign.findOne({ name: campaignName });
            if (existingCampaign) {
                return res.status(400).json({ success: false, message: "Campaign name already exists. Please choose a different name." });
            }
        }

        const query = campaignId ? { campaignId } : {};
        const contacts = await Contact.find(query);

        if (!contacts.length) {
            return res.status(400).json({ success: false, message: "No contacts found" });
        }

        // APPLY MESSAGE LIMIT
        if (msgLimit && parseInt(msgLimit) > 0) {
            const limit = parseInt(msgLimit);
            if (contacts.length > limit) {
                console.log(`Applying limit: Reducing contacts from ${contacts.length} to ${limit}`);
                contacts.length = limit;
            }
        }

        // Determine start time
        let start = startTime ? new Date(startTime) : new Date();
        if (isNaN(start.getTime())) start = new Date();

        // [FIX] Ensure we don't schedule in the past (which causes instant burst sending)
        const now = new Date();
        if (start < now) {
            console.log(`[Schedule Fix] Start time ${start.toISOString()} is in the past (or too close). Resetting to NOW: ${now.toISOString()}`);
            start = now;
        }

        console.log("--- SCHEDULING DEBUG ---");
        console.log(`Base Start Time: ${start.toISOString()}`);
        console.log(`Input Interval: ${interval}`);

        const queueItems = [];

        // Build queue items with per-message delays only
        contacts.forEach((contact, index) => {
            const delayInMs = index * iVal * 60 * 1000; // minutes -> ms
            const sendAt = new Date(start.getTime() + delayInMs);

            if (index < 5) {
                console.log(`[Item ${index}] iVal: ${iVal}, delayInMs: ${delayInMs}, Scheduled: ${sendAt.toISOString()}`);
            }

            queueItems.push({
                campaignId: null,
                phone: contact.phone,
                message,
                status: "PENDING",
                sendAt: sendAt
            });
        });

        // Defensive fix: ensure sendAt timestamps are strictly increasing
        // This prevents multiple items from sharing the exact same millisecond timestamp
        // which can cause the worker to pick and send several messages at once.
        queueItems.sort((a, b) => new Date(a.sendAt) - new Date(b.sendAt));
        for (let i = 1; i < queueItems.length; i++) {
            const prev = queueItems[i - 1].sendAt instanceof Date ? queueItems[i - 1].sendAt : new Date(queueItems[i - 1].sendAt);
            const cur = queueItems[i].sendAt instanceof Date ? queueItems[i].sendAt : new Date(queueItems[i].sendAt);
            if (cur.getTime() <= prev.getTime()) {
                // bump current by 1 second beyond the previous item
                queueItems[i].sendAt = new Date(prev.getTime() + 1000);
            }
        }

        const newCampaign = await Campaign.create({
            name: campaignName || `Campaign-${Date.now()}`,
            message,
            totalSent: 0,
            interval: interval || 0,
            startTime: start,
            status: "QUEUED"
        });

        // Link items
        queueItems.forEach(item => item.campaignId = newCampaign._id);

        console.log(`Inserting ${queueItems.length} items into Queue...`);

        // Batch Insert
        const chunk_size = 500;
        for (let i = 0; i < queueItems.length; i += chunk_size) {
            const chunk = queueItems.slice(i, i + chunk_size);
            await QueueItem.insertMany(chunk);
        }

        console.log("Insertion Complete.");
        // Log a sample of scheduled send times for verification
        try {
            console.log('Sample scheduled sendAt times:', queueItems.slice(0, 10).map(q => q.sendAt.toISOString()));
        } catch (e) {
            console.log('Error logging sample sendAt times:', e.message);
        }

        await Campaign.findByIdAndUpdate(newCampaign._id, { totalMessages: queueItems.length, interval: iVal });

        return res.json({
            success: true,
            message: `Campaign started. ${contacts.length} messages added to background queue.`,
            campaignId: newCampaign._id,
            contactsCount: contacts.length
        });
    } catch (error) {
        console.error("Bulk SMS Error:", error);
        res.status(500).json({ success: false, message: "Error starting campaign: " + error.message });
    }
});

// Get Active/All Campaigns
router.get("/campaigns", async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ date: -1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Campaign Status (Pause/Resume/Cancel)


// Get SMS Logs
router.get("/logs", async (req, res) => {
    try {
        const query = {};
        if (req.query.clicksOnly === "true") {
            query.clicks = { $gt: 0 };
        }
        const logs = await SmsLog.find(query).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Quick Test SMS
router.post("/test", async (req, res) => {
    const { phone, message } = req.body;

    if (!phone || !message) {
        return res.status(400).json({ success: false, message: "Phone and message are required" });
    }

    const result = await sendSMS(phone, message);

    await SmsLog.create({
        phone,
        message,
        status: result.statusText,
        messageId: result.success && result.response.messages ? result.response.messages[0].id : null,
        response: result.response
    });

    if (result.success) {
        res.json({ success: true, response: result.response });
    } else {
        res.status(500).json({ success: false, response: result.response });
    }
});

export default router;
