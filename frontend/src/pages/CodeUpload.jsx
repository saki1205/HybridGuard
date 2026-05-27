import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileCode, X, Play, Loader, CheckCircle, AlertCircle, Plus } from "lucide-react";
import api from "../services/api";

const ACCEPT = ".py,.js,.jsx,.ts,.tsx,.java,.c,.cpp,.h,.cs,.go,.rb";
const EXT_MAP = {
    Python: ".py", JavaScript: ".js", TypeScript: ".ts", Java: ".java",
    "C/C++": ".c", "C#": ".cs", Go: ".go", Ruby: ".rb",
};

export default function CodeUpload() {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");   // status message
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    // State for direct paste
    const [pasteContent, setPasteContent] = useState("");
    const [pasteLang, setPasteLang] = useState("Python");

    const inputRef = useRef();
    const navigate = useNavigate();

    // ── File handling ─────────────────────────────────────────

    const addFiles = (newFiles) => {
        const arr = Array.from(newFiles).map(f => ({ file: f, name: f.name }));
        setFiles(prev => [...prev, ...arr]);
        setError("");
        setDone(false);
    };

    const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

    const onDrop = (e) => {
        e.preventDefault();
        addFiles(e.dataTransfer.files);
    };

    // ── Read file as text ─────────────────────────────────────

    const readFile = (f) =>
        new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsText(f);
        });

    // ── Handle Paste ──────────────────────────────────────────

    const handleAddPaste = () => {
        if (!pasteContent.trim()) return;
        const ext = EXT_MAP[pasteLang] || ".txt";
        const name = `pasted_snippet_${files.length + 1}${ext}`;

        setFiles(prev => [...prev, { name, rawContent: pasteContent }]);
        setPasteContent("");
        setError("");
        setDone(false);
    };

    // ── Analyze ───────────────────────────────────────────────

    const analyze = async () => {
        if (!files.length) { setError("Please add at least one file or snippet."); return; }
        setLoading(true);
        setError("");
        setStatus("Reading files…");

        try {
            const payload = await Promise.all(
                files.map(async (item) => ({
                    name: item.name,
                    content: item.rawContent !== undefined ? item.rawContent : await readFile(item.file),
                }))
            );

            setStatus("Running SAST scan…");
            await new Promise(r => setTimeout(r, 400));   // small UX delay

            setStatus("Querying 3 LLM models in parallel (this takes 30–90 seconds)…");
            const results = await api.analyze(payload);

            sessionStorage.setItem("hybridguard_results", JSON.stringify(results));
            setDone(true);
            setStatus(`Done! Found ${results.summary.verified_vulnerabilities} verified vulnerability/ies.`);

            setTimeout(() => navigate("/vulns"), 1200);

        } catch (e) {
            setError(e.message || "Analysis failed. Is the backend running?");
        } finally {
            setLoading(false);
        }
    };

    // ── Render ────────────────────────────────────────────────

    return (
        <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Upload & Scan</h1>
            <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>
                Upload source files or paste code snippets directly. They will be scanned by SAST then verified by 3 LLMs voting in parallel.
            </p>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Drop zone */}
                <div
                    className="card"
                    onDrop={onDrop}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => !loading && inputRef.current.click()}
                    style={{
                        border: "2px dashed #374151", textAlign: "center", marginBottom: 0,
                        padding: 48, cursor: loading ? "not-allowed" : "pointer",
                        transition: "border-color 0.2s", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center"
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = "#374151"}
                >
                    <Upload size={36} color="#4b5563" style={{ margin: "0 auto 12px" }} />
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop files here or click to browse</div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                        Supported: .py .js .jsx .ts .tsx .java .c .cpp .cs .go .rb
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept={ACCEPT}
                        style={{ display: "none" }}
                        onChange={e => addFiles(e.target.files)}
                    />
                </div>

                {/* Paste zone */}
                <div className="card" style={{ display: "flex", flexDirection: "column", marginBottom: 0, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>Or Paste Code Directly</div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                        <select
                            value={pasteLang}
                            onChange={e => setPasteLang(e.target.value)}
                            disabled={loading}
                            style={{
                                background: "#1f2937", color: "#e5e7eb", border: "1px solid #374151",
                                borderRadius: 6, padding: "6px 12px", fontSize: 13, flex: 1, outline: "none"
                            }}
                        >
                            {Object.keys(EXT_MAP).map(lang => (
                                <option key={lang} value={lang}>{lang} ({EXT_MAP[lang]})</option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddPaste}
                            disabled={loading || !pasteContent.trim()}
                            style={{ background: "#374151", color: "#e5e7eb", padding: "6px 14px", display: "flex", alignItems: "center", gap: 6 }}
                        >
                            <Plus size={14} /> Add Snippet
                        </button>
                    </div>
                    <textarea
                        value={pasteContent}
                        onChange={e => setPasteContent(e.target.value)}
                        disabled={loading}
                        placeholder="Paste your vulnerable code snippet here..."
                        style={{
                            flex: 1, background: "#0b0f14", border: "1px solid #1f2937", borderRadius: 8,
                            padding: 12, color: "#e5e7eb", fontFamily: "monospace", fontSize: 13,
                            resize: "none", outline: "none", minHeight: 180
                        }}
                    />
                </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="card">
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>
                        Files to scan ({files.length})
                    </div>
                    {files.map(({ name }, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "8px 0", borderBottom: "1px solid #1f2937",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <FileCode size={16} color="#3b82f6" />
                                <span style={{ fontSize: 14 }}>{name}</span>
                            </div>
                            {!loading && (
                                <button
                                    onClick={() => removeFile(i)}
                                    style={{ background: "transparent", color: "#6b7280", padding: "4px 8px" }}
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Status / error */}
            {status && (
                <div className="card" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    borderColor: done ? "#22c55e" : "#3b82f6",
                    color: done ? "#22c55e" : "#93c5fd",
                }}>
                    {done
                        ? <CheckCircle size={18} />
                        : <Loader size={18} style={{ animation: "spin 1s linear infinite" }} />}
                    <span style={{ fontSize: 14 }}>{status}</span>
                </div>
            )}

            {error && (
                <div className="card" style={{
                    display: "flex", alignItems: "center", gap: 10,
                    borderColor: "#ef4444", color: "#ef4444",
                }}>
                    <AlertCircle size={18} />
                    <span style={{ fontSize: 14 }}>{error}</span>
                </div>
            )}

            {/* CTA */}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                    onClick={analyze}
                    disabled={loading || !files.length}
                    style={{ background: "#3b82f6", color: "#fff", display: "flex", alignItems: "center", gap: 8 }}
                >
                    {loading
                        ? <><Loader size={16} style={{ animation: "spin 1s linear infinite" }} /> Analyzing…</>
                        : <><Play size={16} /> Run Multi-LLM Scan</>}
                </button>

                {files.length > 0 && !loading && (
                    <button
                        onClick={() => { setFiles([]); setStatus(""); setError(""); setDone(false); }}
                        style={{ background: "#1f2937", color: "#9ca3af" }}
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Spin keyframe */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
