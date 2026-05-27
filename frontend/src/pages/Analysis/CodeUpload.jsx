import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import api from '../../services/api';

const CodeUpload = () => {
    const [code, setCode] = useState('');
    const [filename, setFilename] = useState('test_file.py');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        if (!code.trim()) {
            setError('Please enter some code to analyze.');
            return;
        }

        setError('');
        setLoading(true);
        setResults(null);

        try {
            const response = await api.analyzeCode([{ name: filename, content: code }]);
            setResults(response);
        } catch (err) {
            setError(err.message || 'An error occurred during analysis');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityClass = (severity) => {
        if (severity === 'Critical' || severity === 'High') return 'vulnerability-card';
        return 'vulnerability-card medium';
    };

    const getTitleClass = (severity) => {
        if (severity === 'Critical' || severity === 'High') return 'vulnerability-title';
        return 'vulnerability-title medium';
    };

    const loadSampleCode = () => {
        setFilename('login.py');
        setCode(`import os

def authenticate(username, password):
    # Potential SQL Injection
    query = f"SELECT * FROM users WHERE username='{username}' AND password='{password}'"
    db.execute(query)
    
    # Hardcoded credential
    admin_password = "supersecret_admin_pass"
    
    # Potential Command Injection
    os.system(f"echo {username} logged in")
    return True
`);
    }

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Upload Code for Analysis</h2>

            <div className="card">
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Filename:</label>
                        <input
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #d1d5db', width: '250px' }}
                        />
                    </div>
                    <button className="button" style={{ backgroundColor: '#10b981' }} onClick={loadSampleCode}>
                        Load Sample Vulnerable Code
                    </button>
                </div>

                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Source Code:</label>
                <textarea
                    className="textarea-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your source code here..."
                />

                {error && <div style={{ color: '#dc2626', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.375rem' }}>{error}</div>}

                <button
                    className="button"
                    onClick={handleAnalyze}
                    disabled={loading}
                    style={{ width: '100%', fontSize: '1.125rem', padding: '0.75rem' }}
                >
                    {loading ? (
                        <><span className="loader"></span> Analyzing Code (Combining SAST & LLM)...</>
                    ) : 'Run HybridGuard Analysis'}
                </button>
            </div>

            {results && (
                <div className="card" style={{ borderTop: '4px solid #3b82f6' }}>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                        Analysis Results
                        <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6b7280', marginLeft: '10px' }}>
                            ({results.scan_time} scanning time)
                        </span>
                    </h3>

                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Security Score</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: results.summary.security_score < 70 ? '#dc2626' : '#16a34a' }}>
                                {results.summary.security_score}/100
                            </div>
                        </div>
                        <div style={{ width: '1px', backgroundColor: '#d1d5db' }}></div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Vulnerabilities</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                                {results.summary.verified_vulnerabilities}
                            </div>
                        </div>
                        <div style={{ width: '1px', backgroundColor: '#d1d5db' }}></div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', fontWeight: 'bold' }}>False Positives</div>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                                {results.summary.false_positives_filtered}
                            </div>
                        </div>
                    </div>

                    {results.vulnerabilities.length > 0 ? (
                        <div>
                            <h4 style={{ fontSize: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Verified Vulnerabilities (AI Confirmed)</h4>
                            {results.vulnerabilities.map((vuln, idx) => (
                                <div key={idx} className={getSeverityClass(vuln.llm_severity || vuln.severity)}>
                                    <div className={getTitleClass(vuln.llm_severity || vuln.severity)}>
                                        {vuln.type}
                                        <span className={`badge badge-${(vuln.llm_severity || vuln.severity).toLowerCase()}`}>
                                            {vuln.llm_severity || vuln.severity}
                                        </span>
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280', float: 'right', fontWeight: 'normal' }}>
                                            Line: {vuln.line} | AI Confidence: {vuln.llm_confidence}%
                                        </span>
                                    </div>

                                    <div className="vulnerability-detail">
                                        <strong style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280', marginTop: '10px' }}>Code Snippet:</strong>
                                        <pre style={{ backgroundColor: '#1f2937', color: '#f8f8f2', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', overflowX: 'auto', marginTop: '4px' }}>
                                            {vuln.code_snippet}
                                        </pre>
                                    </div>

                                    <div className="vulnerability-detail" style={{ marginTop: '10px' }}>
                                        <strong style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>AI Explanation:</strong>
                                        <div style={{ backgroundColor: 'white', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #fecaca', marginTop: '4px' }}>
                                            {vuln.llm_explanation}
                                        </div>
                                    </div>

                                    <div className="vulnerability-detail" style={{ marginTop: '10px' }}>
                                        <strong style={{ display: 'block', fontSize: '0.875rem', color: '#6b7280' }}>Recommended Fix:</strong>
                                        <div style={{ backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #bbf7d0', marginTop: '4px', color: '#166534' }}>
                                            {vuln.llm_fix}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#166534' }}>
                            <CheckCircle size={48} style={{ margin: '0 auto 1rem' }} />
                            <h4 style={{ fontSize: '1.25rem', margin: 0 }}>No verified vulnerabilities found!</h4>
                            <p>Your code is secure according to our HybridGuard analysis.</p>
                        </div>
                    )}

                    {results.false_positives.length > 0 && (
                        <div style={{ marginTop: '2rem' }}>
                            <h4 style={{ fontSize: '1.25rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#16a34a' }}>
                                Filtered False Positives (Rejected by AI)
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                                These patterns were flagged by traditional SAST rules, but our LLM determined they are not actual vulnerabilities.
                            </p>

                            {results.false_positives.map((fp, idx) => (
                                <div key={idx} style={{ padding: '1rem', border: '1px solid #d1d5db', borderRadius: '0.25rem', marginBottom: '1rem', backgroundColor: '#f9fafb' }}>
                                    <div style={{ fontWeight: 'bold', color: '#4b5563', marginBottom: '0.5rem' }}>
                                        Triggered Rule: {fp.type}
                                        <span style={{ fontSize: '0.875rem', color: '#6b7280', float: 'right', fontWeight: 'normal' }}>
                                            Line: {fp.line}
                                        </span>
                                    </div>
                                    <pre style={{ backgroundColor: '#e5e7eb', padding: '0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', overflowX: 'auto', marginBottom: '10px' }}>
                                        {fp.code_snippet}
                                    </pre>
                                    <div>
                                        <strong style={{ fontSize: '0.875rem', color: '#4b5563' }}>AI Rejection Reason:</strong>
                                        <span style={{ fontSize: '0.875rem', marginLeft: '8px', color: '#16a34a' }}>{fp.llm_explanation}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CodeUpload;
