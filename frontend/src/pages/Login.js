import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';
import Toast from '../components/Toast';

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleForgot = async () => {
    setForgotLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`);
      setForgotSent(true);
      setToast({ message: 'Reset link sent to admin email!', type: 'success' });
    } catch (e) {
      setToast({ message: e.response?.data?.error || 'Failed to send reset email', type: 'error' });
    }
    setForgotLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('Please enter username and password'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, form);
      localStorage.setItem('sm_token', res.data.token);
      onLogin();
    } catch (e) {
      setError(e.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-popup">
        <div className="login-logo">
          <div className="login-logo-icon">SM</div>
          <h1 className="login-title">Server Monitor</h1>
          <p className="login-subtitle">Sign in to your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" placeholder="Enter username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              autoFocus />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div className="login-error">⚠️ {error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button type="button" className="forgot-link"
              onClick={handleForgot} disabled={forgotLoading || forgotSent}>
              {forgotLoading ? '⏳ Sending...' : forgotSent ? '✅ Reset link sent to email!' : 'Forgot Password?'}
            </button>
          </div>
        </form>

        <div className="login-footer">© 2026 <strong>Narendra Singh</strong> — DevOps Engineer</div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
