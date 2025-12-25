import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import connectDB from "./config/db.js";

dotenv.config();

const resetAdminPassword = async () => {
    try {
        await connectDB();

        const email = "admin@gmail.com";
        const newPassword = "password123";

        let user = await User.findOne({ email });

        if (!user) {
            console.log("Admin user not found. Creating...");
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user = await User.create({
                email,
                password: hashedPassword
            });
            console.log("Admin user created with default password.");
        } else {
            console.log("Admin user found. Resetting password...");
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            console.log("Password reset to 'password123' successfully.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error resetting password:", error);
        process.exit(1);
    }
};

resetAdminPassword();
