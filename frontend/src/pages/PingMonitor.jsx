import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../api';
import axios from 'axios';

const MAX_RESULTS = 50;

const api = () => {
    const token = localStorage.getItem('sm_token');
    return { headers: token ? { Authorization: `Bearer ${token}` } : {} };
};

function StatusDot({ status, size = 10 }) {
    const color = status === 'up' ? '#10b981' : status === 'down' ? '#ef4444' : '#f59e0b';
    return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color, flexShrink:0 }} />;
}

function latencyColor(ms) {
    if (!ms) return '#ef4444';
    if (ms < 100) return '#10b981';
    if (ms < 300) return '#f59e0b';
    return '#ef4444';
}

export default function PingMonitor() {
    const [targets, setTargets] = useState([]);
    const [form, setForm] = useState({ name: '', host: '', port: 443 });
    const [addError, setAddError] = useState('');
    const [saving, setSaving] = useState(false);

    // Live ping state
    const [liveTarget, setLiveTarget] = useState(null);
    const [liveInterval, setLiveInterval] = useState(5);
    const [liveRunning, setLiveRunning] = useState(false);
    const [liveResults, setLiveResults] = useState([]);
    const timerRef = useRef(null);

    const loadTargets = () =>
        axios.get(`${API_URL}/api/ping-targets`, api()).then(r => setTargets(r.data)).catch(() => {});

    useEffect(() => { loadTargets(); }, []);
    useEffect(() => () => clearInterval(timerRef.current), []);

    const addTarget = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.host.trim()) { setAddError('Name and host required'); return; }
        setSaving(true); setAddError('');
        try {
            await axios.post(`${API_URL}/api/ping-targets`, form, api());
            setForm({ name: '', host: '', port: 443 });
            loadTargets();
        } catch (err) { setAddError(err.response?.data?.error || 'Failed to add'); }
        setSaving(false);
    };

    const deleteTarget = async (id) => {
        if (!window.confirm('Delete this ping target?')) return;
        await axios.delete(`${API_URL}/api/ping-targets/${id}`, api());
        loadTargets();
    };

    const togglePause = async (t) => {
        await axios.put(`${API_URL}/api/ping-targets/${t._id}`, { active: !t.active }, api());
        loadTargets();
    };

    // Live ping
    const doPing = async (host) => {
        try {
            const res = await axios.post(`${API_URL}/api/ping`, { target: host }, api());
            const row = { ...res.data, seq: Date.now() };
            setLiveResults(prev => [row, ...prev].slice(0, MAX_RESULTS));
        } catch {
            setLiveResults(prev => [{ alive: false, ms: null, seq: Date.now(), time: new Date().toISOString() }, ...prev].slice(0, MAX_RESULTS));
        }
    };

    const startLive = async (t) => {
        clearInterval(timerRef.current);
        setLiveTarget(t);
        setLiveResults([]);
        setLiveRunning(true);
        await doPing(t.host);
        timerRef.current = setInterval(() => doPing(t.host), liveInterval * 1000);
    };

    const stopLive = () => {
        clearInterval(timerRef.current);
        setLiveRunning(false);
    };

    const liveStats = liveResults.length ? {
        sent: liveResults.length,
        loss: Math.round((liveResults.filter(r => !r.alive).length / liveResults.length) * 100),
        avg: Math.round(liveResults.filter(r => r.ms).reduce((s, r) => s + r.ms, 0) / (liveResults.filter(r => r.ms).length || 1)),
        min: Math.min(...liveResults.filter(r => r.ms).map(r => r.ms)),
        max: Math.max(...liveResults.filter(r => r.ms).map(r => r.ms)),
    } : null;

    return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">Ping Monitor</h1>
                    <p className="pg-sub">Monitor connectivity for any host, IP or URL</p>
                </div>
            </div>

            {/* Add form */}
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', padding:20, marginBottom:20 }}>
                <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b', marginBottom:14 }}>➕ Add Ping Target</div>
                <form onSubmit={addTarget}>
                    <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                        <div style={{ flex:'2 1 160px' }}>
                            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Name</label>
                            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="e.g. My Server"
                                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                        </div>
                        <div style={{ flex:'3 1 200px' }}>
                            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Host / IP / URL</label>
                            <input value={form.host} onChange={e => setForm({...form, host: e.target.value})}
                                placeholder="e.g. 192.168.1.1 or mysite.com"
                                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                        </div>
                        <div style={{ flex:'1 1 90px' }}>
                            <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Port</label>
                            <input type="number" value={form.port} onChange={e => setForm({...form, port: Number(e.target.value)})}
                                style={{ width:'100%', padding:'9px 12px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:14, boxSizing:'border-box' }} />
                        </div>
                        <div style={{ display:'flex', alignItems:'flex-end' }}>
                            <button type="submit" disabled={saving}
                                style={{ padding:'9px 24px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer' }}>
                                {saving ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </div>
                    {addError && <div style={{ marginTop:8, fontSize:13, color:'#ef4444' }}>⚠️ {addError}</div>}
                </form>
            </div>

            {/* Saved targets */}
            {targets.length > 0 && (
                <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden', marginBottom:20 }}>
                    <div style={{ padding:'12px 18px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', fontWeight:700, fontSize:14, color:'#1e1b4b' }}>
                        📡 Saved Targets ({targets.length})
                    </div>
                    {targets.map(t => (
                        <div key={t._id} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderBottom:'1px solid #f1f5f9', flexWrap:'wrap' }}>
                            <StatusDot status={t.status} size={12} />
                            <div style={{ flex:1, minWidth:120 }}>
                                <div style={{ fontWeight:700, fontSize:14, color:'#1e1b4b' }}>{t.name}</div>
                                <div style={{ fontSize:12, color:'#64748b' }}>{t.host}:{t.port}</div>
                            </div>
                            <div style={{ textAlign:'center', minWidth:80 }}>
                                <div style={{ fontSize:12, color:'#94a3b8' }}>Status</div>
                                <div style={{ fontWeight:700, fontSize:13, color: t.status === 'up' ? '#10b981' : t.status === 'down' ? '#ef4444' : '#f59e0b' }}>
                                    {t.status === 'up' ? '● UP' : t.status === 'down' ? '● DOWN' : '● Unknown'}
                                </div>
                            </div>
                            <div style={{ textAlign:'center', minWidth:80 }}>
                                <div style={{ fontSize:12, color:'#94a3b8' }}>Latency</div>
                                <div style={{ fontWeight:700, fontSize:13, color: latencyColor(t.responseTime) }}>
                                    {t.responseTime ? `${t.responseTime}ms` : '—'}
                                </div>
                            </div>
                            <div style={{ textAlign:'center', minWidth:100 }}>
                                <div style={{ fontSize:12, color:'#94a3b8' }}>Last Checked</div>
                                <div style={{ fontSize:12, color:'#475569' }}>
                                    {t.lastChecked ? new Date(t.lastChecked).toLocaleTimeString('en-IN') : '—'}
                                </div>
                            </div>
                            <div style={{ display:'flex', gap:8 }}>
                                <button onClick={() => startLive(t)}
                                    style={{ padding:'6px 14px', background: liveTarget?._id === t._id && liveRunning ? '#f0fdf4' : '#f5f3ff', color: liveTarget?._id === t._id && liveRunning ? '#16a34a' : '#7c3aed', border:`1px solid ${liveTarget?._id === t._id && liveRunning ? '#bbf7d0' : '#ddd6fe'}`, borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                                    {liveTarget?._id === t._id && liveRunning ? '● Live' : '▶ Live'}
                                </button>
                                <button onClick={() => togglePause(t)}
                                    style={{ padding:'6px 12px', background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:7, fontSize:12, cursor:'pointer', color:'#64748b' }}>
                                    {t.active ? 'Pause' : 'Resume'}
                                </button>
                                <button onClick={() => deleteTarget(t._id)}
                                    style={{ padding:'6px 10px', background:'#fef2f2', border:'1px solid #fecdd3', borderRadius:7, fontSize:12, cursor:'pointer', color:'#dc2626' }}>
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Live ping panel */}
            {liveTarget && (
                <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                    <div style={{ padding:'12px 18px', background:'#f8fafc', borderBottom:'1px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:'#1e1b4b' }}>
                            📡 Live: {liveTarget.name} ({liveTarget.host})
                        </div>
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                            <select value={liveInterval} onChange={e => setLiveInterval(Number(e.target.value))} disabled={liveRunning}
                                style={{ padding:'5px 10px', border:'1px solid #e2e8f0', borderRadius:7, fontSize:13 }}>
                                {[1,2,3,5,10].map(v => <option key={v} value={v}>{v}s</option>)}
                            </select>
                            {liveRunning ? (
                                <button onClick={stopLive} style={{ padding:'6px 16px', background:'#ef4444', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>■ Stop</button>
                            ) : (
                                <button onClick={() => startLive(liveTarget)} style={{ padding:'6px 16px', background:'#7c3aed', color:'#fff', border:'none', borderRadius:8, fontWeight:700, fontSize:13, cursor:'pointer' }}>▶ Start</button>
                            )}
                        </div>
                    </div>

                    {liveStats && (
                        <div style={{ display:'flex', gap:0, borderBottom:'1px solid #f1f5f9' }}>
                            {[
                                { l:'Sent', v: liveStats.sent, c:'#374151' },
                                { l:'Loss', v: `${liveStats.loss}%`, c: liveStats.loss > 0 ? '#ef4444' : '#10b981' },
                                { l:'Avg', v: `${liveStats.avg}ms`, c: latencyColor(liveStats.avg) },
                                { l:'Min', v: liveStats.min !== Infinity ? `${liveStats.min}ms` : '—', c:'#10b981' },
                                { l:'Max', v: liveStats.max !== -Infinity ? `${liveStats.max}ms` : '—', c:'#f59e0b' },
                            ].map(s => (
                                <div key={s.l} style={{ flex:1, padding:'10px', textAlign:'center', borderRight:'1px solid #f1f5f9' }}>
                                    <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>{s.l}</div>
                                    <div style={{ fontSize:15, fontWeight:800, color:s.c }}>{s.v}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ maxHeight:'40vh', overflowY:'auto' }}>
                        {liveResults.map((r, i) => (
                            <div key={r.seq} style={{ display:'flex', alignItems:'center', gap:16, padding:'9px 18px', borderBottom:'1px solid #f8fafc', fontSize:13 }}>
                                <span style={{ width:36, color:'#94a3b8', fontFamily:'monospace', fontSize:12 }}>{liveResults.length - i}</span>
                                <StatusDot status={r.alive ? 'up' : 'down'} />
                                <span style={{ width:60, fontWeight:700, color: r.alive ? '#10b981' : '#ef4444' }}>{r.alive ? 'UP' : 'DOWN'}</span>
                                <span style={{ width:90, fontFamily:'monospace', fontWeight:700, color: latencyColor(r.ms) }}>{r.ms ? `${r.ms}ms` : '—'}</span>
                                <span style={{ color:'#94a3b8', fontSize:12 }}>{new Date(r.time).toLocaleTimeString('en-IN')}</span>
                            </div>
                        ))}
                        {liveResults.length === 0 && <div style={{ padding:24, textAlign:'center', color:'#94a3b8' }}>Starting...</div>}
                    </div>
                </div>
            )}

            {targets.length === 0 && (
                <div style={{ textAlign:'center', padding:'50px 20px', color:'#94a3b8' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>📡</div>
                    <div style={{ fontSize:16, fontWeight:600 }}>No ping targets yet</div>
                    <div style={{ fontSize:13, marginTop:6 }}>Add a host above to start monitoring</div>
                </div>
            )}
        </div>
    );
}
