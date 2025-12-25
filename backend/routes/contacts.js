import express from "express";
import multer from "multer";
import { parse } from "csv-parse";
import fs from "fs";
import * as XLSX from "xlsx";
import { validatePhone } from "../utils/validator.js";
import Contact from "../models/Contact.js";
import CampaignList from "../models/CampaignList.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });


router.post("/upload", upload.single("file"), async (req, res) => {
    console.log("Upload request received");
    console.log("req.file:", req.file);
    console.log("req.body:", req.body);
    const contacts = [];
    let campaignId = null;

    if (!req.file) {
        console.error("No file in request");
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    console.log("Processing file:", req.file.originalname, "Mimetype:", req.file.mimetype, "Path:", req.file.path);

    try {
        // 1. PARSE & VALIDATE FILE FIRST
        // This ensures we don't create an empty campaign if the file is invalid or too large

        const fileBuffer = fs.readFileSync(req.file.path);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Enforce 100 Contact Limit
        console.log(`Checking file size: ${jsonData.length} rows found.`);
        if (jsonData.length > 100) {
            console.warn(`Limit Exceeded: File has ${jsonData.length} contacts. Rejecting.`);
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, message: `Limit Exceeded: File contains ${jsonData.length} contacts. Max allowed is 100.` });
        } else {
            console.log("File size OK. Proceeding.");
        }
        // 2. CREATE CAMPAIGN IF VALID
        /* MOVED TO END OF PIPELINE */
        const processedContacts = [];
        jsonData.forEach(row => {
            const normalizedRow = {};
            // Normalize keys
            Object.keys(row).forEach(key => {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            });

            console.log("Row Keys:", Object.keys(normalizedRow)); // DEBUG LOG

            let phone = normalizedRow.phone || normalizedRow.phones || normalizedRow.number || normalizedRow.numbers || normalizedRow.mobile || normalizedRow.mobiles || normalizedRow.contact || normalizedRow.contacts;

            // Data Cleaning: Scientific Notation & Numeric Handling
            if (phone) {
                if (typeof phone === 'number') {
                    // Convert number to string (e.g. 447123456789 -> "447123456789")
                    phone = String(phone);
                }

                // Remove scientific notation artifacts if present string (very rare if numeric conversion matched)
                // But cleaning all non-numeric characters except + is good practice
                // VALIDATION & FORMATTING (E.164)
                const formattedPhone = validatePhone(phone);

                if (formattedPhone) {
                    // Simplified Name Detection (User Request)
                    // Just look for 'name' or 'names'
                    let name = normalizedRow.name || normalizedRow.names || normalizedRow['full name'] || "Unknown";

                    const contact = {
                        name: name,
                        phone: formattedPhone,
                    };
                    if (campaignId) contact.campaignId = campaignId;
                    processedContacts.push(contact);
                } else {
                    // console.warn("Skipping invalid phone:", phone);
                }
            }
        });

        if (processedContacts.length === 0) {
            console.warn("No contacts found after parsing. Trying raw CSV fallback just in case.");
            return res.status(400).json({ success: false, message: "No valid contacts found in file. Please check format." });
        }

        console.log(`Parsed ${processedContacts.length} contacts`);

        // COMPLIANCE CHECK: REMOVE BLACKLISTED NUMBERS
        // Dynamically import Blacklist
        const Blacklist = (await import("../models/Blacklist.js")).default;
        const blacklistedDocs = await Blacklist.find({ phone: { $in: processedContacts.map(c => c.phone) } });
        const blacklistedPhones = new Set(blacklistedDocs.map(b => b.phone));

        const cleanContacts = processedContacts.filter(c => !blacklistedPhones.has(c.phone));
        const blockedCount = processedContacts.length - cleanContacts.length;

        if (blockedCount > 0) {
            console.log(`Compliance: Blocked ${blockedCount} contacts found in Blacklist.`);
        }

        if (cleanContacts.length === 0) {
            return res.json({
                success: true,
                total: 0,
                message: `All ${processedContacts.length} contacts were blocked by the Blacklist.`
            });
        }

        // 2. CREATE CAMPAIGN LIST IF VALID AND CONTACTS EXIST
        if (req.body.campaignName) {
            // Check if exists
            const existing = await CampaignList.findOne({ name: req.body.campaignName });
            if (existing) {
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); // Cleanup
                return res.status(400).json({ success: false, message: "Campaign name already exists. Please choose a different name." });
            }
            const campaign = await new CampaignList({ name: req.body.campaignName }).save();
            campaignId = campaign._id;

            // Assign new campaignId to all contacts
            cleanContacts.forEach(c => c.campaignId = campaignId);
        }

        await handleContacts(cleanContacts, res, campaignId); // Pass res to handle response
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ error: "Failed to process file" });
    }
});

const handleContacts = async (contacts, res, campaignId) => {
    try {
        // Use BulkWrite for Upsert (Update if exists, Insert if new)
        const operations = contacts.map(contact => ({
            updateOne: {
                filter: { phone: contact.phone },
                update: { $set: contact },
                upsert: true
            }
        }));

        const result = await Contact.bulkWrite(operations);

        console.log("BulkWrite Result:", result);

        const inserted = result.upsertedCount + result.insertedCount;
        const updated = result.modifiedCount;

        res.json({
            success: true,
            total: contacts.length,
            inserted: inserted,
            updated: updated,
            campaignId: campaignId,
            message: `Processed ${contacts.length} contacts. (New/Upserted: ${inserted}, Updated: ${updated})`
        });
    } catch (error) {
        console.error("BulkWrite Error:", error);
        res.status(500).json({ error: "Failed to save contacts" });
    }
};

// Get all campaign lists
router.get("/lists", async (req, res) => {
    try {
        const lists = await CampaignList.find().sort({ date: -1 }).lean();

        const listsWithCounts = await Promise.all(lists.map(async (list) => {
            const count = await Contact.countDocuments({ campaignId: list._id });
            return { ...list, count };
        }));

        res.json(listsWithCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a campaign list and all its contacts
router.delete("/lists/:id", async (req, res) => {
    try {
        const listId = req.params.id;
        // Delete the list
        await CampaignList.findByIdAndDelete(listId);
        // Delete all contacts in that list
        await Contact.deleteMany({ campaignId: listId });

        res.json({ success: true, message: "Campaign list and contacts deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all contacts (optionally filtered by campaignId)
router.get("/", async (req, res) => {
    try {
        const query = {};
        if (req.query.campaignId) {
            query.campaignId = req.params.campaignId || req.query.campaignId;
        }
        const contacts = await Contact.find(query).sort({ name: 1 });
        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a contact
router.delete("/:id", async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Contact deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Bulk delete contacts
router.post("/delete-batch", async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "No IDs provided" });
    }

    try {
        await Contact.deleteMany({ _id: { $in: ids } });
        res.json({ success: true, message: "Contacts deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Deduplicate Contacts (Keep newest)
router.post("/deduplicate", async (req, res) => {
    try {
        console.log("Starting Deduplication...");
        // 1. Find all phone numbers that have duplicates
        const duplicates = await Contact.aggregate([
            {
                $group: {
                    _id: "$phone",
                    count: { $sum: 1 },
                    ids: { $push: "$_id" } // Collect all IDs
                }
            },
            {
                $match: {
                    count: { $gt: 1 } // Only groups with more than 1 contact
                }
            }
        ]);

        console.log(`Found ${duplicates.length} duplicate groups.`);

        let deletedCount = 0;
        const deleteIds = [];

        for (const group of duplicates) {
            // 2. For each group, we want to KEEP the one with the latest createdAt (or _id if strictly chronological)
            // But we have the IDs. Let's fetch them to sort, OR since we pushed IDs, they might be in order? No guarantee.
            // Let's query the docs to be safe and sort them.

            const docs = await Contact.find({ _id: { $in: group.ids } }).sort({ createdAt: -1 }); // Newest first

            // Keep docs[0], delete the rest
            const toKeep = docs[0];
            const toDelete = docs.slice(1);

            toDelete.forEach(doc => {
                deleteIds.push(doc._id);
            });
        }

        if (deleteIds.length > 0) {
            const result = await Contact.deleteMany({ _id: { $in: deleteIds } });
            deletedCount = result.deletedCount;
        }

        console.log(`Deduplication complete. Deleted ${deletedCount} contacts.`);
        res.json({ success: true, message: `Deduplication complete. Removed ${deletedCount} duplicates.`, deleted: deletedCount });

    } catch (error) {
        console.error("Deduplication Error:", error);
        res.status(500).json({ message: error.message });
    }
});

export default router;
