import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const router = express.Router();

// Register (One-time use, or for multiple admins)
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Hashing done explicitly here for clarity (could also use pre-save hook)
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            email,
            password: hashedPassword
        });

        res.status(201).json({ success: true, message: "User created" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET || "default_secret_please_change",
            { expiresIn: "1d" }
        );

        res.json({ success: true, token, email: user.email });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Change Password
router.put("/change-password", async (req, res) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_please_change");
        const { oldPassword, newPassword } = req.body;

        const user = await User.findById(decoded.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid old password" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Forgot Password
router.post("/forgot-password", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate Token
        // Using built-in crypto lib logic manually for simplicity without extra model methods if preferred, 
        // or just random string
        const crypto = await import("crypto");
        const resetToken = crypto.default.randomBytes(20).toString("hex");

        // Hash and set to resetPasswordToken
        user.resetPasswordToken = crypto.default.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 Minutes

        await user.save();

        // Create Reset URL
        // Assuming Frontend is on same domain/port for development or separate
        // Frontend URL: usually localhost:3000 or similar. 
        // We'll assume the user visits the Frontend URL.
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        const message = `
            <h1>Password Reset Request</h1>
            <p>You have requested a password reset</p>
            <p>Please go to this link to reset your password:</p>
            <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
            <p>This link expires in 10 minutes.</p>
        `;

        try {
            const sendEmail = (await import("../utils/email.js")).default;
            await sendEmail({
                email: user.email,
                subject: "Password Reset Token",
                message
            });

            res.status(200).json({ success: true, message: "Email sent" });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "Email could not be sent" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reset Password
router.put("/reset-password/:resetToken", async (req, res) => {
    try {
        const crypto = await import("crypto");
        const resetPasswordToken = crypto.default.createHash("sha256").update(req.params.resetToken).digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Set new password
        user.password = await bcrypt.hash(req.body.password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, message: "Password updated success" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
