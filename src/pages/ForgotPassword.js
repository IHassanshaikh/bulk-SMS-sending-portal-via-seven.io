import { useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        try {
            const res = await axios.post(`${API}/auth/forgot-password`, { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
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
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "var(--text-primary)" }}>Forgot Password</h2>

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
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Enter your Email</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                        Send Reset Link
                    </button>

                    <div style={{ textAlign: "center", marginTop: "15px" }}>
                        <a href="/login" style={{ color: "var(--text-secondary)", fontSize: "0.9rem", textDecoration: "none" }}>Back to Login</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
