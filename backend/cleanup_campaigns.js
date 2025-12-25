import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "./models/Campaign.js";
import QueueItem from "./models/QueueItem.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for cleanup_campaigns.js");

        const campaigns = await Campaign.find().select('_id name status');
        console.log(`Found ${campaigns.length} campaigns.`);
        if (campaigns.length === 0) {
            console.log('No campaigns to pause or delete.');
            return;
        }

        // Pause all campaigns first
        const ids = campaigns.map(c => c._id);
        const pauseResult = await Campaign.updateMany({ _id: { $in: ids } }, { $set: { status: 'PAUSED' } });
        console.log(`Paused ${pauseResult.matchedCount || pauseResult.nModified || pauseResult.modifiedCount || 0} campaigns.`);

        // Delete QueueItems for these campaigns
        const deleteQi = await QueueItem.deleteMany({ campaignId: { $in: ids } });
        console.log(`Deleted ${deleteQi.deletedCount || deleteQi} queued items linked to campaigns.`);

        // Finally delete campaigns
        const delCamp = await Campaign.deleteMany({ _id: { $in: ids } });
        console.log(`Deleted ${delCamp.deletedCount || delCamp} campaigns.`);

    } catch (err) {
        console.error('Error in cleanup_campaigns.js', err);
    } finally {
        mongoose.connection.close();
    }
};

run();
