import mongoose from "mongoose";
import dotenv from "dotenv";
import QueueItem from "./models/QueueItem.js";
import Campaign from "./models/Campaign.js";

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const campaignName = "hy4";
        const campaign = await Campaign.findOne({ name: campaignName });

        if (!campaign) {
            console.log(`Campaign ${campaignName} not found.`);
            return;
        }

        console.log(`Campaign Found: ${campaign.name} (${campaign._id})`);
        console.log(`Status: ${campaign.status}`);
        console.log(`Interval: ${campaign.interval}`);

        const items = await QueueItem.find({ campaignId: campaign._id });
        console.log(`\nTotal Items: ${items.length}`);

        items.forEach((item, idx) => {
            console.log(`Item ${idx}: Status=${item.status}, SendAt=${item.sendAt.toISOString()}, Phone=${item.phone}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debug();
