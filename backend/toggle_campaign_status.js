import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "./models/Campaign.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for toggle_campaign_status.js");

        const campaign = await Campaign.findOne().sort({ date: -1 });
        if (!campaign) {
            console.log("No campaigns found");
            return;
        }

        console.log("Latest Campaign:", { id: campaign._id.toString(), name: campaign.name, status: campaign.status, interval: campaign.interval, lastSent: campaign.lastSent });

        // Pause it
        campaign.status = (campaign.status === 'PAUSED') ? 'RUNNING' : 'PAUSED';
        await campaign.save();
        console.log(`Updated campaign ${campaign._id} -> ${campaign.status}`);

        // Show updated doc
        const updated = await Campaign.findById(campaign._id);
        console.log('Updated campaign record:', { id: updated._id.toString(), status: updated.status, lastSent: updated.lastSent });

    } catch (err) {
        console.error('Error in toggle_campaign_status.js', err);
    } finally {
        mongoose.connection.close();
    }
};

run();
