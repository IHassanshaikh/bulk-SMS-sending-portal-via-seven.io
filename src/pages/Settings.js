import { useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function Settings() {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);

        try {
            await axios.put(`${API}/auth/change-password`, { oldPassword, newPassword });
            setMessage("Password changed successfully!");
            setOldPassword("");
            setNewPassword("");
        } catch (err) {
            setError(err.response?.data?.message || "Error changing password");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>Settings</h2>

            <div className="glass-panel" style={{ maxWidth: "500px", padding: "30px" }}>
                <h3 style={{ marginBottom: "20px", color: "var(--text-primary)" }}>Change Password</h3>

                {message && (
                    <div style={{ color: "green", background: "rgba(0, 255, 0, 0.1)", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "8px", marginBottom: "20px" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleChangePassword}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Current Password</label>
                        <input
                            required
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>New Password</label>
                        <input
                            required
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
}
