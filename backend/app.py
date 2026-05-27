"""
HybridGuard Flask API — Multi-LLM Edition
"""

import sys
# Fix UnicodeEncodeError on Windows
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from flask import Flask, request, jsonify
from flask_cors import CORS
from analyzers.hybrid_analyzer import HybridAnalyzer
from utils.helpers import sanitize_filename, is_supported_file
import os, time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# ── Initialize ────────────────────────────────────────────────

print("\n" + "=" * 60)
print("🚀  HybridGuard — Multi-LLM Ensemble Backend")
print("=" * 60)

try:
    analyzer = HybridAnalyzer()
    print("✅  Hybrid Analyzer ready")
except Exception as e:
    print(f"❌  Initialization failed: {e}")
    print("    Make sure Ollama is running:  ollama serve")
    exit(1)

print("=" * 60 + "\n")


# ── Health check ──────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health_check():
    import ollama as _ollama
    try:
        available = {m['name'] for m in _ollama.list().get('models', [])}
    except Exception:
        available = set()

    model_status = {
        "codellama": {
            "name":      "hybridguard-codellama",
            "display":   "HG CodeLlama Base",
            "available": any("hybridguard-codellama" in m for m in available),
            "weight":    1.0,
            "specialty": "Language syntax & pattern expert (Modelfile)",
        },
        "mistral": {
            "name":      "hybridguard-mistral",
            "display":   "HG Mistral Reasoner",
            "available": any("hybridguard-mistral" in m for m in available),
            "weight":    1.0,
            "specialty": "Reasoning and business logic analysis",
        },
        "deepseek": {
            "name":      "hybridguard-deepseek",
            "display":   "HG DeepSeek Context",
            "available": any("hybridguard-deepseek" in m for m in available),
            "weight":    1.0,
            "specialty": "Code context, variable tracking and data flow",
        }
    }

    all_ready = all(s["available"] for s in model_status.values())

    return jsonify({
        "status":       "healthy" if all_ready else "degraded",
        "service":      "HybridGuard API — Multi-LLM Ensemble",
        "timestamp":    datetime.now().isoformat(),
        "models":       model_status,
        "voting_logic": "Majority Voting Consensus: at least 2/3 models confident >= 50%",
        "analyzers": {
            "sast": "ready",
            "llm":  "ready" if all_ready else "degraded",
        },
    }), 200


# ── Analyze ────────────────────────────────────────────────────


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """
    POST /api/analyze
    Body:  { "files": [{ "name": "...", "content": "..." }] }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "No data provided"}), 400

        files = data.get("files")

        # 🔥 HANDLE DIRECT CODE INPUT (YOUR UI CASE)
        if not files:
            code = data.get("code", "")
            language = data.get("language", "txt")

            if not code:
                return jsonify({"error": "No code provided"}), 400

            extension_map = {
                "java": ".java",
                "python": ".py",
                "javascript": ".js"
            }

            ext = extension_map.get(language.lower(), ".txt")

            files = [{
                "name": f"input{ext}",
                "content": code
            }]
            print("\n[DEBUG] Files received:", files)

        validated = []
        for f in files:
            name    = f.get("name", "")
            content = f.get("content", "")
            if not name or not content:
                continue
            safe = sanitize_filename(name)
            if is_supported_file(safe):
                validated.append({"name": safe, "content": content})

        if not validated:
            return jsonify({"error": "No supported files (.py .js .ts .java .c .cpp .cs .go .rb)"}), 400

        print(f"\n{'='*60}")
        print(f"📊  Analysis started — {len(validated)} file(s)")
        print(f"    {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*60}")

        t0     = time.time()
        report = analyzer.analyze(validated)
        report["scan_time"]  = f"{time.time() - t0:.2f}s"
        report["timestamp"]  = datetime.now().isoformat()

        print(f"\n{'='*60}")
        print(f"✅  Done in {report['scan_time']}")
        print(f"   Verified: {report['summary']['verified_vulnerabilities']}")
        print(f"   Score:    {report['summary']['security_score']}/100")
        print(f"{'='*60}\n")

        return jsonify(report), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "status": "failed"}), 500


# ── Test endpoint ─────────────────────────────────────────────

@app.route("/api/test", methods=["GET"])
def test():
    """Runs a sample vulnerable file through the full pipeline."""
    sample = [
        {
            "name": "test_vulnerable.py",
            "content": (
                'query = f"SELECT * FROM users WHERE id={user_id}"\n'
                'password = "admin123"\n'
                'import os\n'
                'os.system(f"ping {host}")\n'
            ),
        }
    ]
    report = analyzer.analyze(sample)
    return jsonify(report), 200


# ── Models info ───────────────────────────────────────────────

@app.route("/api/models", methods=["GET"])
def models_info():
    """Returns info about the 3 voting models."""
    return jsonify({
        "voting": "Majority Voting Consensus: at least 2/3 models confident >= 50%",
        "threshold": "Majority",
        "models": [
            {"key": "codellama", "name": "hybridguard-codellama", "display": "HG CodeLlama Base", "weight": 1.0, "specialty": "Language syntax & pattern expert (Modelfile)"},
            {"key": "mistral", "name": "hybridguard-mistral", "display": "HG Mistral Reasoner", "weight": 1.0, "specialty": "Reasoning and business logic analysis"},
            {"key": "deepseek", "name": "hybridguard-deepseek", "display": "HG DeepSeek Context", "weight": 1.0, "specialty": "Code context, variable tracking and data flow"}
        ]
    }), 200


# ── Run ───────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Endpoints:")
    print("  GET  /api/health   — health + model status")
    print("  POST /api/analyze  — analyze code files")
    print("  GET  /api/test     — sample vulnerable code")
    print("  GET  /api/models   — model registry")
    print()
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
