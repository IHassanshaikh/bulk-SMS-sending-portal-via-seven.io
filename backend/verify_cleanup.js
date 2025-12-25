import mongoose from "mongoose";
import dotenv from "dotenv";
import Campaign from "./models/Campaign.js";
import QueueItem from "./models/QueueItem.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for verify_cleanup.js");

        const campCount = await Campaign.countDocuments();
        const qiCount = await QueueItem.countDocuments();
        console.log(`Campaigns in DB: ${campCount}`);
        console.log(`QueueItems in DB: ${qiCount}`);

        if (campCount > 0) {
            const camps = await Campaign.find().limit(5);
            console.log('Sample campaigns:', camps.map(c => ({ id: c._id.toString(), name: c.name, status: c.status })));
        }
        if (qiCount > 0) {
            const qis = await QueueItem.find().limit(5);
            console.log('Sample QueueItems:', qis.map(q => ({ id: q._id.toString(), phone: q.phone, status: q.status, sendAt: q.sendAt })));
        }

    } catch (err) {
        console.error('Error in verify_cleanup.js', err);
    } finally {
        mongoose.connection.close();
    }
};

run();
