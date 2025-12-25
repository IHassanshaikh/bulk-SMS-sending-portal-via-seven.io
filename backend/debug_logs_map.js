import mongoose from "mongoose";
import dotenv from "dotenv";
import QueueItem from "./models/QueueItem.js";
import SmsLog from "./models/SmsLog.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for debug_logs_map.js");

        const logs = await SmsLog.find().sort({ date: -1 }).limit(20);
        console.log(`Found ${logs.length} recent SmsLog entries:`);
        for (const l of logs) {
            console.log(`\nLog: phone=${l.phone}, status=${l.status}, date=${l.date ? l.date.toISOString() : 'N/A'}, message=${l.message}`);
            const qi = await QueueItem.findOne({ phone: l.phone }).sort({ createdAt: -1 });
            if (qi) {
                console.log(`  Matching QueueItem: campaignId=${qi.campaignId}, status=${qi.status}, sendAt=${qi.sendAt ? qi.sendAt.toISOString() : 'N/A'}`);
            } else {
                console.log('  No matching QueueItem found for this phone');
            }
        }

    } catch (err) {
        console.error("Error in debug_logs_map.js:", err);
    } finally {
        mongoose.connection.close();
    }
};

run();
