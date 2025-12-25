import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();

const debugUsers = async () => {
    try {
        await connectDB();

        console.log("--- DEBUGGING USERS ---");
        const users = await User.find({});

        if (users.length === 0) {
            console.log("No users found in database.");
        } else {
            users.forEach(u => {
                console.log(`ID: ${u._id}, Email: '${u.email}', PasswordHash: ${u.password.substring(0, 10)}...`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

debugUsers();
