import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function Logs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showClicksOnly, setShowClicksOnly] = useState(false);

    const handleClearLogs = async () => {
        if (window.confirm("Are you sure you want to DELETE ALL logs? This cannot be undone.")) {
            try {
                await axios.delete(`${API}/sms/logs`);
                setLogs([]); // Clear local state
                alert("All logs cleared successfully.");
            } catch (err) {
                console.error(err);
                alert("Failed to clear logs: " + (err.response?.data?.message || err.message));
            }
        }
    };

    // Note: The original user request didn't specify a get logs route in backend, 
    // but the frontend code had it. I'll make sure to handle if it fails or implement it if I haven't.
    // Wait, I didn't see a `router.get('/logs')` in the provided backend code snippet in step 0, 
    // but I should have added it. Let's assume I missed it or it wasn't there. 
    // I will check the backend code in the next step to ensure it exists.
    // For now, I will implement the frontend to call it.

    useEffect(() => {
        setLoading(true);
        axios.get(`${API}/sms/logs?t=${Date.now()}${showClicksOnly ? "&clicksOnly=true" : ""}`)
            .then(res => {
                setLogs(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
            });
    }, [showClicksOnly]);

    return (
        <div className="page-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <h1>SMS Logs</h1>
                    <label style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: "8px" }}>
                        <input
                            type="checkbox"
                            checked={showClicksOnly}
                            onChange={(e) => setShowClicksOnly(e.target.checked)}
                            style={{ width: "18px", height: "18px" }}
                        />
                        <span>Show Clicked Only (Filter)</span>
                    </label>
                </div>
                <button
                    onClick={handleClearLogs}
                    style={{
                        background: "rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                        border: "1px solid #f87171",
                        padding: "8px 16px",
                        cursor: "pointer",
                        borderRadius: "6px",
                        fontWeight: "bold"
                    }}
                >
                    Clear All Logs
                </button>
            </div>

            <div className="glass-panel">
                <div className="table-responsive">
                    <table width="100%">
                        <thead>
                            <tr>
                                <th>Phone</th>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Opens <small style={{ fontSize: "0.7em", fontWeight: "normal" }}>(Clicks)</small></th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>Loading logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No logs available.</td></tr>
                            ) : (
                                logs.map((l, i) => (
                                    <tr key={i}>
                                        <td>{l.phone}</td>
                                        <td>{l.message}</td>
                                        <td>
                                            <span style={{
                                                background: l.status === "READ" ? "rgba(59, 130, 246, 0.2)" : (l.status === "SENT" || l.status === "DELIVERED") ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                                color: l.status === "READ" ? "#3b82f6" : (l.status === "SENT" || l.status === "DELIVERED") ? "#34d399" : "#f87171",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                fontSize: "0.8rem",
                                                fontWeight: l.status === "READ" ? "bold" : "normal"
                                            }}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td>
                                            {l.clicks > 0 ? (
                                                <span style={{ color: "#34d399", fontWeight: "bold" }}>{l.clicks}</span>
                                            ) : (
                                                <span style={{ opacity: 0.5 }}>0</span>
                                            )}
                                        </td>
                                        <td>{new Date(l.date).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
