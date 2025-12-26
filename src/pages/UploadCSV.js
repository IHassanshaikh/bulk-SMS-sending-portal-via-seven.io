import axios from "axios";
import { useState } from "react";
import { API } from "../api";

export default function UploadCSV() {
    const [file, setFile] = useState(null);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const upload = async () => {
        if (!file) return;
        setLoading(true);
        setMsg("");

        const form = new FormData();
        form.append("file", file);

        try {
            const res = await axios.post(`${API}/contacts/upload`, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setMsg(res.data.message || `Success! Uploaded ${res.data.total} contacts.`);
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Error uploading file.";
            setMsg(errorMsg);
            alert(errorMsg);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>Upload Contacts</h1>

            <div className="glass-panel" style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
                <div style={{ marginBottom: "2rem" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Select a CSV or Excel file to upload contacts in bulk.</p>
                    <div style={{
                        border: "2px dashed var(--glass-border)",
                        borderRadius: "12px",
                        padding: "40px",
                        background: "var(--bg-dark)"
                    }}>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            style={{ color: "var(--text-primary)" }}
                        />
                    </div>
                </div>

                <button
                    className="btn-primary"
                    onClick={upload}
                    disabled={loading}
                    style={{ width: "100%", opacity: loading ? 0.7 : 1 }}
                >
                    {loading ? "Uploading..." : "Upload Any File v2"}
                </button>

                {msg && (
                    <div style={{
                        marginTop: "20px",
                        padding: "12px",
                        background: msg.includes("Success") ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: msg.includes("Success") ? "#34d399" : "#f87171",
                        borderRadius: "8px"
                    }}>
                        {msg}
                    </div>
                )}
            </div>
        </div>
    );
}
