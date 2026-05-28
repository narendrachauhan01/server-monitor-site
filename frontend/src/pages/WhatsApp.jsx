import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getWaStatus, API_URL } from '../api';

const authHeaders = () => {
    const t = localStorage.getItem('sm_token') || localStorage.getItem('sm_admin_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

export default function WhatsAppPage() {
    const [info,       setInfo]       = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [form,       setForm]       = useState({ instanceId: '', apiToken: '' });
    const [saving,     setSaving]     = useState(false);
    const [testPhone,  setTestPhone]  = useState('');
    const [testing,    setTesting]    = useState(false);
    const [msg,        setMsg]        = useState('');

    const showMsg = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };

    const load = () => {
        getWaStatus()
            .then(r => {
                setInfo(r.data);
                setForm(f => ({ ...f, instanceId: r.data.instanceId || '' }));
            })
            .catch(() => setInfo({ status: 'not_configured' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const saveConfig = async (e) => {
        e.preventDefault();
        if (!form.instanceId || !form.apiToken) { showMsg('⚠️ Both fields required'); return; }
        setSaving(true);
        try {
            await axios.post(`${API_URL}/api/whatsapp/config`, form, { headers: authHeaders() });
            showMsg('✅ Credentials saved! WhatsApp is now configured.');
            load();
        } catch (err) {
            showMsg('❌ ' + (err.response?.data?.error || 'Save failed'));
        }
        setSaving(false);
    };

    const sendTest = async () => {
        if (!testPhone) { showMsg('Enter phone number'); return; }
        setTesting(true);
        try {
            await axios.post(`${API_URL}/api/whatsapp/test`, { phone: testPhone.replace(/\D/g,'') }, { headers: authHeaders() });
            showMsg('✅ Test message sent!');
        } catch (err) {
            showMsg('❌ ' + (err.response?.data?.error || 'Test failed'));
        }
        setTesting(false);
    };

    const isConnected = info?.status === 'ready' && info?.instanceState === 'authorized';
    const isWrongCreds = info?.status === 'ready' && info?.instanceState && info?.instanceState !== 'authorized';

    return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">WhatsApp Alerts</h1>
                    <p className="pg-sub">Configure Green API so users receive WhatsApp alerts when their sites go down</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', borderRadius:10,
                    background: isConnected ? '#dcfce7' : '#fef3c7',
                    color: isConnected ? '#16a34a' : '#d97706', fontWeight:700, fontSize:13 }}>
                    {loading ? '⏳ Checking...' : isConnected ? '✅ Connected' : isWrongCreds ? '❌ Wrong credentials' : '⚠️ Not configured'}
                </div>
            </div>

            {msg && (
                <div style={{ background: msg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${msg.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`,
                    color: msg.startsWith('✅') ? '#16a34a' : '#dc2626',
                    borderRadius:10, padding:'10px 16px', marginBottom:20, fontWeight:600, fontSize:14 }}>{msg}</div>
            )}

            {/* Config form */}
            <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e2e8f0', padding:24, marginBottom:20 }}>
                <div style={{ fontWeight:800, fontSize:16, color:'#1e1b4b', marginBottom:4 }}>🔑 Green API Credentials</div>
                <div style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>
                    Admin configures once → all users with phone numbers get WhatsApp alerts automatically.
                    Get credentials free at <strong>green-api.com</strong> (200 msg/month free).
                </div>

                <form onSubmit={saveConfig}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                        <div>
                            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>
                                Instance ID <span style={{color:'#ef4444'}}>*</span>
                            </label>
                            <input value={form.instanceId} onChange={e=>setForm({...form,instanceId:e.target.value})}
                                placeholder="e.g. 1234567890"
                                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>From green-api.com → My instances</div>
                        </div>
                        <div>
                            <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>
                                API Token <span style={{color:'#ef4444'}}>*</span>
                            </label>
                            <input type="password" value={form.apiToken} onChange={e=>setForm({...form,apiToken:e.target.value})}
                                placeholder="Paste your API token"
                                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>Found next to Instance ID</div>
                        </div>
                    </div>
                    <button type="submit" disabled={saving}
                        style={{ padding:'10px 28px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', opacity:saving?0.7:1 }}>
                        {saving ? 'Saving...' : '💾 Save Credentials'}
                    </button>
                </form>
            </div>

            {/* Test section */}
            <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e2e8f0', padding:24, marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b', marginBottom:12 }}>🧪 Test WhatsApp Alert</div>
                <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
                    <div style={{ flex:1 }}>
                        <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Phone number (with country code)</label>
                        <input value={testPhone} onChange={e=>setTestPhone(e.target.value)} placeholder="e.g. 919876543210"
                            style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:9, fontSize:14, outline:'none', boxSizing:'border-box' }} />
                    </div>
                    <button onClick={sendTest} disabled={testing}
                        style={{ padding:'10px 24px', background:'#10b981', color:'#fff', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', opacity:testing?0.7:1 }}>
                        {testing ? 'Sending...' : '📨 Send Test'}
                    </button>
                </div>
            </div>

            {/* How it works */}
            <div style={{ background:'#f8fafc', borderRadius:16, border:'1px solid #e2e8f0', padding:24 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b', marginBottom:16 }}>⚙️ How It Works</div>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    {[
                        { step:'1', title:'Admin configures Green API here', desc:'Enter Instance ID + Token once. The system saves it securely.' },
                        { step:'2', title:'Users add their WhatsApp number as recipient', desc:'When adding/editing a monitor, users enter their phone number.' },
                        { step:'3', title:'Alerts fire automatically', desc:'Site DOWN / UP / SSL expiry / Domain expiry → WhatsApp message sent to the user\'s number.' },
                    ].map(s => (
                        <div key={s.step} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                            <div style={{ width:28, height:28, borderRadius:'50%', background:'#7c3aed', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:13, flexShrink:0 }}>{s.step}</div>
                            <div>
                                <div style={{ fontWeight:700, fontSize:14, color:'#1e1b4b' }}>{s.title}</div>
                                <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>{s.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
