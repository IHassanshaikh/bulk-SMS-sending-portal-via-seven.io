import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());

    useEffect(() => {
        axios.get(`${API}/contacts?t=${Date.now()}`)
            .then(res => {
                setContacts(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.log(err);
                setLoading(false);
            });
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this contact?")) return;
        try {
            await axios.delete(`${API}/contacts/${id}`);
            setContacts(contacts.filter(c => c._id !== id));
            const newSelected = new Set(selectedIds);
            newSelected.delete(id);
            setSelectedIds(newSelected);
        } catch (error) {
            alert("Error deleting contact");
            console.error(error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} contacts?`)) return;

        try {
            await axios.post(`${API}/contacts/delete-batch`, { ids: Array.from(selectedIds) });
            setContacts(contacts.filter(c => !selectedIds.has(c._id)));
            setSelectedIds(new Set());
        } catch (error) {
            alert("Error deleting contacts");
            console.error(error);
        }
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(contacts.map(c => c._id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    return (
        <div className="page-container">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>Contacts</h1>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn-primary"
                            style={{ background: "#ef4444" }}
                        >
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    <div className="glass-panel" style={{ padding: "8px 16px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Total: </span>
                        <span style={{ fontWeight: "bold" }}>{contacts.length}</span>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ overflow: "hidden" }}>
                <div className="table-responsive">
                    <table width="100%">
                        <thead>
                            <tr>
                                <th style={{ width: "40px" }}>
                                    <input
                                        type="checkbox"
                                        onChange={toggleSelectAll}
                                        checked={contacts.length > 0 && selectedIds.size === contacts.length}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading contacts...</td></tr>
                            ) : contacts.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)" }}>No contacts found. Upload CSV to add some.</td></tr>
                            ) : (
                                contacts.map((c, i) => (
                                    <tr key={i} style={{ background: selectedIds.has(c._id) ? "rgba(99, 102, 241, 0.1)" : "transparent" }}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(c._id)}
                                                onChange={() => toggleSelect(c._id)}
                                            />
                                        </td>
                                        <td>{c.name || "N/A"}</td>
                                        <td>{c.phone}</td>
                                        <td><span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "4px 8px", borderRadius: "4px", fontSize: "0.8rem" }}>Active</span></td>
                                        <td>
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                style={{
                                                    background: "rgba(239, 68, 68, 0.2)",
                                                    color: "#f87171",
                                                    border: "none",
                                                    padding: "6px 12px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer",
                                                    transition: "background 0.3s"
                                                }}
                                                onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.3)"}
                                                onMouseOut={(e) => e.target.style.background = "rgba(239, 68, 68, 0.2)"}
                                            >
                                                Delete
                                            </button>
                                        </td>
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
