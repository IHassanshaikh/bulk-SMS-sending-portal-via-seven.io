import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../api";

export default function CampaignLists() {
    const navigate = useNavigate();
    const [view, setView] = useState("lists"); // 'lists' | 'contacts'
    const [campaigns, setCampaigns] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Create List Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Add Contacts Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [addMethod, setAddMethod] = useState("file"); // 'file' | 'db'
    const [dbContacts, setDbContacts] = useState([]);
    const [dbSelectedIds, setDbSelectedIds] = useState(new Set());
    const [isAdding, setIsAdding] = useState(false);

    // Add keyboard listener for Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setShowCreateModal(false);
                setShowAddModal(false);
                setDbSelectedIds(new Set());
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Fetch Campaigns (Lists)
    const fetchCampaigns = () => {
        setLoading(true);
        axios.get(`${API}/contacts/lists?t=${Date.now()}`)
            .then(res => {
                setCampaigns(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    // Handle viewing contacts of a specific campaign
    const handleViewContacts = (campaign) => {
        setSelectedCampaign(campaign);
        setView("contacts");
        setLoading(true);
        axios.get(`${API}/contacts?campaignId=${campaign._id}&t=${Date.now()}`)
            .then(res => {
                setContacts(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    // Delete a Campaign List
    const handleDeleteList = async (id) => {
        if (!window.confirm("Are you sure? This will delete the list AND all contacts inside it.")) return;
        try {
            await axios.delete(`${API}/contacts/lists/${id}`);
            setCampaigns(campaigns.filter(c => c._id !== id));
        } catch (error) {
            alert("Error deleting list");
            console.error(error);
        }
    };

    // Delete a Contact
    const handleDeleteContact = async (id) => {
        if (!window.confirm("Delete this contact?")) return;
        try {
            await axios.delete(`${API}/contacts/${id}`);
            setContacts(contacts.filter(c => c._id !== id));
            // Update selectedIds if needed
            if (selectedIds.has(id)) {
                const newSelected = new Set(selectedIds);
                newSelected.delete(id);
                setSelectedIds(newSelected);
            }
        } catch (error) {
            alert("Error deleting contact");
            console.error(error);
        }
    };

    // Bulk Delete Contacts
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!window.confirm(`Delete ${selectedIds.size} contacts?`)) return;

        try {
            await axios.post(`${API}/contacts/delete-batch`, { ids: Array.from(selectedIds) });
            setContacts(contacts.filter(c => !selectedIds.has(c._id)));
            setSelectedIds(new Set());
        } catch (error) {
            alert("Error deleting contacts");
            console.error(error);
        }
    };

    // Toggle Checkboxes
    const toggleSelectAll = (e) => {
        if (e.target.checked) setSelectedIds(new Set(contacts.map(c => c._id)));
        else setSelectedIds(new Set());
    };

    const toggleSelect = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleCreateList = async () => {
        if (!selectedFile || !newListName) {
            alert("Please provide a list name and a CSV file");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("campaignName", newListName);

        setIsCreating(true);
        try {
            await axios.post(`${API}/contacts/upload`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setShowCreateModal(false);
            setNewListName("");
            setSelectedFile(null);
            navigate("/sms");
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || "Upload failed.";
            alert(msg);
        } finally {
            setIsCreating(false);
        }
    };

    // Fetch all contacts from DB for selection
    const fetchDbContacts = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/contacts?t=${Date.now()}`);
            // Filter out contacts already in this campaign
            const filtered = res.data.filter(c => c.campaignId !== selectedCampaign?._id);
            setDbContacts(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContacts = async () => {
        if (addMethod === "file") {
            if (!selectedFile) return alert("Select a file first");
            const formData = new FormData();
            formData.append("file", selectedFile);
            formData.append("existingCampaignId", selectedCampaign._id);

            setIsAdding(true);
            try {
                await axios.post(`${API}/contacts/upload`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setShowAddModal(false);
                setSelectedFile(null);
                handleViewContacts(selectedCampaign); // Refresh contacts view
            } catch (error) {
                alert("Upload failed");
            } finally {
                setIsAdding(false);
            }
        } else {
            if (dbSelectedIds.size === 0) return alert("Select at least one contact");
            setIsAdding(true);
            try {
                await axios.post(`${API}/contacts/add-existing`, {
                    contactIds: Array.from(dbSelectedIds),
                    campaignId: selectedCampaign._id
                });
                setShowAddModal(false);
                setDbSelectedIds(new Set());
                handleViewContacts(selectedCampaign);
            } catch (error) {
                alert("Failed to add contacts");
            } finally {
                setIsAdding(false);
            }
        }
    };

    const toggleDbSelect = (id) => {
        const next = new Set(dbSelectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setDbSelectedIds(next);
    };

    const toggleDbSelectAll = (e) => {
        if (e.target.checked) setDbSelectedIds(new Set(dbContacts.map(c => c._id)));
        else setDbSelectedIds(new Set());
    };

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>
                    {view === "lists" ? "List" : (
                        <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                                onClick={() => { setView("lists"); setSelectedCampaign(null); setSelectedIds(new Set()); }}
                                style={{ background: "transparent", border: "1px solid var(--text-secondary)", color: "var(--text-primary)", padding: "5px 10px", borderRadius: "5px", cursor: "pointer" }}
                            >
                                ← Back
                            </button>
                            {selectedCampaign?.name}
                        </span>
                    )}
                </h1>

                {view === "lists" && (
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        + Create List
                    </button>
                )}

                {view === "contacts" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button
                            className="btn-primary"
                            style={{ background: "var(--accent-secondary)" }}
                            onClick={() => { setShowAddModal(true); fetchDbContacts(); }}
                        >
                            + Add Contacts
                        </button>
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
                )}
            </div>

            {/* Content Switcher */}
            {view === "lists" ? (
                // VIEW: LISTS
                <div className="glass-panel">
                    {loading ? <p style={{ padding: "20px", textAlign: "center" }}>Loading lists...</p> : (
                        <div className="table-responsive">
                            <table width="100%">
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left" }}>Details</th>
                                        <th style={{ textAlign: "right" }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.length === 0 ? (
                                        <tr><td colSpan="2" style={{ textAlign: "center", padding: "20px" }}>No lists found.</td></tr>
                                    ) : campaigns.map(cam => (
                                        <tr key={cam._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "15px" }}>
                                                <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "4px" }}>{cam.name}</div>
                                                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                                    {cam.count || 0} contacts • Created: {new Date(cam.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "right", padding: "15px" }}>
                                                <div className="flex-actions">
                                                    <button
                                                        onClick={() => handleViewContacts(cam)}
                                                        className="btn-primary"
                                                        style={{ padding: "8px 16px", fontSize: "0.9rem" }}
                                                    >
                                                        View Contacts
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteList(cam._id)}
                                                        style={{
                                                            background: "transparent",
                                                            border: "1px solid #ef4444",
                                                            color: "#ef4444",
                                                            padding: "8px 12px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                // VIEW: CONTACTS
                <div className="glass-panel">
                    {loading ? <p style={{ padding: "20px", textAlign: "center" }}>Loading contacts...</p> : (
                        <div className="table-responsive">
                            <table width="100%">
                                <thead>
                                    <tr>
                                        <th style={{ width: "40px" }}><input type="checkbox" onChange={toggleSelectAll} checked={contacts.length > 0 && selectedIds.size === contacts.length} /></th>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.length === 0 ? (
                                        <tr><td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>No contacts in this list.</td></tr>
                                    ) : contacts.map(c => (
                                        <tr key={c._id} style={{ background: selectedIds.has(c._id) ? "rgba(99, 102, 241, 0.1)" : "transparent" }}>
                                            <td><input type="checkbox" checked={selectedIds.has(c._id)} onChange={() => toggleSelect(c._id)} /></td>
                                            <td>{c.name || "N/A"}</td>
                                            <td>{c.phone}</td>
                                            <td>
                                                <button onClick={() => handleDeleteContact(c._id)} style={{ background: "transparent", color: "#ef4444", border: "none", cursor: "pointer" }}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Create List Modal */}
            {showCreateModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(0,0,0,0.5)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div className="glass-panel" style={{ maxWidth: "500px", width: "100%", padding: "30px", position: "relative" }}>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                        >
                            &times;
                        </button>

                        <h2 style={{ marginBottom: "20px" }}>Create New List</h2>

                        <form onSubmit={(e) => { e.preventDefault(); handleCreateList(); }}>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>List Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Summer Leads"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="glass-input"
                                    autoFocus
                                />
                            </div>

                            <div style={{
                                border: "2px dashed var(--glass-border)",
                                borderRadius: "12px",
                                padding: "30px",
                                textAlign: "center",
                                marginBottom: "20px",
                                background: "rgba(255,255,255,0.02)"
                            }}>
                                <input type="file" id="modal-file-upload" onChange={handleFileChange} style={{ display: "none" }} />
                                <label htmlFor="modal-file-upload" style={{ cursor: "pointer", display: "block" }}>
                                    <div style={{ fontSize: "1rem", marginBottom: "5px", color: "var(--text-primary)" }}>
                                        {selectedFile ? `Selected: ${selectedFile.name}` : "Upload CSV / Excel"}
                                    </div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                        Auto-detects 'Phone' column
                                    </div>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isCreating}
                                style={{ width: "100%" }}
                            >
                                {isCreating ? "Uploading..." : "Create List"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Contacts Modal */}
            {showAddModal && (
                <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 1000, padding: "20px"
                }}>
                    <div className="glass-panel" style={{ width: "min(600px, 90vw)", padding: "clamp(20px, 5vw, 30px)", position: "relative" }}>
                        <button
                            onClick={() => { setShowAddModal(false); setDbSelectedIds(new Set()); }}
                            style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "var(--text-secondary)", fontSize: "1.5rem", cursor: "pointer" }}
                        >
                            &times;
                        </button>

                        <h2 style={{ marginBottom: "20px" }}>Add More Contacts</h2>

                        <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                            <button
                                onClick={() => setAddMethod("file")}
                                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: addMethod === 'file' ? 'var(--accent-primary)' : 'rgba(0,0,0,0.5)', border: "none", color: "#fff", cursor: "pointer" }}
                            >
                                From File
                            </button>
                            <button
                                onClick={() => setAddMethod("db")}
                                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: addMethod === 'db' ? 'var(--accent-primary)' : 'rgba(0,0,0,0.5)', border: "none", color: "#fff", cursor: "pointer" }}
                            >
                                From Database
                            </button>
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); handleAddContacts(); }}>
                            {addMethod === "file" ? (
                                <div style={{
                                    border: "2px dashed var(--glass-border)",
                                    borderRadius: "12px",
                                    padding: "30px",
                                    textAlign: "center",
                                    marginBottom: "20px",
                                    background: "rgba(255,255,255,0.02)"
                                }}>
                                    <input type="file" id="add-file-upload" onChange={handleFileChange} style={{ display: "none" }} />
                                    <label htmlFor="add-file-upload" style={{ cursor: "pointer", display: "block" }}>
                                        <div style={{ fontSize: "1rem", marginBottom: "5px", color: "var(--text-primary)" }}>
                                            {selectedFile ? `Selected: ${selectedFile.name}` : "Upload CSV / Excel"}
                                        </div>
                                        <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                            Auto-detects 'Phone' column
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <div style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "20px", border: "1px solid var(--glass-border)", borderRadius: "8px" }}>
                                    <table width="100%" style={{ fontSize: "0.9rem" }}>
                                        <thead style={{ position: "sticky", top: 0, background: "var(--bg-dark)", zIndex: 1 }}>
                                            <tr>
                                                <th style={{ width: "40px", padding: "10px" }}><input type="checkbox" onChange={toggleDbSelectAll} checked={dbContacts.length > 0 && dbSelectedIds.size === dbContacts.length} /></th>
                                                <th style={{ textAlign: "left" }}>Name</th>
                                                <th style={{ textAlign: "left" }}>Phone</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {dbContacts.length === 0 ? (
                                                <tr><td colSpan="3" style={{ textAlign: "center", padding: "20px" }}>No unique contacts found in DB.</td></tr>
                                            ) : dbContacts.map(c => (
                                                <tr key={c._id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                                    <td style={{ padding: "8px 10px" }}><input type="checkbox" checked={dbSelectedIds.has(c._id)} onChange={() => toggleDbSelect(c._id)} /></td>
                                                    <td>{c.name || "N/A"}</td>
                                                    <td>{c.phone}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isAdding}
                                style={{ width: "100%" }}
                            >
                                {isAdding ? "Adding..." : "Add to List"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
