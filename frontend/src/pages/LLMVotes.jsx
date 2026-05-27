import { useNavigate } from "react-router-dom";
import { Brain, ThumbsUp, ThumbsDown, AlertCircle, Clock } from "lucide-react";

const SEV_COLOR = {
    Critical: "#ef4444", High: "#f97316",
    Medium: "#eab308", Low: "#22c55e",
    Unknown: "#6b7280",
};

function VoteBar({ confidence, color }) {
    return (
        <div style={{ background: "#1f2937", borderRadius: 99, height: 6, marginTop: 4 }}>
            <div style={{
                width: `${confidence}%`, height: "100%",
                background: color, borderRadius: 99,
                transition: "width 0.4s ease",
            }} />
        </div>
    );
}

function ModelCard({ vote }) {
    const isVuln = vote.verdict === "vulnerable";
    const isError = vote.verdict === "error";
    const color = isError ? "#6b7280" : isVuln ? "#ef4444" : "#22c55e";

    return (
        <div style={{
            background: "#0f172a",
            border: `1px solid ${color}44`,
            borderRadius: 12, padding: 16,
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{vote.model}</div>
                <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    color, fontWeight: 700, fontSize: 13,
                }}>
                    {isError
                        ? <AlertCircle size={14} />
                        : isVuln ? <ThumbsDown size={14} /> : <ThumbsUp size={14} />}
                    {isError ? "Error" : vote.verdict}
                </div>
            </div>

            {!isError && (
                <>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                        Confidence: {vote.confidence}%
                    </div>
                    <VoteBar confidence={vote.confidence} color={color} />

                    <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                        <span style={{
                            background: (SEV_COLOR[vote.severity] || "#6b7280") + "22",
                            color: SEV_COLOR[vote.severity] || "#6b7280",
                            borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                        }}>
                            {vote.severity}
                        </span>
                        <span style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 3 }}>
                            <Clock size={11} /> {vote.inference_time}
                        </span>
                        <span style={{ fontSize: 11, color: "#6b7280" }}>
                            weight {vote.weight}
                        </span>
                    </div>

                    {vote.explanation && (
                        <div style={{ marginTop: 10, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
                            {vote.explanation}
                        </div>
                    )}
                </>
            )}

            {isError && (
                <div style={{ fontSize: 12, color: "#6b7280" }}>{vote.error}</div>
            )}
        </div>
    );
}

export default function LLMVotes() {
    const navigate = useNavigate();
    const results = JSON.parse(sessionStorage.getItem("hybridguard_results") || "null");

    if (!results) {
        return (
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>LLM Votes</h1>
                <div className="card" style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ color: "#6b7280", marginBottom: 16 }}>No scan results. Run a scan first.</div>
                    <button style={{ background: "#3b82f6", color: "#fff" }} onClick={() => navigate("/upload")}>
                        Go to Upload
                    </button>
                </div>
            </div>
        );
    }

    const allFindings = [
        ...(results.vulnerabilities || []).map(v => ({ ...v, confirmed: true })),
        ...(results.false_positives || []).map(v => ({ ...v, confirmed: false })),
    ];

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>LLM Ensemble Votes</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                How each model voted on every SAST candidate.
                Weighted vote = model_weight × (confidence / 100).
            </p>

            {allFindings.length === 0 && (
                <div className="card" style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>
                    No candidates were found by SAST.
                </div>
            )}

            {allFindings.map((finding, i) => (
                <div key={i} className="card" style={{
                    borderLeft: `3px solid ${finding.confirmed ? "#3b82f6" : "#374151"}`,
                    marginBottom: 20,
                }}>
                    {/* Finding header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <Brain size={18} color={finding.confirmed ? "#3b82f6" : "#6b7280"} />
                        <span style={{ fontWeight: 700, fontSize: 16 }}>{finding.sast_type || finding.type}</span>
                        <span style={{
                            background: finding.confirmed ? "#1d4ed822" : "#37415122",
                            color: finding.confirmed ? "#60a5fa" : "#6b7280",
                            borderRadius: 6, padding: "2px 10px", fontSize: 12,
                        }}>
                            {finding.confirmed ? "✅ Confirmed" : "🚫 Filtered"}
                        </span>
                    </div>

                    <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                        {finding.file} · Line {finding.line} ·{" "}
                        Ensemble confidence: <strong style={{ color: "#e5e7eb" }}>{finding.ensemble_confidence}%</strong> ·{" "}
                        Agreement: <strong style={{ color: "#e5e7eb" }}>{finding.agreement}</strong>
                    </div>

                    {/* Code snippet */}
                    <pre style={{
                        background: "#0b0f14", borderRadius: 8, padding: "8px 14px",
                        fontSize: 12, color: "#fbbf24", overflowX: "auto",
                        fontFamily: "'Cascadia Code','Consolas',monospace", marginBottom: 16,
                    }}>
                        {finding.code_snippet}
                    </pre>

                    {/* Per-model vote cards */}
                    <div className="grid-3">
                        {(finding.vote_breakdown || []).map((vt, j) => (
                            <ModelCard key={j} vote={vt} />
                        ))}
                    </div>

                    {/* Winning fix (only for confirmed) */}
                    {finding.confirmed && finding.fix && (
                        <div style={{
                            background: "#0f2516", border: "1px solid #166534",
                            borderRadius: 8, padding: "10px 14px", marginTop: 14,
                        }}>
                            <div style={{ fontSize: 12, color: "#4ade80", marginBottom: 4, fontWeight: 600 }}>
                                ✅ Ensemble Fix
                            </div>
                            <div style={{ fontSize: 13, color: "#bbf7d0", lineHeight: 1.6 }}>{finding.fix}</div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
