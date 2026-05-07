import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const token = new URLSearchParams(window.location.search).get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 6) {
      setResult({ success: false, msg: 'Password must be at least 6 characters' }); return;
    }
    if (form.password !== form.confirm) {
      setResult({ success: false, msg: 'Passwords do not match' }); return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, password: form.password });
      setResult({ success: true, msg: 'Password updated! Redirecting to login...' });
      setTimeout(() => navigate('/'), 2000);
    } catch (e) {
      setResult({ success: false, msg: e.response?.data?.error || 'Failed to reset password' });
    }
    setLoading(false);
  };

  if (!token) return (
    <div className="login-overlay">
      <div className="login-popup" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
        <h2 style={{ color: '#dc2626', marginBottom: 8 }}>Invalid Link</h2>
        <p style={{ color: '#64748b' }}>This reset link is invalid or expired.</p>
        <button className="login-btn" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="login-overlay">
      <div className="login-popup">
        <div className="login-logo">
          <div className="login-logo-icon">SM</div>
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>New Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: 44 }} autoFocus />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type={showPass ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} />
          </div>

          {result && (
            <div style={{ padding: '11px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: result.success ? '#dcfce7' : '#fee2e2',
              color: result.success ? '#16a34a' : '#dc2626' }}>
              {result.success ? '✅' : '❌'} {result.msg}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading || result?.success}>
            {loading ? '⏳ Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
