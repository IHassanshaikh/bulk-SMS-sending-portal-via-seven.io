import mongoose from "mongoose";
import dotenv from "dotenv";
import QueueItem from "./models/QueueItem.js";
import Campaign from "./models/Campaign.js";

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Get Active Campaigns
        const activeCampaigns = await Campaign.find({
            status: { $in: ["QUEUED", "RUNNING"] }
        });
        console.log(`\nActive Campaigns (${activeCampaigns.length}):`);
        const activeIds = activeCampaigns.map(c => c._id);
        activeCampaigns.forEach(c => {
            console.log(`- ID: ${c._id}, Name: ${c.name}, Status: ${c.status}, Created: ${c.date}`);
        });

        // 2. Count Items for these campaigns
        const totalPending = await QueueItem.countDocuments({ status: "PENDING" });
        console.log(`\nTotal PENDING items in DB: ${totalPending}`);

        const matchingPending = await QueueItem.countDocuments({
            status: "PENDING",
            campaignId: { $in: activeIds }
        });
        console.log(`PENDING items matching Active Campaigns: ${matchingPending}`);

        // 3. Inspect a few items
        const items = await QueueItem.find({ status: "PENDING" }).limit(5);
        console.log("\nSample PENDING Items:");
        items.forEach(i => {
            console.log(`- ID: ${i._id}, CampID: ${i.campaignId}, SendAt: ${i.sendAt}, Now: ${new Date()}`);
            console.log(`  Match Active? ${activeIds.some(id => id.toString() === i.campaignId?.toString())}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debug();
