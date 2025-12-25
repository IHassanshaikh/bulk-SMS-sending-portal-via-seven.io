import { useEffect, useState } from "react";
import axios from "axios";
import { API } from "../api";

export default function CampaignLists() {
    const [view, setView] = useState("lists"); // 'lists' | 'contacts'
    const [campaigns, setCampaigns] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedIds, setSelectedIds] = useState(new Set());

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

    return (
        <div className="page-container">
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1>
                    {view === "lists" ? "Campaign Lists" : (
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

                {view === "contacts" && (
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
                                        <tr><td colSpan="2" style={{ textAlign: "center", padding: "20px" }}>No campaign lists found.</td></tr>
                                    ) : campaigns.map(cam => (
                                        <tr key={cam._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                            <td style={{ padding: "15px" }}>
                                                <div style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "4px" }}>{cam.name}</div>
                                                <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                                    {cam.count || 0} contacts • Created: {new Date(cam.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: "right", padding: "15px" }}>
                                                <button
                                                    onClick={() => handleViewContacts(cam)}
                                                    className="btn-primary"
                                                    style={{ marginRight: "10px", padding: "8px 16px", fontSize: "0.9rem" }}
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
        </div>
    );
}
