import express from "express";
import SmsLog from "../models/SmsLog.js";

const router = express.Router();

// Public Webhook for Delivery Reports & Tracking
router.post("/", async (req, res) => {
    try {
        console.log("Webhook Received Payload:", JSON.stringify(req.body, null, 2));

        // Seven.io sends 'event_type', fallback to 'webhook_event' just in case
        const eventType = req.body.event_type || req.body.webhook_event;
        const data = req.body.data;

        // 1. Handle Delivery Reports (DLR)
        if (eventType === 'dlr' && data && data.msg_id) {
            console.log(`Processing DLR for msg_id: ${data.msg_id}, status: ${data.status}`);
            await SmsLog.findOneAndUpdate(
                { messageId: data.msg_id },
                { status: data.status.toUpperCase() }
            );
            return res.status(200).send("DLR Processed");
        }

        // 2. Handle Tracking (Clicks/Opens)
        if (eventType === 'tracking' && data && data.sms_id) {
            console.log(`Processing Tracking for sms_id: ${data.sms_id}, clicks: ${data.total_clicks}`);
            const clicks = data.total_clicks || 1;
            await SmsLog.findOneAndUpdate(
                { messageId: data.sms_id },
                {
                    $set: {
                        clicks: clicks,
                        status: "READ"
                    }
                }
            );
            return res.status(200).send("Tracking Processed");
        }

        // 3. Fallback / Legacy (Direct ID/Status or unknown format)
        // Some legacy internal webhooks might use flat id/status
        const { id, status } = req.body;
        if (id && status) {
            console.log(`Processing Legacy DLR for id: ${id}, status: ${status}`);
            await SmsLog.findOneAndUpdate(
                { messageId: id },
                { status: status.toUpperCase() }
            );
            return res.status(200).send("Legacy DLR Processed");
        }

        // 4. Handle Inbound SMS (STOP Keyword)
        if (eventType === 'sms_mo' && data && data.sender) {
            console.log("Inbound SMS:", data.text);
            const text = (data.text || "").toUpperCase().trim();
            const stopKeywords = ["STOP", "UNSUBSCRIBE", "REMOVE", "CANCEL"];

            if (stopKeywords.some(keyword => text.includes(keyword))) {
                console.log(`Blacklisting ${data.sender} due to STOP keyword`);
                const Blacklist = (await import("../models/Blacklist.js")).default;
                try {
                    await Blacklist.create({ phone: data.sender, reason: `User replied: ${data.text}` });
                } catch (err) {
                    if (err.code !== 11000) console.error("Blacklist Error:", err);
                }
            }
            return res.status(200).send("Inbound SMS Processed");
        }

        console.warn(`Unknown webhook format or event type: ${eventType}`);
        res.status(200).send("Ignored");

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Error");
    }
});

export default router;
