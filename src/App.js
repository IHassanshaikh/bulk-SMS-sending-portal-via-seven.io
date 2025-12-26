// Force Rebuild
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import CampaignLists from "./pages/CampaignLists";
import UploadCSV from "./pages/UploadCSV";
import SendSMS from "./pages/SendSMS";
import Logs from "./pages/Logs";
import Sidebar from "./components/Sidebar";
import Loader from "./components/Loader"; // New Loader
import { useState, useEffect } from "react";


import TestSMS from "./pages/TestSMS";
import LoginPage from "./pages/LoginPage";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ActiveCampaigns from "./pages/ActiveCampaigns";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
};

const AppLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {/* Mobile Header */}
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "var(--glass-bg)",
          borderBottom: "1px solid var(--glass-border)",
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          justifyContent: "space-between"
        }}>
          <div style={{ fontWeight: 700, fontSize: "1.2rem" }}>SMS Panel</div>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}
          >
            ☰
          </button>
        </div>
      )}

      <Sidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div style={{
        marginLeft: isMobile ? "0" : "280px",
        marginTop: isMobile ? "60px" : "0",
        flex: 1,
        padding: "0px",
        width: isMobile ? "100%" : "auto"
      }}>
        <PrivateRoute>
          {children}
        </PrivateRoute>
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoader = (e) => setLoading(e.detail);
    window.addEventListener("loader-change", handleLoader);
    return () => window.removeEventListener("loader-change", handleLoader);
  }, []);

  return (
    <BrowserRouter>
      {loading && <Loader />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route path="*" element={
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/campaigns" element={<CampaignLists />} />
              <Route path="/upload" element={<UploadCSV />} />

              <Route path="/sms" element={<SendSMS />} />
              <Route path="/active-campaigns" element={<ActiveCampaigns />} />
              <Route path="/test-sms" element={<TestSMS />} />
              <Route path="/logs" element={<Logs />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
