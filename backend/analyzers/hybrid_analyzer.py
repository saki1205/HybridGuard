"""
HybridGuard — Hybrid Analyzer
Pipeline: SAST → Multi-LLM Voting → Verified Report
"""

from .sast_analyzer import SASTAnalyzer
from .multi_llm_analyzer import MultiLLMAnalyzer

class HybridAnalyzer:
    """
    Full analysis pipeline:
      Stage 1 — SAST pattern scan   → fast, finds candidates
      Stage 2 — Multi-LLM voting    → 3 modelfile models vote
      Stage 3 — Report generation   → severity counts, score, fix suggestions
    """

    CONFIDENCE_THRESHOLD = 60   # ensemble_confidence must reach this to confirm

    def __init__(self):
        self.sast = SASTAnalyzer()
        self.llm  = MultiLLMAnalyzer()

    def analyze(self, files: list) -> dict:
        """
        Args:
            files: [{'name': str, 'content': str}, ...]
        Returns:
            Full analysis report dict
        """

        # ── Stage 1 ──────────────────────────────────────────
        print("\n🔍 Stage 1: SAST pattern scan…")
        sast_findings = self.sast.analyze_files(files)
        
        # 🔥 Ensure ALL files are scanned by LLMs even if SAST finds no rules (important for unhandled languages/vulns)
        files_with_findings = {f['file'] for f in sast_findings}
        for f in files:
            name = f.get('name', 'unknown_file')
            if name not in files_with_findings:
                sast_findings.append({
                    "tool": "General",
                    "type": "General Security Review",
                    "file": name,
                    "line": 1,
                    "severity": "Unknown",
                    "cwe": "N/A",
                    "code_snippet": f.get("content", ""),
                    "language": self.sast._detect_language(name, f.get("content", ""))
                })

        print(f"   → {len(sast_findings)} candidate(s) queued for voting")

        # ── Stage 2 ──────────────────────────────────────────
        print("\n🗳  Stage 2: Modelfile-Ensemble voting…")
        verified = []
        filtered = []

        for finding in sast_findings:
            print(f"\n   Candidate: [{finding['type']}] in {finding.get('file', 'unknown_file')}")

            vote = self.llm.voting_consensus(
                code=finding["code_snippet"],
                vuln_type=finding["type"],
            )

            # Map the dictionary back to list format for the frontend
            breakdown = []
            for m_key, m_res in vote.get("individual_results", {}).items():
                verdict = "vulnerable" if m_res.get("vulnerable") else "safe"
                if m_res.get("error"):
                    verdict = "error"
                
                w = 1.0
                if m_key == "codellama": w = 1.2
                if m_key == "deepseek": w = 1.1

                breakdown.append({
                    "model": m_res.get("model_role", m_key),
                    "verdict": verdict,
                    "confidence": m_res.get("confidence", 0),
                    "severity": m_res.get("severity", "Unknown"),
                    "explanation": str(m_res.get("explanation", "")),
                    "fix": str(m_res.get("fix", "")),
                    "weight": w,
                    "inference_time": m_res.get("inference_time", "0.0s"),
                    "error": m_res.get("error")
                })

            # Format explanation
            explanation_str = ""
            for m_key, exp in vote.get("explanation", {}).items():
                explanation_str += f"[{m_key}] {exp}\n"

            merged = {
                # SAST metadata
                "file":         finding["file"],
                "line":         finding.get("line", 1),
                "sast_type":    finding["type"],
                "sast_tool":    finding.get("tool", "SAST"),
                "code_snippet": finding["code_snippet"],
                # LLM voting results
                "vulnerable":          vote["vulnerable"],
                "ensemble_confidence": vote["confidence"],
                "severity":            vote["severity"],
                "type":                vote["type"],
                "explanation":         explanation_str.strip(),
                "fix":                 vote["fix"],
                "agreement":           vote["votes"],
                "vote_breakdown":      breakdown,
                "models_queried":      3,
                "models_responded":    len(vote.get("individual_results", {})),
            }

            if vote["vulnerable"] and vote["confidence"] >= self.CONFIDENCE_THRESHOLD:
                print(f"   ✅  Confirmed ({vote['votes']} | confidence {vote['confidence']}%)")
                verified.append(merged)
            else:
                print(f"   🚫  Filtered ({vote['votes']} | confidence {vote['confidence']}%)")
                filtered.append(merged)

        # ── Stage 3 ──────────────────────────────────────────
        print(f"\n📋 Stage 3: Generating report…")
        report = self._build_report(verified, filtered)
        print(f"   Verified: {len(verified)}  |  Filtered: {len(filtered)}")
        return report

    def _build_report(self, verified: list, filtered: list) -> dict:
        def sev(s): return sum(1 for v in verified if v.get("severity") == s)
        critical, high, medium, low = sev("Critical"), sev("High"), sev("Medium"), sev("Low")
        score = max(0, 100 - critical * 20 - high * 10 - medium * 5 - low * 2)

        return {
            "status":          "completed",
            "analysis_method": "SAST + Modelfile 3-Model Voting",
            "summary": {
                "total_candidates":         len(verified) + len(filtered),
                "verified_vulnerabilities": len(verified),
                "false_positives_filtered": len(filtered),
                "critical":        critical,
                "high":            high,
                "medium":          medium,
                "low":             low,
                "security_score":  score,
                "overall_status":  "Vulnerable" if verified else "Secure",
            },
            "vulnerabilities": verified,
            "false_positives": filtered,
        }
