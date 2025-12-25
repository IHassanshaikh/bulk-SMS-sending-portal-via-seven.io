
import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "./models/Campaign.js";
import QueueItem from "./models/QueueItem.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const campaigns = await Campaign.find({});
        console.log(`\n--- CAMPAIGNS (${campaigns.length}) ---`);
        campaigns.forEach(c => {
            console.log(`ID: ${c._id} | Name: ${c.name} | Status: ${c.status} | Sent: ${c.totalSent}/${c.totalMessages} | Failed: ${c.failedCount}`);
        });

        const items = await QueueItem.find({});
        console.log(`\n--- QUEUE ITEMS (${items.length}) ---`);
        const counts = {};
        items.forEach(i => {
            const key = `${i.campaignId} [${i.status}]`;
            counts[key] = (counts[key] || 0) + 1;
        });
        console.table(counts);

        // Show future items details
        const future = await QueueItem.find({ sendAt: { $gt: new Date() } });
        console.log(`\n--- FUTURE ITEMS (${future.length}) ---`);
        future.forEach(f => {
            console.log(`ID: ${f._id} | Status: ${f.status} | SendAt: ${f.sendAt.toISOString()} | Camp: ${f.campaignId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
