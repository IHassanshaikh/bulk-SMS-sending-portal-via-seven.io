import React, { useState } from "react";
import axios from "axios";
import { API } from "../api";

const TestSMS = () => {
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");
        try {
            const response = await axios.post(`${API}/sms/test`, {
                phone,
                message
            });
            setStatus({ type: "success", text: "SMS Sent Successfully! ID: " + response.data.response?.messages?.[0]?.id });
        } catch (error) {
            setStatus({ type: "error", text: "Failed to send: " + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>Test SMS Delivery</h1>

            <div className="glass-panel" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto" }}>
                <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", textAlign: "center" }}>
                    Send a quick single message to test connectivity.
                </p>

                <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Phone Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 447123456789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            className="glass-input"
                        />
                    </div>

                    <div style={{ textAlign: "left" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Message</label>
                        <textarea
                            placeholder="Type your test message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            className="glass-input"
                            style={{ minHeight: "120px", resize: "vertical" }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={{ padding: "12px", marginTop: "10px", opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? "Sending..." : "Send Test SMS"}
                    </button>
                </form>

                {status && (
                    <div style={{
                        marginTop: "25px",
                        padding: "15px",
                        borderRadius: "8px",
                        background: status.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: status.type === "success" ? "#34d399" : "#f87171",
                        border: status.type === "success" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)"
                    }}>
                        <strong>{status.type === "success" ? "Success" : "Error"}:</strong> {status.text}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TestSMS;
