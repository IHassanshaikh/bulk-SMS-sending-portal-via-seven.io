import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();

const fixUsers = async () => {
    try {
        await connectDB();

        console.log("Cleaning up users...");
        // Cleanup all existing users to ensure fresh start with unique index
        await User.deleteMany({});
        console.log("All users deleted.");

        console.log("Creating admin@gmail.com...");
        const hashedPassword = await bcrypt.hash("password123", 10);

        const user = await User.create({
            email: "admin@gmail.com",
            password: hashedPassword
        });

        console.log("SUCCESS: Created user:", user.email);
        process.exit(0);
    } catch (error) {
        console.error("Error fixing users:", error);
        process.exit(1);
    }
};

fixUsers();
