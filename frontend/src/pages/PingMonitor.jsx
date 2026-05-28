import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { API_URL } from '../api';
import axios from 'axios';

const authHeaders = () => {
    const t = localStorage.getItem('sm_token');
    return t ? { Authorization: `Bearer ${t}` } : {};
};

const latencyColor = ms => !ms ? '#94a3b8' : ms < 100 ? '#10b981' : ms < 300 ? '#f59e0b' : '#ef4444';

function StatusPill({ status }) {
    const map = { up:['#10b981','#dcfce7','● UP'], down:['#ef4444','#fee2e2','● DOWN'], unknown:['#f59e0b','#fef3c7','● —'] };
    const [c, bg, label] = map[status] || map.unknown;
    return <span style={{ background:bg, color:c, padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700, whiteSpace:'nowrap' }}>{label}</span>;
}

// ── Target Card ───────────────────────────────────────────────────────────────
function TargetCard({ t, onClick }) {
    const barColor = t.status === 'up' ? '#10b981' : t.status === 'down' ? '#ef4444' : '#e2e8f0';
    return (
        <div className="pm-card" onClick={() => onClick(t)}>
            <div className="pm-card-bar" style={{ background: barColor }} />
            <div className="pm-card-head">
                <div>
                    <div className="pm-card-name">{t.name}</div>
                    <div className="pm-card-host">{t.host}<span className="pm-card-port">:{t.port}</span></div>
                </div>
                <StatusPill status={t.status} />
            </div>
            <div className="pm-card-stats">
                <div className="pm-stat">
                    <span className="pm-stat-label">Latency</span>
                    <span className="pm-stat-val" style={{ color: latencyColor(t.responseTime) }}>
                        {t.responseTime ? `${t.responseTime}ms` : '—'}
                    </span>
                </div>
                <div className="pm-stat">
                    <span className="pm-stat-label">Checked</span>
                    <span className="pm-stat-val" style={{ color:'#64748b', fontSize:12 }}>
                        {t.lastChecked ? new Date(t.lastChecked).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) : '—'}
                    </span>
                </div>
                <div className="pm-stat">
                    <span className="pm-stat-label">Monitor</span>
                    <span className="pm-stat-val" style={{ color: t.active ? '#10b981' : '#94a3b8', fontSize:12 }}>
                        {t.active ? 'Active' : 'Paused'}
                    </span>
                </div>
            </div>
            <div className="pm-card-footer">Click to view details & live ping</div>
        </div>
    );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ target, onClose, onDelete, onToggle }) {
    const [termLines, setTermLines] = useState([]);
    const [running, setRunning]     = useState(false);
    const timerRef = useRef(null);
    const termRef  = useRef(null);
    const seqRef   = useRef(0);

    const chartData = (target.history || []).slice(-48).map(h => ({
        time: new Date(h.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}),
        ms:   h.responseTime || 0,
    }));
    const avgMs = chartData.filter(d=>d.ms).length
        ? Math.round(chartData.filter(d=>d.ms).reduce((s,d)=>s+d.ms,0)/chartData.filter(d=>d.ms).length) : 0;
    const upPct = target.history?.length
        ? ((target.history.filter(h=>h.status==='up').length/target.history.length)*100).toFixed(1) : '—';

    const addLine = (text, color='#4ade80') => {
        setTermLines(prev => [...prev.slice(-300), { text, color, id: Date.now()+Math.random() }]);
        setTimeout(() => { if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight; }, 30);
    };

    const doPing = useCallback(async () => {
        seqRef.current += 1;
        const n = seqRef.current;
        try {
            const res = await axios.post(`${API_URL}/api/ping`,{ target:target.host, port:target.port },{ headers:authHeaders() });
            const { alive, ms } = res.data;
            if (alive) addLine(`Reply from ${target.host}: seq=${n}  time=${ms}ms  port=${target.port}`, '#4ade80');
            else       addLine(`Request timeout  seq=${n}  host=${target.host}`, '#f87171');
        } catch { addLine(`Error: unable to reach ${target.host}`, '#f87171'); }
    }, [target]);

    const startPing = async () => {
        setRunning(true);
        addLine(`PING ${target.host} port ${target.port} — interval 1s`, '#60a5fa');
        addLine('─'.repeat(50), '#1e2d3d');
        await doPing();
        timerRef.current = setInterval(doPing, 1000);
    };
    const stopPing = () => {
        clearInterval(timerRef.current);
        setRunning(false);
        addLine('─'.repeat(50), '#1e2d3d');
        addLine('Ping stopped.', '#94a3b8');
    };

    useEffect(() => () => clearInterval(timerRef.current), []);

    return (
        <div className="pm-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
            <div className="pm-modal">

                {/* Modal Header */}
                <div className="pm-modal-head">
                    <div>
                        <div className="pm-modal-title">{target.name}</div>
                        <div className="pm-modal-sub">{target.host} : {target.port}</div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <StatusPill status={target.status} />
                        <button className="pm-close-btn" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="pm-modal-body">
                    {/* Stats */}
                    <div className="pm-stats-row">
                        {[
                            { l:'Status',   v: target.status==='up' ? 'Online' : target.status==='down' ? 'Offline' : 'Unknown', c: target.status==='up' ? '#10b981' : target.status==='down' ? '#ef4444' : '#f59e0b' },
                            { l:'Latency',  v: target.responseTime ? `${target.responseTime}ms` : '—', c: latencyColor(target.responseTime) },
                            { l:'Uptime',   v: `${upPct}%`, c:'#10b981' },
                            { l:'Avg (48h)', v: avgMs ? `${avgMs}ms` : '—', c:'#7c3aed' },
                        ].map(s => (
                            <div key={s.l} className="pm-stat-box">
                                <div className="pm-stat-box-label">{s.l}</div>
                                <div className="pm-stat-box-val" style={{ color:s.c }}>{s.v}</div>
                            </div>
                        ))}
                    </div>

                    {/* Chart */}
                    <div className="pm-chart-card">
                        <div className="pm-section-title">📈 Response Time — Last 48 checks</div>
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={160}>
                                <LineChart data={chartData} margin={{top:5,right:10,left:0,bottom:0}}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                                    <XAxis dataKey="time" tick={{fontSize:10,fill:'#94a3b8'}} interval={Math.floor(chartData.length/5)} tickLine={false} axisLine={false}/>
                                    <YAxis tick={{fontSize:10,fill:'#94a3b8'}} unit="ms" tickLine={false} axisLine={false} width={42}/>
                                    <Tooltip contentStyle={{borderRadius:8,fontSize:12,border:'1px solid #e2e8f0'}} formatter={v=>[`${v}ms`,'Latency']}/>
                                    {avgMs>0 && <ReferenceLine y={avgMs} stroke="#c4b5fd" strokeDasharray="4 4" label={{value:`avg ${avgMs}ms`,position:'insideTopRight',fontSize:10,fill:'#a78bfa'}}/>}
                                    <Line type="monotone" dataKey="ms" stroke="#7c3aed" strokeWidth={2.5} dot={false} activeDot={{r:4,fill:'#7c3aed'}}/>
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="pm-empty-chart">No history yet · auto-updates every minute</div>
                        )}
                    </div>

                    {/* Terminal */}
                    <div className="pm-terminal">
                        <div className="pm-terminal-bar">
                            <div className="pm-terminal-dots">
                                <span style={{background:'#ff5f57'}}/>
                                <span style={{background:'#febc2e'}}/>
                                <span style={{background:'#28c840'}}/>
                            </div>
                            <span className="pm-terminal-title">ping {target.host}</span>
                            <div style={{display:'flex',gap:8}}>
                                <button className="pm-term-btn pm-term-clear" onClick={() => setTermLines([])}>Clear</button>
                                {!running
                                    ? <button className="pm-term-btn pm-term-start" onClick={startPing}>▶ Start</button>
                                    : <button className="pm-term-btn pm-term-stop"  onClick={stopPing}>■ Stop</button>
                                }
                            </div>
                        </div>
                        <div className="pm-terminal-body" ref={termRef}>
                            {termLines.length===0 && <div className="pm-term-placeholder">Press ▶ Start to begin live ping...</div>}
                            {termLines.map(l => <div key={l.id} style={{color:l.color}}>{l.text}</div>)}
                            {running && <div className="pm-cursor">█</div>}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pm-modal-actions">
                        <button className="pm-action-btn pm-action-pause" onClick={() => onToggle(target)}>
                            {target.active ? '⏸ Pause Monitoring' : '▶ Resume Monitoring'}
                        </button>
                        <button className="pm-action-btn pm-action-delete" onClick={() => onDelete(target._id)}>
                            🗑 Delete Target
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PingMonitor() {
    const [targets, setTargets] = useState([]);
    const [form, setForm]       = useState({ name:'', host:'', port:443 });
    const [addError, setAddError] = useState('');
    const [saving, setSaving]   = useState(false);
    const [selected, setSelected] = useState(null);
    const [search, setSearch]   = useState('');

    const load = () =>
        axios.get(`${API_URL}/api/ping-targets`,{ headers:authHeaders() }).then(r=>setTargets(r.data)).catch(()=>{});

    useEffect(() => { load(); const t=setInterval(load,30000); return ()=>clearInterval(t); }, []);

    const addTarget = async (e) => {
        e.preventDefault();
        if (!form.name.trim()||!form.host.trim()) { setAddError('Name and host required'); return; }
        setSaving(true); setAddError('');
        try {
            await axios.post(`${API_URL}/api/ping-targets`, form, { headers:authHeaders() });
            setForm({ name:'', host:'', port:443 });
            load();
        } catch (err) { setAddError(err.response?.data?.error||'Failed'); }
        setSaving(false);
    };

    const deleteTarget = async (id) => {
        if (!window.confirm('Delete this ping target?')) return;
        await axios.delete(`${API_URL}/api/ping-targets/${id}`,{ headers:authHeaders() });
        setSelected(null); load();
    };

    const toggleTarget = async (t) => {
        await axios.put(`${API_URL}/api/ping-targets/${t._id}`,{ active:!t.active },{ headers:authHeaders() });
        load();
    };

    const filtered = targets.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.host.includes(search));
    const up   = targets.filter(t=>t.status==='up').length;
    const down = targets.filter(t=>t.status==='down').length;

    return (
        <div className="pg-wrap">
            {/* Header */}
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">Ping Monitor</h1>
                    <p className="pg-sub">TCP connectivity monitoring for hosts, IPs and ports</p>
                </div>
                <div style={{ display:'flex', gap:10 }}>
                    <div className="pm-badge pm-badge-up">● {up} Up</div>
                    <div className="pm-badge pm-badge-down">● {down} Down</div>
                </div>
            </div>

            {/* Add Form */}
            <div className="pm-add-card">
                <div className="pm-add-title">➕ Add New Target</div>
                <form onSubmit={addTarget} className="pm-add-form">
                    <div className="pm-field">
                        <label>Name</label>
                        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="My Server / Router / DB" />
                    </div>
                    <div className="pm-field pm-field-host">
                        <label>Host / IP / URL</label>
                        <input value={form.host} onChange={e=>setForm({...form,host:e.target.value})} placeholder="192.168.1.1  or  mysite.com" />
                    </div>
                    <div className="pm-field pm-field-port">
                        <label>Port</label>
                        <input type="number" value={form.port} onChange={e=>setForm({...form,port:Number(e.target.value)})} />
                    </div>
                    <button type="submit" className="pm-add-btn" disabled={saving}>
                        {saving ? 'Adding...' : '+ Add'}
                    </button>
                </form>
                {addError && <div className="pm-error">⚠️ {addError}</div>}
            </div>

            {/* Search */}
            {targets.length > 3 && (
                <div className="pm-search-wrap">
                    <svg width="15" height="15" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or host..." className="pm-search" />
                </div>
            )}

            {/* Cards */}
            {filtered.length > 0 ? (
                <div className="pm-grid">
                    {filtered.map(t => <TargetCard key={t._id} t={t} onClick={setSelected} />)}
                </div>
            ) : (
                <div className="pm-empty">
                    <div className="pm-empty-icon">📡</div>
                    <div className="pm-empty-title">No targets yet</div>
                    <div className="pm-empty-sub">Add a host above to start monitoring</div>
                </div>
            )}

            {/* Modal */}
            {selected && (
                <DetailModal
                    target={targets.find(t=>t._id===selected._id)||selected}
                    onClose={()=>setSelected(null)}
                    onDelete={deleteTarget}
                    onToggle={toggleTarget}
                />
            )}
        </div>
    );
}
