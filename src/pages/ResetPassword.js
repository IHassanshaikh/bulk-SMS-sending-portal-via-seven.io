import { useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../api";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const res = await axios.put(`${API}/auth/reset-password/${token}`, { password });
            setMessage("Password Reset Successful! Redirecting to login...");
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid or expired token");
        }
    };

    return (
        <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "var(--bg-dark)"
        }}>
            <div className="glass-panel" style={{ width: "400px", padding: "40px", display: "flex", flexDirection: "column" }}>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <img src="/techtide logo.png" alt="Logo" style={{ height: "60px", width: "auto" }} />
                </div>
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "var(--text-primary)" }}>Reset Password</h2>

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

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>New Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <div style={{ marginBottom: "30px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Confirm Password</label>
                        <input
                            required
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
}
