
import axios from "axios";

const API_URL = "http://127.0.0.1:5000/api";

async function runSimulation() {
    try {
        console.log("1. Logging in...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@example.com",
            password: "password123"
        });
        const token = loginRes.data.token;
        console.log("LOGIN SUCCESS. Token acquired.");

        console.log("2. Creating Campaign with Interval 2...");
        // Use a unique name
        const campaignName = `SimTest-${Date.now()}`;

        const payload = {
            message: "Test Message for Delay " + new Date().toISOString(),
            campaignId: "", // Empty string means "All Contacts" usually, or need to fetch lists.
            // Based on frontend code: value="" => All Contacts
            // But backend: query = campaignId ? { campaignId } : {}; 
            // So if campaignId is "", query is {}. Correct.
            interval: 5, // 5 minutes
            batchSize: 0,
            msgLimit: 10, // 10 items
            campaignName: campaignName,
            startTime: null // Immediate start
        };

        const res = await axios.post(`${API_URL}/sms/bulk`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("CAMPAIGN CREATED:", res.data);

    } catch (error) {
        console.error("SIMULATION FAILED:", error.response ? error.response.data : error.message);
    }
}

runSimulation();
