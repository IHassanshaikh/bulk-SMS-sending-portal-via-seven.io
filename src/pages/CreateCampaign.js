import { useState } from "react";
import axios from "axios";
import { API } from "../api";
import { useNavigate } from "react-router-dom";

export default function CreateCampaign() {
    const [name, setName] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !name) {
            alert("Please provide a campaign name and a CSV file");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("campaignName", name);

        setLoading(true);
        try {
            await axios.post(`${API}/contacts/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            alert("Campaign created and contacts uploaded successfully!");
            navigate("/sms");
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Upload failed. Check console for details.";
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <h1>Create New Campaign</h1>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                Create a contact group for your campaign.
            </p>

            <div className="glass-panel" style={{ maxWidth: "500px", padding: "40px", margin: "0 auto" }}>
                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", marginBottom: "10px", color: "var(--text-secondary)" }}>Campaign Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Summer Sale 2025"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="glass-input"
                    />
                </div>

                <div style={{
                    border: "2px dashed var(--glass-border)",
                    borderRadius: "12px",
                    padding: "40px",
                    textAlign: "center",
                    cursor: "pointer",
                    marginBottom: "20px",
                    background: "var(--bg-dark)"
                }}>
                    <input type="file" onChange={handleFileChange} style={{ display: "none" }} id="file-upload" />
                    <label htmlFor="file-upload" style={{ cursor: "pointer", display: "block" }}>
                        <div style={{ fontSize: "1.2rem", marginBottom: "10px", color: "var(--text-primary)" }}>
                            {file ? `Selected: ${file.name}` : "Click to Upload File (CSV/Excel)"}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                            Supports CSV, XLS, XLSX. Auto-detects 'Phone' column.
                        </div>
                    </label>
                </div>

                <button
                    className="btn-primary"
                    onClick={handleUpload}
                    disabled={loading}
                    style={{ width: "100%" }}
                >
                    {loading ? "Creating..." : "Create Campaign"}
                </button>
            </div>
        </div>
    );
}
