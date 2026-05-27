import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ShieldAlert, CheckCircle, Activity } from 'lucide-react';

const Overview = () => {
    const [health, setHealth] = useState(null);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const data = await api.healthCheck();
                setHealth(data);
            } catch (err) {
                setHealth({ status: 'offline' });
            }
        };
        checkHealth();
    }, []);

    return (
        <div>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Dashboard Overview</h2>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Activity size={40} color="#3b82f6" style={{ marginBottom: '10px' }} />
                    <h3>System Status</h3>
                    {health ? (
                        <div style={{ color: health.status === 'healthy' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                            {health.status === 'healthy' ? 'Online' : 'Offline'}
                        </div>
                    ) : (
                        <div>Checking...</div>
                    )}
                </div>

                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ShieldAlert size={40} color="#f59e0b" style={{ marginBottom: '10px' }} />
                    <h3>Analyzers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', alignItems: 'center', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%' }}>
                            <span>Ollama LLM:</span>
                            <strong style={{ color: health?.analyzers?.ollama === 'ready' ? '#16a34a' : '#d1d5db' }}>
                                {health?.analyzers?.ollama || 'Unknown'}
                            </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%' }}>
                            <span>SAST Engine:</span>
                            <strong style={{ color: health?.analyzers?.sast === 'ready' ? '#16a34a' : '#d1d5db' }}>
                                {health?.analyzers?.sast || 'Unknown'}
                            </strong>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CheckCircle size={40} color="#16a34a" style={{ marginBottom: '10px' }} />
                    <h3>Total Scans</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>0</div>
                    <div style={{ color: '#6b7280' }}>Waiting for first scan</div>
                </div>
            </div>

            <div className="card">
                <h3>Welcome to HybridGuard</h3>
                <p>This is your central command for security vulnerability detection.</p>
                <p>HybridGuard uses a combination of traditional SAST (Static Application Security Testing) patterns with advanced validation from an AI model (CodeLlama-7B running on Ollama) to drastically reduce false positives and provide actionable fix advice.</p>
                <ul style={{ lineHeight: '1.8' }}>
                    <li>Navigate to **Analyze Code** to upload source code.</li>
                    <li>Ensure your Python backend is running.</li>
                    <li>Ensure Ollama (`ollama serve`) is running for real-time AI validation.</li>
                </ul>
            </div>
        </div>
    );
};

export default Overview;
