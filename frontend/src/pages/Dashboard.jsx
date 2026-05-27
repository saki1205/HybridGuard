import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Activity, AlertTriangle } from "lucide-react";
import api from "../services/api";

function StatCard({ icon, label, value, sub, color = "#3b82f6" }) {
    return (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color }}>
                {icon}
                <span style={{ fontSize: 13, color: "#6b7280" }}>{label}</span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{value}</div>
            {sub && <div style={{ fontSize: 12, color: "#6b7280" }}>{sub}</div>}
        </div>
    );
}

export default function Dashboard() {
    const [health, setHealth] = useState(null);
    const navigate = useNavigate();
    const results = JSON.parse(sessionStorage.getItem("hybridguard_results") || "null");

    useEffect(() => {
        api.health().then(setHealth).catch(() => setHealth({ status: "offline" }));
    }, []);

    const models = health?.models || {};
    const allOnline = Object.values(models).every(m => m.available);

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Dashboard</h1>
            <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>
                3-model ensemble — CodeLlama · Mistral · DeepSeek-Coder voting on every finding
            </p>

            {/* Model status bar */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {health ? (allOnline ? "🟢" : "🟡") : "⚪"} Ollama Models
                    </span>
                    {Object.entries(models).map(([k, m]) => (
                        <div key={k} style={{
                            display: "flex", alignItems: "center", gap: 6,
                            background: "#1f2937", borderRadius: 8, padding: "5px 12px", fontSize: 13,
                        }}>
                            <span style={{ color: m.available ? "#22c55e" : "#ef4444" }}>●</span>
                            {m.display}
                            <span style={{ color: "#6b7280", fontSize: 11 }}>w={m.weight}</span>
                        </div>
                    ))}
                    {!health && <span style={{ color: "#6b7280", fontSize: 13 }}>Connecting to backend…</span>}
                </div>
            </div>

            {results ? (
                <>
                    <div className="grid-4" style={{ marginBottom: 24 }}>
                        <StatCard icon={<Activity size={18} />} label="Security Score"
                            value={`${results.summary.security_score}/100`}
                            sub={results.summary.overall_status}
                            color={results.summary.security_score >= 70 ? "#22c55e" : "#ef4444"} />
                        <StatCard icon={<ShieldAlert size={18} />} label="Verified Vulns"
                            value={results.summary.verified_vulnerabilities}
                            sub={`${results.summary.false_positives_filtered} filtered by LLM vote`}
                            color="#ef4444" />
                        <StatCard icon={<AlertTriangle size={18} />} label="Critical"
                            value={results.summary.critical} color="#ef4444" />
                        <StatCard icon={<ShieldCheck size={18} />} label="Scan Time"
                            value={results.scan_time || "—"} sub="3-model ensemble" color="#8b5cf6" />
                    </div>

                    <div className="card">
                        <div style={{ fontWeight: 600, marginBottom: 8 }}>Analysis Method</div>
                        <div style={{ fontSize: 13, color: "#9ca3af" }}>{results.analysis_method}</div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        <button style={{ background: "#3b82f6", color: "#fff" }} onClick={() => navigate("/vulns")}>
                            View Vulnerabilities
                        </button>
                        <button style={{ background: "#7c3aed", color: "#fff" }} onClick={() => navigate("/votes")}>
                            View LLM Votes
                        </button>
                        <button style={{ background: "#1f2937", color: "#e5e7eb" }} onClick={() => navigate("/upload")}>
                            New Scan
                        </button>
                    </div>
                </>
            ) : (
                <div className="card" style={{ textAlign: "center", padding: 48 }}>
                    <ShieldCheck size={48} color="#374151" style={{ margin: "0 auto 16px" }} />
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No scan results yet</div>
                    <div style={{ color: "#6b7280", marginBottom: 20, fontSize: 14 }}>
                        Upload code to run multi-LLM ensemble analysis
                    </div>
                    <button style={{ background: "#3b82f6", color: "#fff" }} onClick={() => navigate("/upload")}>
                        Start Your First Scan
                    </button>
                </div>
            )}
        </div>
    );
}
