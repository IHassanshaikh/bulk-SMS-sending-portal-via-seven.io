import React from "react";

export default function Loader() {
    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backdropFilter: "blur(2px)"
        }}>
            <div className="spinner" style={{
                width: "50px",
                height: "50px",
                border: "5px solid rgba(255, 255, 255, 0.3)",
                borderTop: "5px solid var(--accent-primary, #6366f1)",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
            }}></div>
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
