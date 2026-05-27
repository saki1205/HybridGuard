import { useNavigate } from "react-router-dom";
import { ShieldAlert, FileCode, Hash, Users, CheckCircle, AlertTriangle } from "lucide-react";

const SEV_COLOR = {
    Critical: "#ef4444", High: "#f97316",
    Medium: "#eab308", Low: "#22c55e",
    Unknown: "#6b7280",
};

const AGR_COLOR = (a) =>
    a === "unanimous" ? "#22c55e" : a?.includes("2/") ? "#eab308" : "#6b7280";

export default function Vulnerabilities() {
    const navigate = useNavigate();
    const results = JSON.parse(sessionStorage.getItem("hybridguard_results") || "null");

    if (!results) {
        return (
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Vulnerabilities</h1>
                <div className="card" style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ color: "#6b7280", marginBottom: 16 }}>No scan results. Run a scan first.</div>
                    <button style={{ background: "#3b82f6", color: "#fff" }} onClick={() => navigate("/upload")}>
                        Go to Upload
                    </button>
                </div>
            </div>
        );
    }

    const { summary, vulnerabilities = [], false_positives = [] } = results;

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Vulnerabilities</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                {summary.verified_vulnerabilities} confirmed · {summary.false_positives_filtered} filtered by LLM ensemble
            </p>

            {/* Summary pills */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
                {["Critical", "High", "Medium", "Low"].map(s => (
                    <div key={s} style={{
                        background: "#111827", border: `1px solid ${SEV_COLOR[s]}33`,
                        borderRadius: 8, padding: "6px 14px", fontSize: 13,
                        display: "flex", alignItems: "center", gap: 6,
                    }}>
                        <span style={{ color: SEV_COLOR[s], fontWeight: 700 }}>{summary[s.toLowerCase()]}</span>
                        <span style={{ color: "#6b7280" }}>{s}</span>
                    </div>
                ))}
                <div style={{
                    background: "#111827", border: "1px solid #1f2937",
                    borderRadius: 8, padding: "6px 14px", fontSize: 13,
                    display: "flex", alignItems: "center", gap: 6,
                }}>
                    <span style={{ color: "#3b82f6", fontWeight: 700 }}>{summary.security_score}</span>
                    <span style={{ color: "#6b7280" }}>/100 Score</span>
                </div>
            </div>

            {/* Confirmed vulnerabilities */}
            {vulnerabilities.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 32 }}>
                    <CheckCircle size={36} color="#22c55e" style={{ margin: "0 auto 12px" }} />
                    <div style={{ fontWeight: 600 }}>No vulnerabilities confirmed by LLM ensemble</div>
                </div>
            ) : (
                vulnerabilities.map((v, i) => (
                    <div key={i} className="card" style={{ borderLeft: `3px solid ${SEV_COLOR[v.severity] || "#6b7280"}` }}>

                        {/* Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <ShieldAlert size={18} color={SEV_COLOR[v.severity]} />
                                <span style={{ fontWeight: 700, fontSize: 16 }}>{v.type}</span>
                                <span style={{
                                    background: SEV_COLOR[v.severity] + "22",
                                    color: SEV_COLOR[v.severity],
                                    borderRadius: 6, padding: "2px 10px", fontSize: 12, fontWeight: 600,
                                }}>
                                    {v.severity}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <span style={{
                                    background: AGR_COLOR(v.agreement) + "22",
                                    color: AGR_COLOR(v.agreement),
                                    borderRadius: 6, padding: "2px 10px", fontSize: 12,
                                    display: "flex", alignItems: "center", gap: 4,
                                }}>
                                    <Users size={12} /> {v.agreement}
                                </span>
                                <span style={{
                                    background: "#1f2937", color: "#9ca3af",
                                    borderRadius: 6, padding: "2px 10px", fontSize: 12,
                                }}>
                                    confidence {v.ensemble_confidence}%
                                </span>
                            </div>
                        </div>

                        {/* File + line */}
                        <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 13, color: "#6b7280" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <FileCode size={13} /> {v.file}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <Hash size={13} /> Line {v.line}
                            </span>
                        </div>

                        {/* Code snippet */}
                        <pre style={{
                            background: "#0b0f14", border: "1px solid #1f2937",
                            borderRadius: 8, padding: "10px 14px", fontSize: 12,
                            fontFamily: "'Cascadia Code','Consolas',monospace",
                            overflowX: "auto", marginBottom: 12, color: "#fbbf24",
                        }}>
                            {v.code_snippet}
                        </pre>

                        {/* Explanation */}
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Explanation</div>
                            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{v.explanation}</div>
                        </div>

                        {/* Fix */}
                        <div style={{
                            background: "#0f2516", border: "1px solid #166534",
                            borderRadius: 8, padding: "10px 14px",
                        }}>
                            <div style={{ fontSize: 12, color: "#4ade80", marginBottom: 4, fontWeight: 600 }}>
                                ✅ Recommended Fix
                            </div>
                            <div style={{ fontSize: 13, color: "#bbf7d0", lineHeight: 1.6 }}>{v.fix}</div>
                        </div>

                        {/* Mini vote breakdown */}
                        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {v.vote_breakdown?.map((vt, j) => (
                                <div key={j} style={{
                                    background: "#1f2937", borderRadius: 8, padding: "4px 12px", fontSize: 12,
                                    display: "flex", alignItems: "center", gap: 6,
                                    borderLeft: `3px solid ${vt.verdict === "vulnerable" ? "#ef4444" : "#22c55e"}`,
                                }}>
                                    <span style={{ color: "#9ca3af" }}>{vt.model}</span>
                                    <span style={{ color: vt.verdict === "vulnerable" ? "#ef4444" : "#22c55e", fontWeight: 600 }}>
                                        {vt.verdict === "error" ? "error" : vt.verdict}
                                    </span>
                                    {vt.verdict !== "error" && (
                                        <span style={{ color: "#6b7280" }}>{vt.confidence}%</span>
                                    )}
                                </div>
                            ))}
                        </div>

                    </div>
                ))
            )}

            {/* Filtered / false positives */}
            {false_positives.length > 0 && (
                <details style={{ marginTop: 24 }}>
                    <summary style={{ cursor: "pointer", color: "#6b7280", fontSize: 14, marginBottom: 12 }}>
                        🚫 {false_positives.length} findings filtered as false positives by LLM ensemble
                    </summary>
                    {false_positives.map((v, i) => (
                        <div key={i} className="card" style={{ borderLeft: "3px solid #374151", opacity: 0.7 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <AlertTriangle size={16} color="#6b7280" />
                                <span style={{ fontWeight: 600, color: "#9ca3af" }}>{v.sast_type}</span>
                                <span style={{ fontSize: 12, color: "#6b7280" }}>
                                    filtered ({v.agreement} · {v.ensemble_confidence}% confidence)
                                </span>
                            </div>
                            <pre style={{
                                background: "#0b0f14", borderRadius: 8, padding: "8px 12px",
                                fontSize: 12, color: "#6b7280", overflowX: "auto",
                            }}>
                                {v.code_snippet}
                            </pre>
                        </div>
                    ))}
                </details>
            )}
        </div>
    );
}
