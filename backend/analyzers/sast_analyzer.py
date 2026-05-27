"""
SAST Analyzer — pattern-based first-pass scanner
In production you'd swap this for Semgrep or Bandit.
"""

import re

class SASTAnalyzer:

    RULES = {
        "java": {
            "SQL Injection": [
                r'SELECT\s+.*\+.*',
                r'WHERE\s+.*\+.*',
                r'".*"\s*\+\s*\w+',
                r'INSERT.*\+.*',
                r'UPDATE.*\+.*',
                r'DELETE.*\+.*',
                r'".*"\s*\+\s*\w+',
            ],
            "Unsafe Statement": [
                r'createStatement\s*\(',
            ],
        },

        "python": {
            "SQL Injection": [
                r'f["\'].*SELECT.*\{',
                r'execute\s*\(\s*f["\']',
                r'cursor\.execute\s*\(\s*["\'].*%\s*',
            ],
        },

        "javascript": {
            "XSS": [
                r'innerHTML\s*=',
                r'document\.write\s*\(',
            ]
        }
    }

    def _detect_language(self, filename: str, content: str) -> str:
        if filename.endswith(".java"):
            return "java"
        elif filename.endswith(".py"):
            return "python"
        elif filename.endswith(".js"):
            return "javascript"

        # 🔥 fallback detection
        if "public class" in content:
            return "java"
        elif "def " in content:
            return "python"

        return "unknown"

    def analyze_files(self, files: list) -> list:
        findings = []
        for f in files:
            findings.extend(self._scan_file(f))
        return findings

    def _scan_file(self, f: dict) -> list:
        name = f.get("name", "unknown")
        content = f.get("content", "")
        found = []

        language = self._detect_language(name, content)
        print(f"[DEBUG] Language detected: {language}")

        rules = self.RULES.get(language, {})

        # ✅ FIXED: PROPERLY INDENTED LOOP
        for vuln_type, patterns in rules.items():
            for pat in patterns:
                if re.search(pat, content, re.IGNORECASE | re.MULTILINE):

                    print(f"[DEBUG] Matched pattern: {pat}")

                    severity, cwe = self._map_metadata(vuln_type)

                    found.append({
                        "tool": "SAST",
                        "type": vuln_type,
                        "file": name,
                        "line": self._find_line(content, pat),
                        "severity": severity,
                        "cwe": cwe,
                        "code_snippet": self._snippet(content, pat),
                        "language": language
                    })
                    break

        # 🔥 CONTEXT DETECTION
        if "SELECT" in content.upper() and "+" in content:
            found.append({
                "tool": "SAST",
                "type": "SQL Injection",
                "file": name,
                "line": 1,
                "severity": "Critical",
                "cwe": "CWE-89",
                "code_snippet": "Detected SQL concatenation",
                "confidence": 95
            })

        # 🔥 Taint detection
        taint_result = self._taint_analysis(content, name)
        if taint_result:
            found.append(taint_result)

        # 🔥 Deduplicate
        unique = {}
        for f in found:
            key = (f["type"], f.get("line", 0))
            if key not in unique:
                unique[key] = f

        return list(unique.values())

    def _context_analysis(self, code: str, language: str):
        code_upper = code.upper()

        if language == "java":
            if "SELECT" in code_upper and "+" in code:
                return {
                    "tool": "SAST",
                    "type": "SQL Injection",
                    "severity": "Critical",
                    "cwe": "CWE-89",
                    "line": 1,
                    "code_snippet": "SQL query built using string concatenation",
                    "confidence": 95
                }

        return None

    def _taint_analysis(self, code: str, name: str):
        user_inputs = ["username", "password", "input", "request"]

        for inp in user_inputs:
            if inp in code and "+" in code and "SELECT" in code.upper():
                return {
                    "tool": "SAST",
                    "type": "SQL Injection",
                    "file": name,
                    "line": 1,
                    "severity": "High",
                    "cwe": "CWE-89",
                    "code_snippet": f"Tainted variable '{inp}' used in SQL query",
                    "confidence": 90
                }

        return None

    def _map_metadata(self, vuln_type: str):
        mapping = {
            "SQL Injection": ("Critical", "CWE-89"),
            "Unsafe Statement": ("High", "CWE-89"),
            "Hardcoded Password": ("High", "CWE-798"),
            "Command Injection": ("Critical", "CWE-78"),
            "Eval / Code Injection": ("Critical", "CWE-94"),
            "Path Traversal": ("High", "CWE-22"),
            "XSS": ("Medium", "CWE-79"),
        }
        return mapping.get(vuln_type, ("Medium", "N/A"))

    def _find_line(self, code: str, pattern: str) -> int:
        for i, line in enumerate(code.splitlines(), 1):
            if re.search(pattern, line, re.IGNORECASE):
                return i
        return 1

    def _snippet(self, code: str, pattern: str) -> str:
        for line in code.splitlines():
            if re.search(pattern, line, re.IGNORECASE):
                return line.strip()
        return code[:120]
