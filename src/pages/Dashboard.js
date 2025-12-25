import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../api";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [stats, setStats] = useState({
        contacts: 0,
        sent: 0,
        campaigns: 0,
        deliveryRate: 0,
        growth: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contactsRes, logsRes, campaignsRes] = await Promise.all([
                    axios.get(`${API}/contacts?t=${Date.now()}`),
                    axios.get(`${API}/sms/logs?t=${Date.now()}`),
                    axios.get(`${API}/campaigns?t=${Date.now()}`)
                ]);

                const contacts = contactsRes.data || [];
                const logs = logsRes.data || [];

                // Calculate Delivery Rate
                const totalLogs = logs.length;
                const successStatuses = ["SENT", "DELIVERED", "READ", "ACCEPTED"];
                const sentLogs = logs.filter(l => successStatuses.includes(l.status)).length;
                const deliveryRate = totalLogs > 0 ? ((sentLogs / totalLogs) * 100).toFixed(1) : 0;

                // Calculate Contact Growth (Last 30 days)
                const now = new Date();
                const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
                const newContacts = contacts.filter(c => new Date(c.createdAt) > lastMonth).length;
                const oldContacts = contacts.length - newContacts;
                const growth = oldContacts > 0 ? ((newContacts / oldContacts) * 100).toFixed(1) : newContacts > 0 ? 100 : 0;

                setStats({
                    contacts: contacts.length,
                    sent: sentLogs,
                    campaigns: campaignsRes.data.length || 0,
                    campaignsList: campaignsRes.data || [],
                    deliveryRate,
                    growth
                });
            } catch (err) {
                console.error("Error fetching stats", err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="page-container">
            <h1>Dashboard</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "3rem" }}>Welcome back to your SMS Marketing System.</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
                {/* Stat Card 1 */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--text-secondary)" }}>Total Contacts</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "bold", background: "var(--gradient-main)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {stats.contacts}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--success)", marginTop: "10px" }}>
                        {stats.growth > 0 ? "+" : ""}{stats.growth}% from last month
                    </div>
                </div>

                {/* Stat Card 2 */}
                <div className="glass-panel" style={{ padding: "24px" }}>
                    <h3 style={{ margin: "0 0 10px 0", color: "var(--text-secondary)" }}>SMS Sent</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "bold", background: "var(--gradient-main)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {stats.sent}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--success)", marginTop: "10px" }}>
                        {stats.deliveryRate}% Delivery Rate
                    </div>
                </div>

                {/* Quick Action */}
                <div className="glass-panel" style={{ padding: "24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <h3 style={{ margin: "0 0 20px 0" }}>Quick Actions</h3>
                    <Link to="/create-campaign">
                        <button className="btn-primary" style={{ width: "100%" }}>Start New Campaign</button>
                    </Link>
                    {/* <Link to="/upload" style={{ marginTop: "12px", textAlign: "center", color: "var(--accent-secondary)", textDecoration: "none" }}>
                        Upload Contacts
                    </Link> */}
                </div>
            </div>


            {/* Recent Campaigns Section */}
            <div className="glass-panel" style={{ marginTop: "3rem", padding: "24px" }}>
                <h3 style={{ marginBottom: "20px" }}>Recent Campaigns</h3>
                <div className="table-responsive">
                    <table width="100%">
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }}>Campaign Message</th>
                                <th style={{ textAlign: "center" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.campaignsList && stats.campaignsList.length > 0 ? (
                                stats.campaignsList.map((c, i) => (
                                    <tr key={c._id || i}>
                                        <td>{c.message.substring(0, 50)}...</td>
                                        <td style={{ textAlign: "center" }}>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("Are you sure you want to delete this campaign?")) {
                                                        try {
                                                            await axios.delete(`${API}/campaigns/${c._id}`);
                                                            alert("Campaign deleted");
                                                            window.location.reload();
                                                        } catch (err) {
                                                            alert("Error deleting: " + err.message);
                                                        }
                                                    }
                                                }}
                                                style={{
                                                    background: "rgba(239, 68, 68, 0.2)",
                                                    color: "#f87171",
                                                    border: "none",
                                                    padding: "5px 10px",
                                                    cursor: "pointer",
                                                    borderRadius: "4px"
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2" style={{ textAlign: "center", padding: "20px" }}>No campaigns found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
