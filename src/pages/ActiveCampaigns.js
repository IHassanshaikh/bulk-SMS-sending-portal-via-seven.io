import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function ActiveCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusUpdating, setStatusUpdating] = useState(null); // ID of campaign being updated

    const fetchCampaigns = async (isFirstLoad = false) => {
        if (isFirstLoad) setLoading(true);
        try {
            // Add cache-busting timestamp and headers to prevent stale data
            const res = await axios.get(`${API}/sms/campaigns?_t=${Date.now()}`, {
                skipLoader: !isFirstLoad,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            // Don't overwrite state blindly if we just optimistically set a status
            setCampaigns(prev => {
                const newData = res.data;
                if (statusUpdating) {
                    return newData.map(c => c._id === statusUpdating ? prev.find(p => p._id === statusUpdating) : c);
                }
                return newData;
            });
        } catch (error) {
            console.error("Error fetching campaigns:", error);
        } finally {
            if (isFirstLoad) setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns(true);
        // Reduced to 2 seconds for better balance between responsiveness and server load
        const interval = setInterval(() => fetchCampaigns(false), 2000);
        return () => clearInterval(interval);
    }, [statusUpdating]); // Re-bind on status update to ensure closures are fresh

    const updateStatus = async (id, status) => {
        setStatusUpdating(id);
        // Optimistic Update
        setCampaigns(prev => prev.map(c => c._id === id ? { ...c, status } : c));

        try {
            await axios.post(`${API}/campaigns/${id}/status`, { status });
            // On success, reset locker and immediately fetch fresh data
            setStatusUpdating(null);
            // Force immediate refresh to get latest state from server
            await fetchCampaigns(false);
        } catch (error) {
            console.error("Update Status Error:", error);
            alert("Error updating status: " + (error.response?.data?.message || error.message));
            setStatusUpdating(null);
            fetchCampaigns(); // Rollback to server state
        }
    };

    const deleteCampaign = async (id) => {
        if (!window.confirm("Are you sure you want to delete this campaign and all its pending messages? This cannot be undone.")) return;
        try {
            await axios.delete(`${API}/campaigns/${id}`);
            // Immediately remove from UI for instant feedback
            setCampaigns(prev => prev.filter(c => c._id !== id));
            // Then fetch fresh data from server
            await fetchCampaigns(false);
            alert("Campaign deleted.");
        } catch (error) {
            console.error("Delete Error:", error);
            alert("Error deleting campaign: " + (error.response?.data?.message || error.message));
            // Rollback on error
            fetchCampaigns(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "RUNNING": return "#34d399";
            case "QUEUED": return "#facc15";
            case "PAUSED": return "#fbbf24";
            case "COMPLETED": return "#60a5fa";
            case "CANCELED": return "#f87171";
            default: return "var(--text-secondary)";
        }
    };

    return (
        <div className="page-container">
            <h1>Active Campaigns</h1>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                    Monitor and control your running SMS campaigns.
                </p>
                <button
                    onClick={() => fetchCampaigns(false)}
                    className="btn-secondary"
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                >
                    🔄 Refresh Now
                </button>
            </div>

            <div className="glass-panel">
                {loading ? <p style={{ padding: "20px" }}>Loading...</p> : (
                    <div className="table-responsive">
                        <table width="100%">
                            <thead>
                                <tr>
                                    <th>Campaign Name</th>
                                    <th>Status</th>
                                    <th style={{ width: "30%" }}>Progress</th>
                                    <th>Sent / Failed</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.length === 0 ? (
                                    <tr><td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No campaigns found.</td></tr>
                                ) : campaigns.map(cam => {
                                    const total = cam.totalMessages || 0; // Prevent div by zero
                                    const sent = cam.totalSent || 0;
                                    const failed = cam.failedCount || 0;
                                    const processed = sent + failed;
                                    const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

                                    return (
                                        <tr key={cam._id}>
                                            <td style={{ fontWeight: "bold" }}>
                                                {cam.name}
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                                    {new Date(cam.date).toLocaleString()}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{
                                                    color: getStatusColor(cam.status),
                                                    background: `${getStatusColor(cam.status)}20`,
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    fontSize: "0.8rem",
                                                    fontWeight: "bold"
                                                }}>
                                                    {cam.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                                                        <div style={{
                                                            width: `${percent}%`,
                                                            height: "100%",
                                                            background: getStatusColor(cam.status),
                                                            transition: "width 0.5s ease"
                                                        }}></div>
                                                    </div>
                                                    <span style={{ fontSize: "0.8rem", minWidth: "40px" }}>{percent}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ color: "#34d399" }}>{sent}</span> / <span style={{ color: "#f87171" }}>{failed}</span>
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total: {total}</div>
                                            </td>
                                            <td style={{ textAlign: "right" }}>
                                                <div className="flex-actions">
                                                    {/* ACTION BUTTONS */}
                                                    {cam.status === "RUNNING" || cam.status === "QUEUED" ? (
                                                        <button
                                                            onClick={() => updateStatus(cam._id, "PAUSED")}
                                                            disabled={statusUpdating === cam._id}
                                                            style={{
                                                                background: "#fbbf24",
                                                                color: "#000",
                                                                border: "none",
                                                                padding: "6px 12px",
                                                                borderRadius: "4px",
                                                                cursor: statusUpdating === cam._id ? "not-allowed" : "pointer",
                                                                opacity: statusUpdating === cam._id ? 0.6 : 1
                                                            }}
                                                        >
                                                            {statusUpdating === cam._id ? "..." : "Pause"}
                                                        </button>
                                                    ) : cam.status === "PAUSED" ? (
                                                        <button
                                                            onClick={() => updateStatus(cam._id, "RUNNING")}
                                                            disabled={statusUpdating === cam._id}
                                                            style={{
                                                                background: "#34d399",
                                                                color: "#000",
                                                                border: "none",
                                                                padding: "6px 12px",
                                                                borderRadius: "4px",
                                                                cursor: statusUpdating === cam._id ? "not-allowed" : "pointer",
                                                                opacity: statusUpdating === cam._id ? 0.6 : 1
                                                            }}
                                                        >
                                                            {statusUpdating === cam._id ? "..." : "Resume"}
                                                        </button>
                                                    ) : null}

                                                    {["RUNNING", "QUEUED", "PAUSED"].includes(cam.status) && (
                                                        <button
                                                            onClick={() => { if (window.confirm("Cancel this campaign?")) updateStatus(cam._id, "CANCELED"); }}
                                                            disabled={statusUpdating === cam._id}
                                                            style={{
                                                                background: "#ef4444",
                                                                color: "#fff",
                                                                border: "none",
                                                                padding: "6px 12px",
                                                                borderRadius: "4px",
                                                                cursor: statusUpdating === cam._id ? "not-allowed" : "pointer",
                                                                opacity: statusUpdating === cam._id ? 0.6 : 1
                                                            }}
                                                        >
                                                            {statusUpdating === cam._id ? "..." : "Cancel"}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => deleteCampaign(cam._id)}
                                                        style={{ background: "#b91c1c", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
