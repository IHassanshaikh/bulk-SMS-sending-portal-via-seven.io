import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "./models/Campaign.js";
import QueueItem from "./models/QueueItem.js";
import SmsLog from "./models/SmsLog.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for debug_recent_campaign.js");

        const campaign = await Campaign.findOne().sort({ date: -1 });
        if (!campaign) {
            console.log("No campaigns found");
            return;
        }

        console.log("Latest Campaign:");
        console.log({ id: campaign._id.toString(), name: campaign.name, interval: campaign.interval, startTime: campaign.startTime, status: campaign.status, totalMessages: campaign.totalMessages });

        const items = await QueueItem.find({ campaignId: campaign._id }).sort({ sendAt: 1 });
        console.log(`Found ${items.length} QueueItems for campaign.`);
        items.forEach((it, idx) => {
            console.log(`${idx + 1}. phone=${it.phone}, status=${it.status}, sendAt=${it.sendAt ? it.sendAt.toISOString() : 'N/A'}`);
        });

        // Print recent SmsLogs for these phones and message
        const phones = items.map(i => i.phone);
        if (phones.length > 0) {
            const logs = await SmsLog.find({ phone: { $in: phones } }).sort({ date: 1 }).limit(50);
            console.log(`Found ${logs.length} SmsLog entries for these phones:`);
            logs.forEach((l, i) => {
                console.log(`${i + 1}. phone=${l.phone}, status=${l.status}, date=${l.date ? l.date.toISOString() : 'N/A'}, message=${l.message}`);
            });
        }

    } catch (err) {
        console.error("Error in debug_recent_campaign.js:", err);
    } finally {
        mongoose.connection.close();
    }
};

run();
