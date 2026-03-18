import { useState, useEffect } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("vg_token"));
  const [checking, setChecking] = useState(true);

  // Verify stored token is still valid on mount
  useEffect(() => {
    const token = localStorage.getItem("vg_token");
    if (!token) {
      setChecking(false);
      return;
    }
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) handleLogout();
      })
      .catch(handleLogout)
      .finally(() => setChecking(false));
  }, []);

  const handleLogin = () => setAuthed(true);

  const handleLogout = () => {
    localStorage.removeItem("vg_token");
    localStorage.removeItem("vg_user");
    setAuthed(false);
  };

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#08080f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            border: "3px solid #1c1c2e",
            borderTopColor: "#22d3ee",
            borderRadius: "50%",
            animation: "spin 0.65s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!authed) return <Login onLogin={handleLogin} />;
  return <Dashboard onLogout={handleLogout} />;
}
