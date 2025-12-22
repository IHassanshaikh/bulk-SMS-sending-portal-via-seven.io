import { useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/auth/login`, { email, password });

            // Save token
            localStorage.setItem("token", res.data.token);
            // Reload to reset app state (simple auth flow)
            window.location.href = "/";

        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
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
            <div className="glass-panel" style={{ width: "400px", padding: "40px" }}>
                <h2 style={{ textAlign: "center", marginBottom: "30px", color: "var(--text-primary)" }}>Admin Login</h2>

                {error && (
                    <div style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.1)", padding: "10px", borderRadius: "8px", marginBottom: "20px", textAlign: "center" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Email Address</label>
                        <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", color: "var(--text-secondary)" }}>Password</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input"
                            style={{ width: "100%" }}
                        />
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: "100%", marginBottom: "15px" }}>
                        Login to Dashboard
                    </button>

                    <div style={{ textAlign: "center" }}>
                        <a href="/forgot-password" style={{ color: "var(--accent-primary)", fontSize: "0.9rem", textDecoration: "none" }}>
                            Forgot Password?
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
