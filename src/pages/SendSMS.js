
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
    const [batchSize, setBatchSize] = useState("");
    const [batchInterval, setBatchInterval] = useState("");
    const [endTime, setEndTime] = useState("");
    const [balance, setBalance] = useState(null);
    const [previewTimes, setPreviewTimes] = useState([]);

    // Update Schedule Preview
    useEffect(() => {
        const count = 10; // Preview first 10
        const start = scheduleTime ? new Date(scheduleTime) : new Date();
        const bSize = parseInt(batchSize) || 0;
        const bInt = parseFloat(batchInterval) || 0;
        const iVal = parseFloat(msgInterval) || 0;
        const msgGapMs = iVal > 0 ? (iVal * 60 * 1000) : 1000; // 1m if set, else 1s

        const preview = [];
        for (let i = 0; i < count; i++) {
            const batchIndex = bSize > 0 ? Math.floor(i / bSize) : 0;
            const totalBatchDelayMs = batchIndex * bInt * 60 * 1000;
            const totalMsgDelayMs = i * msgGapMs;
            const sendAt = new Date(start.getTime() + totalMsgDelayMs + totalBatchDelayMs);
            preview.push(sendAt);
        }
        setPreviewTimes(preview);
    }, [scheduleTime, batchSize, batchInterval, msgInterval]);

    useEffect(() => {
        // Fetch campaigns
        axios.get(`${API}/contacts/lists`)
            .then(res => setCampaigns(res.data))
            .catch(err => console.error("Failed to fetch campaigns", err));

        // Fetch Balance
        axios.get(`${API}/sms/balance`)
            .then(res => setBalance(res.data.balance))
            .catch(err => console.error("Failed to fetch balance", err));
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
                batchSize: parseInt(batchSize) || 0,
                batchInterval: parseFloat(batchInterval) || 0,
                endTime: endTime || null,
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
            setBatchSize("");
            setBatchInterval("");
            setEndTime("");
        } catch (error) {
            setStatus(`Failed: ${error.response?.data?.message || "Error sending"}`);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "clamp(1rem, 4vw, 30px)", flexWrap: "wrap", gap: "10px" }}>
                <h1 style={{ margin: 0 }}>Create and run campaign</h1>
                {balance !== null && (
                    <div className="glass-panel" style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--accent-primary)" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Balance: </span>
                        <span style={{ fontWeight: "600", color: "var(--accent-primary)" }}>
                            €{typeof balance === 'object' ? balance.amount : balance}
                        </span>
                    </div>
                )}
            </div>

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
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Batch Size (Optional)</label>
                            <input
                                type="number"
                                placeholder="e.g. 10"
                                value={batchSize}
                                onChange={(e) => setBatchSize(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                Sends X messages together.
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Batch Delay (Minutes)</label>
                            <input
                                type="number"
                                placeholder="e.g. 2"
                                value={batchInterval}
                                onChange={(e) => setBatchInterval(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                Gap <b>between batches</b>.
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Per-Msg Delay (Mins)</label>
                            <input
                                type="number"
                                placeholder="e.g. 1"
                                min="0"
                                value={msgInterval}
                                onChange={(e) => setMsgInterval(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                                Gap <b>between individuals</b>.
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>End Schedule (Optional)</label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Start Time</label>
                            <input
                                type="datetime-local"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Total Limit</label>
                            <input
                                type="number"
                                placeholder="Max messages..."
                                min="1"
                                value={msgLimit}
                                onChange={(e) => setMsgLimit(e.target.value)}
                                className="glass-input"
                                style={{ width: "100%" }}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: "15px", padding: "10px", background: "rgba(99, 102, 241, 0.05)", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                            💡 <b>Example:</b> To send <b>1 message every 2 minutes</b>, set <b>Per-Msg Delay</b> to 2.
                            <br />
                            To send <b>10 messages every 5 minutes</b>, set <b>Batch Size</b> to 10 and <b>Batch Delay</b> to 5.
                        </p>
                    </div>

                    {/* Schedule Preview Section */}
                    {(msgInterval || batchSize || scheduleTime) && (
                        <div style={{ marginTop: "30px", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
                            <h4 style={{ marginBottom: "15px", color: "var(--accent-primary)", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                📅 Live Schedule Preview (First 10 messages)
                            </h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                                {previewTimes.map((time, idx) => (
                                    <div key={idx} style={{
                                        padding: "8px 12px",
                                        background: "rgba(255,255,255,0.05)",
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                        borderLeft: (batchSize > 0 && idx % parseInt(batchSize) === 0) ? "3px solid var(--accent-primary)" : "none"
                                    }}>
                                        <span style={{ color: "var(--text-secondary)", marginRight: "8px" }}>#{idx + 1}</span>
                                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        {batchSize > 0 && idx % parseInt(batchSize) === 0 && (
                                            <span style={{ marginLeft: "8px", fontSize: "0.7rem", color: "var(--accent-primary)", fontWeight: "600" }}>BATCH</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                    {loading ? "Processing..." : (scheduleTime || msgInterval || batchSize ? "📅 Schedule Campaign" : "🚀 Send Now")}
                </button>
            </div>
        </div>
    );
}
