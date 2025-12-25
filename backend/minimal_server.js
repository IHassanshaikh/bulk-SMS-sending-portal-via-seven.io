import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("Minimal Server Starting...");
console.log("Mongo URI:", process.env.MONGO_URI ? "Found" : "Missing");

const connect = async () => {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Connection Failed:", err);
        process.exit(1);
    }
}

connect();
