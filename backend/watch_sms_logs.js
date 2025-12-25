import mongoose from "mongoose";
import dotenv from "dotenv";
import SmsLog from "./models/SmsLog.js";

dotenv.config();

const EXPECT = parseInt(process.env.WATCH_EXPECT) || 3;
const POLL_MS = 2000;

let seen = new Set();
let found = 0;

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to MongoDB. Watching for ${EXPECT} new SmsLog entries...`);

        // initialize seen set with current latest ids
        const initial = await SmsLog.find().sort({ date: -1 }).limit(50);
        initial.forEach(l => seen.add(l._id.toString()));

        const interval = setInterval(async () => {
            try {
                const logs = await SmsLog.find().sort({ date: -1 }).limit(20);
                // iterate newest to oldest so we print older first
                const newLogs = [];
                for (const l of logs.reverse()) {
                    const id = l._id.toString();
                    if (!seen.has(id)) {
                        newLogs.push(l);
                        seen.add(id);
                    }
                }
                if (newLogs.length) {
                    for (const l of newLogs) {
                        found++;
                        console.log(`\n[NEW ${found}] phone=${l.phone}, status=${l.status}, date=${l.date ? l.date.toISOString() : 'N/A'}, message=${l.message}`);
                        if (found >= EXPECT) break;
                    }
                }

                if (found >= EXPECT) {
                    console.log(`\nObserved ${found} new SmsLog entries. Exiting watcher.`);
                    clearInterval(interval);
                    await mongoose.connection.close();
                    process.exit(0);
                }
            } catch (e) {
                console.error('Watcher error:', e.message);
            }
        }, POLL_MS);

    } catch (err) {
        console.error('Watcher startup error:', err);
        process.exit(1);
    }
};

run();
