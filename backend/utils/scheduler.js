
import QueueItem from "../models/QueueItem.js";
import SmsLog from "../models/SmsLog.js";
import Campaign from "../models/Campaign.js";
import { sendSMS } from "./sendSMS.js";
import mongoose from "mongoose";

let isRunning = false;

export const startWorker = () => {
    console.log("Worker: SMS Scheduler started. Polling every 5s.");
    setInterval(processQueue, 5000);
};

const processQueue = async () => {
    if (isRunning) return;
    isRunning = true;

    try {
        const now = new Date();
        const dbName = mongoose.connection.name;
        // console.log(`Worker polling. DB: ${dbName}`);

        // Check Daily Limit
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));

        const dailySentCount = await SmsLog.countDocuments({
            date: { $gte: startOfDay, $lte: endOfDay },
            status: "SENT"
        });

        if (dailySentCount >= 1000000) {
            console.warn(`Worker: Daily limit reached. Pausing.`);
            isRunning = false;
            return;
        }

        const activeCampaigns = await Campaign.find({
            status: { $in: ["QUEUED", "RUNNING"] }
        }).select("_id");

        const activeCampaignIds = activeCampaigns.map(c => c._id);

        // Find Candidates
        const candidates = await QueueItem.find({
            status: "PENDING",
            $or: [
                { campaignId: { $in: activeCampaignIds } },
                { campaignId: null },
                { campaignId: { $exists: false } }
            ],
            // CRITICAL: Only items that are DUE
            sendAt: { $lte: new Date() }
        }).sort({ sendAt: 1 }).limit(100);

        const runNow = new Date();
        const pendingItems = [];

        for (const candidate of candidates) {
            const sendTime = new Date(candidate.sendAt);
            const isFuture = sendTime.getTime() > runNow.getTime();

            // Double check campaign status
            let isCampaignActive = true;
            if (candidate.campaignId) {
                const cId = candidate.campaignId.toString();
                isCampaignActive = activeCampaignIds.some(id => id.toString() === cId);
            }

            if (isFuture) continue;
            if (!isCampaignActive) {
                console.log(`[Item Skip] ${candidate._id} - Campaign ${candidate.campaignId} is NOT active (Paused/Canceled).`);
                continue;
            }

            // ULTIMATE SAFEGUARD
            if (candidate.campaignId) {
                const freshCampaign = await Campaign.findById(candidate.campaignId).select("status interval lastSent name");
                if (!freshCampaign || (freshCampaign.status !== "RUNNING" && freshCampaign.status !== "QUEUED")) {
                    console.log(`[SKIP-SAFEGUARD] ${candidate._id} blocked. Campaign State is ${freshCampaign ? freshCampaign.status : "NULL"}`);
                    continue;
                }

                // RATE LIMITING LOGIC
                // Logic: If lastSent exists, ensure we wait 'interval' minutes before sending next
                const cInterval = parseFloat(freshCampaign.interval) || 0;
                if (cInterval > 0 && freshCampaign.lastSent) {
                    const since = runNow.getTime() - new Date(freshCampaign.lastSent).getTime();
                    if (since < cInterval * 60 * 1000) {
                        const waitRemaining = Math.round((cInterval * 60 * 1000 - since) / 1000);
                        console.log(`[RATE-WAIT] Campaign "${freshCampaign.name}" must wait ${waitRemaining}s more before next msg.`);
                        continue;
                    }
                }
            }

            // ATOMIC CLAIM
            const item = await QueueItem.findOneAndUpdate(
                { _id: candidate._id, status: "PENDING", sendAt: { $lte: runNow } },
                { $set: { status: "PROCESSING" } },
                { new: true }
            );

            if (item) {
                pendingItems.push(item);
            }
        }

        if (pendingItems.length === 0) {
            if (activeCampaignIds.length > 0) {
                const pendingCount = await QueueItem.countDocuments({
                    status: "PENDING",
                    campaignId: { $in: activeCampaignIds }
                });
                const futureCount = await QueueItem.countDocuments({
                    status: "PENDING",
                    campaignId: { $in: activeCampaignIds },
                    sendAt: { $gt: new Date() }
                });
                const pausedCount = await QueueItem.countDocuments({
                    status: "PENDING",
                    campaignId: { $nin: activeCampaignIds }
                });
                console.log(`Worker: ${activeCampaignIds.length} Active Campaigns. Items - Pending (Active): ${pendingCount}, Future: ${futureCount}, Paused/Inactive: ${pausedCount}. Waiting for time...`);
            }
            isRunning = false;
            return;
        }

        console.log(`Worker: Processing ${pendingItems.length} items...`);

        for (const item of pendingItems) {
            try {
                // Send SMS
                const result = await sendSMS(item.phone, item.message);
                const success = result.success;

                item.status = success ? "SENT" : "FAILED";
                await item.save();

                await SmsLog.create({
                    phone: item.phone,
                    message: item.message,
                    status: result.statusText,
                    messageId: success && result.response.messages ? result.response.messages[0].id : null,
                    response: result.response,
                });

                // UPDATE CAMPAIGN STATS (Always update lastSent on attempt, even failure, to maintain rate limit)
                if (item.campaignId) {
                    const updateData = {
                        $set: {
                            lastSent: new Date(),
                            status: "RUNNING"
                        }
                    };

                    if (success) {
                        updateData.$inc = { totalSent: 1 };
                    } else {
                        updateData.$inc = { failedCount: 1 };
                    }

                    await Campaign.findByIdAndUpdate(item.campaignId, updateData);

                    // Check Completion
                    const remaining = await QueueItem.countDocuments({
                        campaignId: item.campaignId,
                        status: "PENDING"
                    });

                    if (remaining === 0) {
                        await Campaign.findByIdAndUpdate(item.campaignId, {
                            status: "COMPLETED"
                        });
                        console.log(`Campaign ${item.campaignId} marked as COMPLETED.`);
                    }
                }

            } catch (err) {
                console.error(`Worker Error item ${item._id}:`, err);
                item.status = "FAILED";
                await item.save();
                if (item.campaignId) {
                    await Campaign.findByIdAndUpdate(item.campaignId, { $inc: { failedCount: 1 } });
                }
            }
        }

    } catch (error) {
        console.error("Worker: Error in processQueue:", error);
    } finally {
        isRunning = false;
    }
};
