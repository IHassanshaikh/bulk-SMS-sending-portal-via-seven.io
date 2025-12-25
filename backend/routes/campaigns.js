import express from "express";
import Campaign from "../models/Campaign.js";

const router = express.Router();
import QueueItem from "../models/QueueItem.js";

// Get all campaigns
router.get("/", async (req, res) => {
    try {
        const campaigns = await Campaign.find().sort({ date: -1 });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Create a new campaign (Optional, if needed separate from bulk SMS)
router.post("/", async (req, res) => {
    const { message } = req.body;
    try {
        const newCampaign = new Campaign({ message, totalSent: 0 });
        await newCampaign.save();
        res.status(201).json(newCampaign);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete a campaign
router.delete("/:id", async (req, res) => {
    try {
        const campaign = await Campaign.findByIdAndDelete(req.params.id);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Cascade delete queued messages
        const queueResult = await QueueItem.deleteMany({ campaignId: req.params.id });
        console.log(`Deleted campaign ${req.params.id} and ${queueResult.deletedCount} queue items.`);

        res.json({ message: `Campaign and ${queueResult.deletedCount} queued messages deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update Campaign Status (Pause/Resume/Cancel)
router.post("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        console.log(`[Campaign Status] Request to set ${req.params.id} -> ${status}`);

        if (!["RUNNING", "PAUSED", "CANCELED"].includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const updateObject = { status: status };

        // 🔥 CRITICAL FIX: Reset lastSent on Resume to allow immediate processing
        if (status === "RUNNING") {
            updateObject.lastSent = null;
        }

        const campaign = await Campaign.findByIdAndUpdate(
            req.params.id,
            updateObject,
            { new: true }
        );

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        res.json({ success: true, campaign });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
