import { NavLink } from "react-router-dom";
import { LayoutDashboard, Upload, Bug, Brain, Cpu } from "lucide-react";

const items = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/upload", label: "Upload & Scan", icon: <Upload size={16} /> },
    { to: "/vulns", label: "Vulnerabilities", icon: <Bug size={16} /> },
    { to: "/votes", label: "LLM Votes", icon: <Brain size={16} /> },
    { to: "/models", label: "Models", icon: <Cpu size={16} /> },
];

const linkStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 7,
    padding: "18px 14px", fontSize: 13, fontWeight: 500,
    borderBottom: active ? "2px solid #3b82f6" : "2px solid transparent",
    background: active ? "rgba(59,130,246,0.08)" : "transparent",
    color: active ? "#3b82f6" : "#9ca3af",
    transition: "all 0.18s ease", whiteSpace: "nowrap",
});

export default function Navbar() {
    return (
        <nav style={{
            background: "#0a0e17", borderBottom: "1px solid #1f2937",
            position: "sticky", top: 0, zIndex: 100, padding: "0 32px",
        }}>
            <div style={{ display: "flex", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#3b82f6", marginRight: 32, whiteSpace: "nowrap" }}>
                    🛡 HybridGuard
                    <span style={{ fontSize: 10, color: "#6b7280", fontWeight: 400, marginLeft: 8 }}>
                        Multi-LLM Edition
                    </span>
                </div>
                {items.map(i => (
                    <NavLink key={i.to} to={i.to} end={i.to === "/"}
                        style={({ isActive }) => linkStyle(isActive)}>
                        {i.icon} {i.label}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
}
