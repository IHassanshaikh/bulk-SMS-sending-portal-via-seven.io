import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";

export default function Sidebar({ isOpen, onClose }) {
    const location = useLocation();
    const [balance, setBalance] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        axios.get(`${API}/sms/balance`)
            .then(res => setBalance(res.data.balance.amount))
            .catch(err => console.error("Balance Fetch Error:", err));
    }, []);

    const linkStyle = (path) => ({
        display: "block",
        padding: "12px 16px",
        margin: "8px 0",
        borderRadius: "8px",
        color: isActive(path) ? "var(--accent-primary)" : "var(--text-secondary)",
        background: isActive(path) ? "var(--glass-highlight)" : "transparent",
        textDecoration: "none",
        fontWeight: isActive(path) ? "600" : "400",
        borderLeft: isActive(path) ? "3px solid var(--accent-primary)" : "3px solid transparent",
        transition: "all 0.2s ease"
    });

    // Mobile Sidebar Styles (Drawer)
    const mobileStyle = {
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease-in-out",
        zIndex: 50,
        height: "100vh",
        top: 0,
        left: 0,
        borderRadius: 0,
        borderRight: "1px solid var(--glass-border)",
        width: "280px",
        background: "var(--glass-bg)"
    };

    // Desktop Sidebar Styles
    const desktopStyle = {
        width: "240px",
        minHeight: "calc(100vh - 40px)",
        position: "fixed",
        top: "20px",
        left: "20px",
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen && isMobile ? 'active' : ''}`}
                onClick={onClose}
            ></div>

            <div
                className="glass-panel"
                style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    position: "fixed",
                    ...(isMobile ? mobileStyle : desktopStyle)
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flexDirection: "column" }}>
                        <img src="/techtide logo.png" alt="Logo" style={{ height: "60px", width: "auto" }} />
                        <h2 style={{
                            margin: 0,
                            color: "var(--text-primary)",
                            fontSize: "1.25rem",
                            fontWeight: "700",
                            letterSpacing: "-0.025em"
                        }}>SMS Panel</h2>
                    </div>

                    {isMobile && (
                        <button
                            onClick={onClose}
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "1.5rem",
                                cursor: "pointer",
                                color: "var(--text-secondary)"
                            }}
                        >
                            &times;
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, overflowY: "auto" }}>
                    <Link to="/" style={linkStyle("/")} onClick={() => isMobile && onClose()}>Dashboard</Link>
                    <Link to="/contacts" style={linkStyle("/contacts")} onClick={() => isMobile && onClose()}>Contacts</Link>
                    <Link to="/campaigns" style={linkStyle("/campaigns")} onClick={() => isMobile && onClose()}>List</Link>
                    {/* <Link to="/upload" style={linkStyle("/upload")} onClick={() => isMobile && onClose()}>Upload CSV</Link> */}
                    <Link to="/sms" style={linkStyle("/sms")} onClick={() => isMobile && onClose()}>Create and run campaign</Link>
                    <Link to="/active-campaigns" style={linkStyle("/active-campaigns")} onClick={() => isMobile && onClose()}>Active Campaigns</Link>
                    <Link to="/test-sms" style={linkStyle("/test-sms")} onClick={() => isMobile && onClose()}>Test SMS</Link>
                    <Link to="/logs" style={linkStyle("/logs")} onClick={() => isMobile && onClose()}>Logs</Link>
                    <div style={{ height: "1px", background: "rgba(0,0,0,0.1)", margin: "10px 0" }}></div>
                    <Link to="/settings" style={linkStyle("/settings")} onClick={() => isMobile && onClose()}>Settings</Link>
                </nav>

                <div style={{ padding: "15px", background: "var(--glass-highlight)", borderRadius: "8px", marginBottom: "10px" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "5px" }}>Credits</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "600", color: "var(--accent-primary)" }}>
                        {balance !== null ? `€${balance}` : "Loading..."}
                    </div>
                </div>

                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                    }}
                    style={{
                        width: "100%",
                        padding: "10px",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        transition: "all 0.2s"
                    }}
                >
                    Sign Out
                </button>

                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center", marginTop: "10px" }}>
                    v1.0.0
                </div>
            </div>
        </>
    );
}
