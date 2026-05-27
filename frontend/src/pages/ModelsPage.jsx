import { useState, useEffect } from "react";
import { Cpu, CheckCircle, XCircle } from "lucide-react";
import api from "../services/api";

export default function ModelsPage() {
    const [info, setInfo] = useState(null);
    const [health, setHealth] = useState(null);

    useEffect(() => {
        api.models().then(setInfo).catch(console.error);
        api.health().then(setHealth).catch(console.error);
    }, []);

    const avail = health?.models || {};

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Model Registry</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                The 3 Ollama models used for ensemble voting and their configuration.
            </p>

            {info ? (
                <>
                    <div className="grid-3" style={{ marginBottom: 24 }}>
                        {info.models.map((m) => {
                            const on = avail[m.key]?.available;
                            return (
                                <div key={m.key} className="card" style={{
                                    borderTop: `3px solid ${on ? "#22c55e" : "#374151"}`,
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                                        <Cpu size={20} color={on ? "#22c55e" : "#6b7280"} />
                                        {on !== undefined && (
                                            on
                                                ? <CheckCircle size={18} color="#22c55e" />
                                                : <XCircle size={18} color="#ef4444" />
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{m.display}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10, fontFamily: "monospace" }}>
                                        {m.name}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                        <span style={{ fontSize: 12, color: "#9ca3af" }}>Vote Weight</span>
                                        <span style={{
                                            fontWeight: 700, fontSize: 14,
                                            color: m.weight >= 1.2 ? "#3b82f6" : m.weight >= 1.1 ? "#8b5cf6" : "#9ca3af",
                                        }}>
                                            {m.weight}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
                                        {m.specialty}
                                    </div>
                                    {!on && on !== undefined && (
                                        <div style={{
                                            marginTop: 12, background: "#1c0a0a",
                                            border: "1px solid #7f1d1d", borderRadius: 8, padding: "8px 12px",
                                            fontSize: 12, color: "#fca5a5",
                                        }}>
                                            Not found locally. Run:<br />
                                            <code style={{ color: "#fbbf24" }}>ollama pull {m.name}</code>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="card">
                        <div style={{ fontWeight: 600, marginBottom: 10 }}>How Voting Works</div>
                        <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.8 }}>
                            <p style={{ marginBottom: 8 }}>
                                <strong style={{ color: "#e5e7eb" }}>Formula:</strong> {info.voting}
                            </p>
                            <p>
                                <strong style={{ color: "#e5e7eb" }}>Threshold:</strong> {info.threshold}
                            </p>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: 0 }}>
                        <div style={{ fontWeight: 600, marginBottom: 10 }}>Install / Pull Commands</div>
                        <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 8 }}>
                            Run these in PowerShell to make sure all 3 models are available:
                        </div>
                        <pre style={{
                            background: "#0b0f14", borderRadius: 8, padding: "12px 16px",
                            fontSize: 13, color: "#4ade80", fontFamily: "'Cascadia Code','Consolas',monospace",
                        }}>
                            {`ollama pull codellama:7b
ollama pull mistral:7b
ollama pull deepseek-coder:6.7b

# Verify:
ollama list`}
                        </pre>
                    </div>
                </>
            ) : (
                <div className="card" style={{ textAlign: "center", padding: 32, color: "#6b7280" }}>
                    Connecting to backend…
                </div>
            )}
        </div>
    );
}
