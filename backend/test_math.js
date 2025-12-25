
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API = "http://localhost:5000/api/sms";

// Login to get token first
const login = async () => {
    try {
        const res = await axios.post("http://localhost:5000/api/auth/login", {
            email: "admin@example.com",
            password: "password123" // Assuming generic creds, if failed I'll create a user
        });
        return res.data.token;
    } catch (e) {
        console.log("Login failed or user not found. Creating admin...");
        // Fallback: Create admin if not exists (implementation dependent, better to assume user is logged in or disable auth for test)
        // Since I can't easily interact with auth flow without known creds, I might need to inspect code.
        // But let's try assuming the server is running without auth or I can use the same auth middleware?
        // Wait, app.use("/api/sms", authMiddleware, smsRoutes);
        // I need a valid token.
        return null;
    }
};

// BETTER EXECUTION: direct function call if I can import it? No, it's module.
// Let's rely on the backend logs I added.

// Instead of external request which requires auth, let's write an internal test script that imports the logic?
// No, imports might be messy with DB connections.

// Let's try to simulate the calculation logic in a standalone script to verify the MATH is right.
const testMath = () => {
    console.log("Testing Math Logic:");
    const contacts = [1, 2, 3];
    const interval = "2";
    const batchSize = "";

    const iVal = parseFloat(interval) || 0;
    const bSize = parseInt(batchSize) || 0;

    contacts.forEach((_, index) => {
        let delayInMs = 0;
        if (bSize > 0) {
            const batchIndex = Math.floor(index / bSize);
            delayInMs = batchIndex * iVal * 60 * 1000;
        } else {
            delayInMs = index * iVal * 60 * 1000;
        }
        console.log(`Item ${index}: Delay ${delayInMs}ms (${delayInMs / 1000 / 60} mins)`);
    });
};

testMath();
