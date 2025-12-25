import mongoose from "mongoose";

const BlacklistSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    reason: {
        type: String,
        default: "STOP keyword",
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("Blacklist", BlacklistSchema);
