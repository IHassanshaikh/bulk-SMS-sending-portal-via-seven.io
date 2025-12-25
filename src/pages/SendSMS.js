
import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";

export default function SendSMS() {
    const [message, setMessage] = useState("");
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    // Configuration State
    const [scheduleTime, setScheduleTime] = useState("");
    const [msgInterval, setMsgInterval] = useState("");
    const [msgLimit, setMsgLimit] = useState("");
    const [campaignName, setCampaignName] = useState("");

    useEffect(() => {
        // Fetch campaigns
        axios.get(`${API}/contacts/lists`)
            .then(res => setCampaigns(res.data))
            .catch(err => console.error("Failed to fetch campaigns", err));
    }, []);

    const handleSend = async () => {
        // Validation
        if (msgInterval && parseFloat(msgInterval) < 1) {
            alert("Interval must be at least 1 minute.");
            return;
        }

        setLoading(true);
        setStatus("Scheduling...");
        try {
            console.log("Sending Payload:", {
                interval: parseFloat(msgInterval) || 0,
            });

            const res = await axios.post(`${API}/sms/bulk`, {
                message,
                campaignId: selectedCampaign || null,
                interval: parseFloat(msgInterval) || 0,
                batchSize: 1,
                msgLimit: parseInt(msgLimit) || 0,
                startTime: scheduleTime || null,
                campaignName: campaignName || null
            });
            setStatus(`Success! Status: ${res.data.message}`);
            setMessage(""); // Clear message after success
            setScheduleTime("");
            setMsgInterval("");
            setMsgLimit("");
            setCampaignName("");
        } catch (error) {
            setStatus(`Failed: ${error.response?.data?.message || "Error sending"}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1 style={{ marginBottom: "30px" }}>Create Campaign</h1>

            <div className="glass-panel" style={{ padding: "clamp(20px, 5vw, 40px)", maxWidth: "800px" }}>

                {/* 1. Recipient Selection */}
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ marginBottom: "15px", color: "var(--accent-primary)", fontSize: "1.1rem" }}>
                        1. Recipients
                        <button
                            onClick={async () => {
                                try {
                                    const res = await axios.get(`${API}/contacts/lists`);
                                    setCampaigns(res.data);
                                    alert("Lists refreshed!");
                                } catch (e) { console.error(e); }
                            }}
                            style={{ marginLeft: "10px", fontSize: "0.8rem", padding: "4px 8px", background: "#494949", border: "none", color: "white", cursor: "pointer", borderRadius: "4px" }}
                        >
                            🔄 Refresh
                        </button>
                    </h3>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Select Contact List</label>
                    <select
                        value={selectedCampaign}
                        onChange={(e) => setSelectedCampaign(e.target.value)}
                        className="glass-input"
                        style={{ width: "100%" }}
                    >
                        <option value="" style={{ color: "black" }}>All Contacts (Default)</option>
                        {campaigns.map(c => (
                            <option key={c._id} value={c._id} style={{ color: "black" }}>
                                {c.name} ({c.count !== undefined ? c.count : "?"} contacts)
                            </option>
                        ))}
                    </select>
                </div>

                {/* Optional: Campaign Name (for tracking) */}
                <div style={{ marginBottom: "30px" }}>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Campaign Name (Optional)</label>
                    <input
                        type="text"
                        placeholder="e.g. Christmas Promo 2025"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                        className="glass-input"
                        style={{ width: "100%" }}
                    />
                </div>

                {/* 2. Message Content */}
                <div style={{ marginBottom: "30px" }}>
                    <h3 style={{ marginBottom: "15px", color: "var(--accent-primary)", fontSize: "1.1rem" }}>2. Message</h3>
                    <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>SMS Content</label>
                    <textarea
                        rows="6"
                        placeholder="Type your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="glass-input"
                        style={{ width: "100%", lineHeight: "1.5" }}
                    />
                    <div style={{ textAlign: "right", fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "5px" }}>
                        {message.length} characters • {Math.ceil(message.length / 160)} SMS segment(s)
                    </div>
                </div>

                {/* 3. Scheduling & Batch settings */}
                <div style={{ marginBottom: "40px" }}>
                    <h3 style={{ marginBottom: "15px", color: "var(--accent-primary)", fontSize: "1.1rem" }}>3. Scheduling & Delay</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
                        <div style={{ display: "none" }}>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Start Time (Optional)</label>
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Interval (Minutes Delay)</label>
                            <input
                                type="number"
                                placeholder="e.g. 5"
                                min="0"
                                value={msgInterval}
                                onChange={(e) => setMsgInterval(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                Delay between each message
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Campaign Limit (Optional)</label>
                            <input
                                type="number"
                                placeholder="Max messages..."
                                min="1"
                                value={msgLimit}
                                onChange={(e) => setMsgLimit(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                Stop after N messages
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "20px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px", paddingBottom: "40px" }}>
                {status && (
                    <span style={{
                        color: status.includes("Success") ? "var(--success)" : "#ef4444",
                        fontWeight: "500"
                    }}>
                        {status}
                    </span>
                )}

                <button
                    className="btn-primary"
                    onClick={handleSend}
                    disabled={loading || !message}
                    style={{
                        padding: "12px 30px",
                        fontSize: "1rem",
                        background: loading ? "var(--text-secondary)" : "var(--accent-primary)"
                    }}
                >
                    {loading ? "Processing..." : (scheduleTime || msgInterval ? "📅 Schedule Campaign" : "🚀 Send Now")}
                </button>
            </div>
        </div >
    );
}
