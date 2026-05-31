import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

export default function SupportTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter,  setFilter]  = useState('all');

    const load = async () => {
        setLoading(true);
        try {
            const r = await axios.get(`${API_URL}/api/admin/support-tickets`, { withCredentials: true });
            setTickets(r.data);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const updateTicket = async (id, data) => {
        await axios.put(`${API_URL}/api/admin/support-tickets/${id}`, data, { withCredentials: true });
        load();
    };

    const deleteTicket = async (id) => {
        if (!window.confirm('Delete this ticket?')) return;
        await axios.delete(`${API_URL}/api/admin/support-tickets/${id}`, { withCredentials: true });
        load();
    };

    const sorted = [...tickets].sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return (p[a.priority] ?? 1) - (p[b.priority] ?? 1);
    });

    const filtered = filter === 'all' ? sorted : sorted.filter(t => t.status === filter || t.priority === filter);

    const prioColor = p => p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e';
    const prioBg    = p => p === 'high' ? '#fef2f2' : p === 'medium' ? '#fffbeb' : '#f0fdf4';
    const prioLabel = p => p === 'high' ? '🔴 High' : p === 'medium' ? '🟡 Medium' : '🟢 Low';

    return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">Support Tickets <span style={{color:'#7c3aed'}}>.</span></h1>
                    <p className="pg-sub">Customer support requests — sorted by priority</p>
                </div>
                <button onClick={load} style={{ padding:'9px 18px', background:'#f1f5f9', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer' }}>🔄 Refresh</button>
            </div>

            {/* Summary */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
                {[
                    { label:'Total',   value: tickets.length,                              color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
                    { label:'🔴 High',  value: tickets.filter(t=>t.priority==='high'&&t.status!=='closed').length, color:'#dc2626', bg:'#fef2f2', border:'#fecdd3' },
                    { label:'🟡 Medium',value: tickets.filter(t=>t.priority==='medium'&&t.status!=='closed').length,color:'#b45309', bg:'#fffbeb', border:'#fde68a' },
                    { label:'🟢 Low',   value: tickets.filter(t=>t.priority==='low'&&t.status!=='closed').length,  color:'#15803d', bg:'#f0fdf4', border:'#bbf7d0' },
                    { label:'✅ Closed', value: tickets.filter(t=>t.status==='closed').length, color:'#64748b', bg:'#f8fafc', border:'#e2e8f0' },
                ].map(c => (
                    <div key={c.label} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, padding:'14px 16px', textAlign:'center' }}>
                        <div style={{ fontSize:22, fontWeight:800, color:c.color }}>{c.value}</div>
                        <div style={{ fontSize:11, color:c.color, fontWeight:600, opacity:0.8, marginTop:2 }}>{c.label}</div>
                    </div>
                ))}
            </div>

            {/* Filter pills */}
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
                {[
                    ['all','All'],['open','Open'],['replied','Replied'],['closed','Closed'],
                    ['high','🔴 High'],['medium','🟡 Medium'],['low','🟢 Low'],
                ].map(([v,l]) => (
                    <button key={v} onClick={()=>setFilter(v)}
                        style={{ padding:'6px 14px', borderRadius:20, border:'1.5px solid #e2e8f0', fontSize:12, fontWeight:700, cursor:'pointer', background: filter===v?'#7c3aed':'#fff', color: filter===v?'#fff':'#64748b', transition:'all 0.15s' }}>
                        {l}
                    </button>
                ))}
            </div>

            {/* Tickets */}
            {loading ? (
                <div style={{ padding:60, textAlign:'center', color:'#94a3b8' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e2e8f0', padding:60, textAlign:'center' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>🎧</div>
                    <div style={{ fontWeight:700, color:'#1e1b4b', fontSize:16 }}>No tickets found</div>
                    <div style={{ fontSize:13, color:'#94a3b8', marginTop:6 }}>Customer support tickets will appear here</div>
                </div>
            ) : filtered.map(t => (
                <div key={t._id} style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e2e8f0', padding:22, marginBottom:12, borderLeft:`4px solid ${prioColor(t.priority)}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                        <div style={{ flex:1 }}>
                            {/* Header */}
                            <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8, flexWrap:'wrap' }}>
                                <span style={{ fontWeight:800, fontSize:15, color:'#1e1b4b' }}>{t.subject}</span>
                                <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:prioBg(t.priority), color:prioColor(t.priority) }}>
                                    {prioLabel(t.priority)}
                                </span>
                                <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                                    background: t.status==='open'?'#eff6ff':t.status==='replied'?'#f0fdf4':'#f8fafc',
                                    color: t.status==='open'?'#1d4ed8':t.status==='replied'?'#15803d':'#64748b' }}>
                                    {t.status==='open'?'🔵 Open':t.status==='replied'?'✅ Replied':'✓ Closed'}
                                </span>
                            </div>

                            {/* User info */}
                            <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>
                                <strong style={{ color:'#374151' }}>{t.name}</strong>
                                {' · '}
                                <a href={`mailto:${t.email}`} style={{ color:'#7c3aed', textDecoration:'none' }}>{t.email}</a>
                                {' · '}
                                {new Date(t.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                            </div>

                            {/* Message */}
                            <div style={{ fontSize:13, color:'#374151', background:'#f8fafc', borderRadius:10, padding:'12px 16px', lineHeight:1.7, whiteSpace:'pre-wrap' }}>
                                {t.message}
                            </div>

                            {/* Admin Reply */}
                            {t.adminReply && (
                                <div style={{ marginTop:10, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 16px' }}>
                                    <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', marginBottom:4 }}>YOUR REPLY</div>
                                    <div style={{ fontSize:13, color:'#15803d', lineHeight:1.7 }}>{t.adminReply}</div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                            <select value={t.status} onChange={e=>updateTicket(t._id,{status:e.target.value})}
                                style={{ padding:'7px 10px', border:'1.5px solid #e2e8f0', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', background:'#fff', color:'#374151' }}>
                                <option value="open">🔵 Open</option>
                                <option value="replied">✅ Replied</option>
                                <option value="closed">✓ Closed</option>
                            </select>
                            <a href={`mailto:${t.email}?subject=Re: ${encodeURIComponent(t.subject)}`}
                                style={{ padding:'7px 14px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', borderRadius:8, fontSize:12, fontWeight:700, textDecoration:'none', textAlign:'center' }}>
                                ✉️ Reply
                            </a>
                            <button onClick={()=>deleteTicket(t._id)}
                                style={{ padding:'7px 14px', background:'#fef2f2', border:'1px solid #fecdd3', borderRadius:8, color:'#dc2626', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                                🗑 Delete
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
