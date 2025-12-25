
import mongoose from "mongoose";
import dotenv from "dotenv";
import QueueItem from "./models/QueueItem.js";
import Campaign from "./models/Campaign.js";

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const campaignId = "694d747730a8ea348eb7d555";
        console.log(`Checking Campaign: ${campaignId}`);

        const campaign = await Campaign.findById(campaignId);
        console.log("Campaign:", campaign);

        const items = await QueueItem.find({ campaignId: campaignId });
        console.log(`Total Items: ${items.length}`);

        items.forEach((item, i) => {
            console.log(`Item ${i}: Status='${item.status}', SendAt=${item.sendAt}, Now=${new Date()}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debug();
