import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function EmailPage() {
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/email-config/status`).then(r => setStatus(r.data));
  }, []);

  const sendTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post(`${API_URL}/api/email-config/test`, { to: testTo || undefined });
      setTestResult({ success: true, msg: `Test email sent to ${res.data.sentTo}` });
    } catch (e) {
      setTestResult({ success: false, msg: e.response?.data?.error || 'Failed to send' });
    }
    setTesting(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Email (SMTP)</h1>
          <p className="page-subtitle">Gmail SMTP configuration for email alerts</p>
        </div>
      </div>

      {/* Status */}
      <div className={`wa-status ${status?.configured ? 'wa-ready' : 'wa-disconnected'}`}>
        <span style={{ fontSize: 20 }}>{status?.configured ? '✅' : '❌'}</span>
        {status?.configured ? `Connected — ${status.mailUser}` : 'Not configured — update backend/.env file'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>

        {/* Current Config — Read Only */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 18 }}>📧 Current Config</h2>
          {status?.configured ? (
            <table>
              <tbody>
                <tr>
                  <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13, paddingBottom: 14 }}>Gmail</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{status.mailUser}</td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13, paddingBottom: 14 }}>From Name</td>
                  <td style={{ color: '#475569' }}>{status.mailFrom || '—'}</td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13, paddingBottom: 14 }}>Password</td>
                  <td><span className="badge badge-active">Configured ✓</span></td>
                </tr>
                <tr>
                  <td style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>Provider</td>
                  <td><span className="badge badge-active">Gmail SMTP</span></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="empty" style={{ padding: '30px 0' }}>SMTP not configured</div>
          )}
          <div style={{ marginTop: 16, padding: '10px 14px', background: '#faf5ff', borderRadius: 10, border: '1px solid #ddd6fe', fontSize: 12, color: '#7c3aed' }}>
            📌 To change config, update <strong>backend/.env</strong> and restart the server
          </div>
        </div>

        {/* Test Email */}
        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 18 }}>🧪 Test Email</h2>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Send test to (optional)</label>
            <input type="email" placeholder={status?.mailUser || 'your@email.com'}
              value={testTo} onChange={e => setTestTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={sendTest}
            disabled={testing || !status?.configured}
            style={{ width: '100%', justifyContent: 'center' }}>
            {testing ? '⏳ Sending...' : '📤 Send Test Email'}
          </button>
          {!status?.configured && (
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 10, textAlign: 'center' }}>
              Configure SMTP in .env first
            </p>
          )}
          {testResult && (
            <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: testResult.success ? '#dcfce7' : '#fee2e2',
              color: testResult.success ? '#16a34a' : '#dc2626' }}>
              {testResult.success ? '✅' : '❌'} {testResult.msg}
            </div>
          )}
        </div>
      </div>

      {/* Setup Guide */}
      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 20 }}>📖 Gmail App Password — Setup Guide</h2>
        <div className="email-steps">
          {[
            { n: 1, title: 'Enable Gmail 2-Step Verification', desc: 'Google Account → Security → 2-Step Verification → Turn ON' },
            { n: 2, title: 'Generate App Password', desc: 'Google Account → Security → App Passwords → Select "Mail" + "Other" → Generate' },
            { n: 3, title: 'Update backend/.env', desc: null, code: `MAIL_USER=your@gmail.com\nMAIL_PASS=xxxx xxxx xxxx xxxx\nMAIL_FROM=Server Monitor <your@gmail.com>` },
            { n: 4, title: 'Restart the server', desc: null, code: `node server.js` },
            { n: 5, title: 'Send a Test Email', desc: 'Click "Send Test Email" above — if ✅ appears, setup is complete!' },
          ].map(s => (
            <div key={s.n} className="email-step">
              <div className="step-num">{s.n}</div>
              <div>
                <div className="step-title">{s.title}</div>
                {s.desc && <div className="step-desc">{s.desc}</div>}
                {s.code && <code className="env-code">{s.code}</code>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 18, padding: '14px 18px', background: '#faf5ff', borderRadius: 12,
          border: '1px solid #ddd6fe', fontSize: 13, color: '#7c3aed', lineHeight: 1.7 }}>
          <strong>📌 Note:</strong> Direct Gmail password won't work — use App Password only.<br />
          Gmail free tier allows <strong>500 emails/day</strong> — sufficient for monitoring alerts.
        </div>
      </div>
    </div>
  );
}
