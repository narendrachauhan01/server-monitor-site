import React, { useEffect, useState } from 'react';
import { adminGetSettings, adminUpdateSettings } from '../api';

function Toggle({ checked, onChange, disabled }) {
    return (
        <div onClick={() => !disabled && onChange(!checked)}
            style={{ width:48, height:26, borderRadius:13, background: checked ? '#7c3aed' : '#cbd5e1', cursor: disabled ? 'not-allowed' : 'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
            <div style={{ position:'absolute', top:3, left: checked ? 25 : 3, width:20, height:20, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 4px rgba(0,0,0,0.2)', transition:'left 0.2s' }} />
        </div>
    );
}

const FEATURES = [
    { key: 'domainSsl', label: 'Domain & SSL Monitoring', desc: 'View SSL certificate expiry and domain expiry dates', icon: '🔒' },
    { key: 'charts',    label: 'Performance Charts',       desc: 'View response time charts, uptime stats and alert history', icon: '📊' },
];

export default function FeatureAccess() {
    const [access, setAccess] = useState({ domainSsl: true, charts: true });
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    useEffect(() => {
        adminGetSettings().then(r => {
            if (r.data.freeTrialAccess) setAccess(r.data.freeTrialAccess);
        }).catch(() => showToast('Failed to load settings'));
    }, []);

    const toggle = (key) => setAccess(prev => ({ ...prev, [key]: !prev[key] }));

    const save = async () => {
        setSaving(true);
        try {
            await adminUpdateSettings({ freeTrialAccess: access });
            showToast('✅ Saved!');
        } catch { showToast('❌ Save failed'); }
        setSaving(false);
    };

    return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">Free Trial Feature Access</h1>
                    <p className="pg-sub">Control which features Free Trial users can access</p>
                </div>
                <button onClick={save} disabled={saving}
                    style={{ background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontWeight:700, fontSize:14, cursor:'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Saving...' : '💾 Save'}
                </button>
            </div>

            {toast && (
                <div style={{ background: toast.startsWith('✅') ? '#f0fdf4' : '#fef2f2', border:`1px solid ${toast.startsWith('✅') ? '#bbf7d0' : '#fecdd3'}`, color: toast.startsWith('✅') ? '#15803d' : '#dc2626', borderRadius:10, padding:'10px 16px', marginBottom:20, fontWeight:600, fontSize:14 }}>
                    {toast}
                </div>
            )}

            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:16 }}>🆓</span>
                    <span style={{ fontWeight:700, fontSize:15, color:'#1e1b4b' }}>Free Trial Plan</span>
                    <span style={{ fontSize:12, color:'#94a3b8', marginLeft:4 }}>Toggle to enable/disable features</span>
                </div>

                {FEATURES.map((f, i) => (
                    <div key={f.key} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom: i < FEATURES.length - 1 ? '1px solid #f1f5f9' : 'none', gap:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:44, height:44, borderRadius:12, background: access[f.key] ? '#f5f3ff' : '#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>
                                {f.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b', marginBottom:3 }}>{f.label}</div>
                                <div style={{ fontSize:13, color:'#64748b' }}>{f.desc}</div>
                            </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
                            <span style={{ fontSize:12, fontWeight:600, color: access[f.key] ? '#7c3aed' : '#94a3b8' }}>
                                {access[f.key] ? 'Allowed' : 'Blocked'}
                            </span>
                            <Toggle checked={access[f.key]} onChange={() => toggle(f.key)} />
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop:16, padding:'14px 18px', background:'#fef9ec', border:'1px solid #fde68a', borderRadius:12, fontSize:13, color:'#92400e' }}>
                💡 Changes take effect immediately for all Free Trial users. Paid plan users always have full access.
            </div>
        </div>
    );
}
