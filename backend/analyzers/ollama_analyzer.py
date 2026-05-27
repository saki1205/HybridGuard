"""
Ollama CodeLlama Analyzer for Vulnerability Detection
"""

import ollama
import json
import time
import os
from dotenv import load_dotenv

load_dotenv()

class OllamaAnalyzer:
    """
    Analyzes code for security vulnerabilities using Ollama CodeLlama
    """
    
    def __init__(self, model=None):
        self.model = model or os.getenv('OLLAMA_MODEL', 'codellama:7b')
        self.host = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
        
        # Verify Ollama is running
        try:
            ollama.list()
            print(f"✅ Ollama connected - using {self.model}")
        except Exception as e:
            print(f"❌ Ollama not running: {e}")
            print("Start Ollama with: ollama serve")
            raise
    
    def analyze_vulnerability(self, code_snippet, vulnerability_type="any vulnerability"):
        """
        Analyze code for vulnerabilities
        
        Args:
            code_snippet (str): Code to analyze
            vulnerability_type (str): Type of vulnerability to check for
            
        Returns:
            dict: Analysis result with vulnerable, confidence, severity, etc.
        """
        
        prompt = self._create_prompt(code_snippet, vulnerability_type)
        
        start_time = time.time()
        
        try:
            response = ollama.generate(
                model=self.model,
                prompt=prompt,
                options={
                    'temperature': 0.3,
                    'top_p': 0.9,
                    'num_predict': 500
                }
            )
            
            inference_time = time.time() - start_time
            result_text = response['response']
            
            # Parse JSON from response
            parsed_result = self._parse_json_response(result_text)
            
            # Add metadata
            parsed_result['inference_time'] = f"{inference_time:.2f}s"
            parsed_result['model'] = self.model
            
            return parsed_result
            
        except Exception as e:
            return {
                "error": str(e),
                "vulnerable": False,
                "confidence": 0,
                "severity": "Unknown",
                "type": "Analysis Failed",
                "explanation": f"Error during analysis: {str(e)}",
                "fix": "Manual review required"
            }
    
    def _create_prompt(self, code, vuln_type):
        """Create analysis prompt for CodeLlama"""
        
        return f"""You are a security expert analyzing source code for vulnerabilities.

Analyze this code for {vuln_type}:

```
{code}
```

Respond ONLY with valid JSON in this exact format (no additional text):
{{
  "vulnerable": true or false,
  "confidence": 0-100,
  "severity": "Critical" or "High" or "Medium" or "Low" or "None",
  "type": "specific vulnerability type",
  "explanation": "detailed explanation of why it is or isn't vulnerable",
  "fix": "specific recommendation to fix the vulnerability"
}}

JSON:"""
    
    def _parse_json_response(self, response_text):
        """Extract and parse JSON from LLM response"""
        
        try:
            # Find JSON in response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                parsed = json.loads(json_str)
                
                # Validate required fields
                required_fields = ['vulnerable', 'confidence', 'severity', 'type', 'explanation', 'fix']
                for field in required_fields:
                    if field not in parsed:
                        parsed[field] = "Unknown"
                
                return parsed
            else:
                return {
                    "error": "No JSON found in response",
                    "vulnerable": False,
                    "confidence": 0,
                    "severity": "Unknown",
                    "type": "Parse Error",
                    "explanation": "Could not parse LLM response",
                    "fix": "Manual review required",
                    "raw_response": response_text
                }
                
        except json.JSONDecodeError as e:
            return {
                "error": f"JSON parse error: {str(e)}",
                "vulnerable": False,
                "confidence": 0,
                "severity": "Unknown",
                "type": "Parse Error",
                "explanation": "Invalid JSON in response",
                "fix": "Manual review required",
                "raw_response": response_text
            }
    
    def batch_analyze(self, code_files):
        """
        Analyze multiple code files
        
        Args:
            code_files (list): List of dicts with 'name' and 'content'
            
        Returns:
            list: Analysis results for each file
        """
        
        results = []
        
        for file in code_files:
            filename = file.get('name', 'unknown')
            content = file.get('content', '')
            
            print(f"Analyzing {filename}...")
            
            result = self.analyze_vulnerability(content, "any vulnerability")
            result['file'] = filename
            
            results.append(result)
        
        return results


# Test function
if __name__ == "__main__":
    analyzer = OllamaAnalyzer()
    
    # Test cases
    test_cases = [
        {
            "name": "SQL Injection",
            "code": 'query = f"SELECT * FROM users WHERE id={user_id}"',
            "type": "SQL Injection"
        },
        {
            "name": "Hardcoded Password",
            "code": 'password = "admin123"',
            "type": "Hardcoded Credentials"
        },
        {
            "name": "Command Injection",
            "code": 'os.system(f"ping {host}")',
            "type": "Command Injection"
        }
    ]
    
    print("="*60)
    print("TESTING OLLAMA ANALYZER")
    print("="*60)
    
    for i, test in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test['name']}")
        print(f"Code: {test['code']}")
        
        result = analyzer.analyze_vulnerability(test['code'], test['type'])
        
        print(f"\nResult:")
        print(json.dumps(result, indent=2))
        print("-" * 60)
