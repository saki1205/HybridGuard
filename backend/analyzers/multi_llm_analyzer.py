"""
Multi-LLM Analyzer using custom Modelfile-based models
"""

import ollama
import json
import time
from typing import Dict, List

class MultiLLMAnalyzer:
    """
    Analyzes code using 3 specialized Ollama models with voting
    
    """
    def rule_override(self, code: str):
        code_upper = code.upper()

        # 🚨 Java SQL Injection detection
        if (
            "SELECT" in code_upper and
            "+" in code and
            "STATEMENT" in code_upper
        ):
            return {
                "vulnerable": True,
                "confidence": 95,
                "severity": "Critical",
                "type": "SQL Injection",
                "cwe": "CWE-89",
                "explanation": "SQL query built using string concatenation with user input.",
                "fix": "Use PreparedStatement with parameterized queries."
            }

        return None

    def __init__(self):
        # Custom model registry
        self.models = {
            "codellama": {
                "name": "hybridguard-codellama",
                "role": "Syntax & Pattern Expert",
                "strength": "API misuse, injection patterns"
            },
            "mistral": {
                "name": "hybridguard-mistral",
                "role": "Security Reasoning",
                "strength": "Logic flaws, business vulnerabilities"
            },
            "deepseek": {
                "name": "hybridguard-deepseek",
                "role": "Code Context Analyzer",
                "strength": "Data flow, variable tracking"
            }
        }
        
        # Verify all models exist
        self._verify_models()
    
    def _verify_models(self):
        """Check that all custom models exist"""
        try:
            available = ollama.list()
            models_list = available.get('models', []) if isinstance(available, dict) else getattr(available, 'models', [])
            model_names = [m.get('name', m.get('model')) if isinstance(m, dict) else getattr(m, 'model', getattr(m, 'name', '')) for m in models_list]
            
            for key, config in self.models.items():
                if not any(config['name'] in m_name for m_name in model_names):
                    raise RuntimeError(
                        f"Model {config['name']} not found. "
                        f"Run setup_models script first!"
                    )
            
            print("✅ All 3 custom models verified")
            
        except Exception as e:
            raise RuntimeError(f"Model verification failed: {e}")
    
    def _analyze_with_model(self, model_key: str, code: str, vuln_type: str) -> Dict:
        """
        Analyze code with a single model
        
        Args:
            model_key: 'codellama', 'mistral', or 'deepseek'
            code: Code snippet to analyze
            vuln_type: Type of vulnerability to check
            
        Returns:
            dict with analysis result
        """
        
        model_config = self.models[model_key]
        model_name = model_config['name']
        
        # Simplified prompt - system context is baked into model
        prompt = f"""
You are an expert security code analyzer.

Task: Analyze the following code snippet for vulnerabilities.
Focus Area (if any): {vuln_type}

Code Snippet:
{code}

STRICT RULE:
Return ONLY valid JSON with the following structure. Do not output any markdown formatting, backticks, or extra text.
{{
  "vulnerable": true/false,
  "confidence": <0-100 integer>,
  "severity": "Critical" | "High" | "Medium" | "Low" | "None",
  "type": "<Vulnerability Name>",
  "cwe": "<CWE-ID or N/A>",
  "explanation": "<Short explanation>",
  "fix": "<How to fix>"
}}
"""
        
        start_time = time.time()
        
        try:
            response = ollama.generate(
                model=model_name,
                prompt=prompt
            )
            
            inference_time = time.time() - start_time
            result_text = response['response']
            
            # Parse JSON
            json_start = result_text.find('{')
            json_end = result_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = result_text[json_start:json_end]
                parsed = json.loads(json_str)
                
                # Add metadata
                parsed['model'] = model_key
                parsed['model_role'] = model_config['role']
                parsed['inference_time'] = f"{inference_time:.2f}s"
                
                return parsed
            else:
                return {
                    "error": "No JSON in response",
                    "model": model_key,
                    "vulnerable": False,
                    "confidence": 0
                }
                
        except json.JSONDecodeError as e:
            return {
                "error": f"JSON parse error: {str(e)}",
                "model": model_key,
                "vulnerable": False,
                "confidence": 0
            }
        except Exception as e:
            return {
                "error": str(e),
                "model": model_key,
                "vulnerable": False,
                "confidence": 0
            }
    
    def voting_consensus(self, code: str, vuln_type: str = "vulnerability") -> Dict:
    
        # ✅ STEP 1: Rule-based override
        override = self.rule_override(code)
        if override:
            return {
                **override,
                "analysis_method": "Rule-based override",
                "votes": "override"
            }

        print("\n🗳️  Running 3-model voting analysis...")

        results = {}

        # ✅ STEP 2: Run all models
        for model_key in ["codellama", "mistral", "deepseek"]:
            print(f"   Consulting {model_key}...")
            results[model_key] = self._analyze_with_model(model_key, code, vuln_type)

        # ✅ DEBUG LOGGING
        print("\n--- MODEL OUTPUTS ---")
        for k, v in results.items():
            print(f"{k}: vulnerable={v.get('vulnerable')} | confidence={v.get('confidence')} | severity={v.get('severity')}")

        # ✅ STEP 3: Count votes
        votes_vulnerable = sum(
            1 for r in results.values()
            if r.get('vulnerable', False) and r.get('confidence', 0) >= 50
        )

        total_votes = len(results)

        # ✅ STEP 4: HIGH SEVERITY OVERRIDE
        high_severity_detected = any(
            r.get("severity") in ["Critical", "High"] and r.get("confidence", 0) >= 60
            for r in results.values()
        )

        if high_severity_detected:
            consensus_vulnerable = True
        else:
            consensus_vulnerable = votes_vulnerable >= 2

        # ✅ STEP 5: Confidence calculation
        consensus_confidence = (votes_vulnerable / total_votes) * 100

        # ✅ STEP 6: Extract vulnerable results
        vulnerable_results = [
            r for r in results.values()
            if r.get('vulnerable', False)
        ]

        if vulnerable_results:
            severities = [r.get('severity', 'Medium') for r in vulnerable_results]
            consensus_severity = max(set(severities), key=severities.count)
        else:
            consensus_severity = "None"

        cwes = [
            r.get('cwe', '')
            for r in vulnerable_results
            if r.get('cwe') and r.get('cwe') != 'N/A'
        ]
        consensus_cwe = max(set(cwes), key=cwes.count) if cwes else "N/A"

        types = [
            r.get('type', 'Unknown')
            for r in vulnerable_results
        ]
        consensus_type = max(set(types), key=types.count) if types else "No Vulnerability"

        explanations = {
            model: r.get('explanation', 'N/A')
            for model, r in results.items()
        }

        if vulnerable_results:
            best_result = max(vulnerable_results, key=lambda x: x.get('confidence', 0))
            consensus_fix = best_result.get('fix', 'Manual review recommended')
        else:
            consensus_fix = "No fix needed - code appears secure"

        return {
            "vulnerable": consensus_vulnerable,
            "confidence": round(consensus_confidence),
            "severity": consensus_severity,
            "type": consensus_type,
            "cwe": consensus_cwe,
            "explanation": explanations,
            "fix": consensus_fix,
            "votes": f"{votes_vulnerable}/{total_votes}",
            "individual_results": results,
            "analysis_method": "3-Model Voting (Fixed + Override)"
        }

