import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

const TOPICS = [
    { value:'Account blocked / refund issue', icon:'🔒' },
    { value:'Payment issue',                  icon:'💳' },
    { value:'Plan upgrade help',              icon:'🚀' },
    { value:'Technical issue',               icon:'⚙️' },
    { value:'Billing question',              icon:'🧾' },
    { value:'Other',                         icon:'💬' },
];

const prioColor = p => p==='high'?'#ef4444':p==='medium'?'#f59e0b':'#22c55e';
const prioBg    = p => p==='high'?'#fef2f2':p==='medium'?'#fffbeb':'#f0fdf4';
const prioLabel = p => p==='high'?'🔴 High':p==='medium'?'🟡 Medium':'🟢 Low';
const statusColor = s => s==='open'?'#3b82f6':s==='in_progress'?'#f59e0b':s==='resolved'?'#16a34a':'#94a3b8';
const statusLabel = s => s==='open'?'Open':s==='in_progress'?'In Progress':s==='resolved'?'Resolved':'Closed';

export default function ContactSupport({ user }) {
    const [view,      setView]      = useState('list'); // 'list' | 'new' | 'detail'
    const [tickets,   setTickets]   = useState([]);
    const [selected,  setSelected]  = useState(null);
    const [loading,   setLoading]   = useState(true);
    const [reply,     setReply]     = useState('');
    const [sending,   setSending]   = useState(false);
    const [topicOpen, setTopicOpen] = useState(false);
    const [form, setForm] = useState({ subject:'', message:'', priority:'medium' });
    const [error, setError] = useState('');

    const loadTickets = async () => {
        setLoading(true);
        try {
            const r = await axios.get(`${API_URL}/api/users/support/my-tickets`, { withCredentials: true });
            setTickets(r.data);
        } catch {}
        setLoading(false);
    };

    useEffect(() => { loadTickets(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.subject || !form.message) { setError('All fields required'); return; }
        setSending(true); setError('');
        try {
            await axios.post(`${API_URL}/api/users/support`, {
                name: user?.name || 'User',
                email: user?.email || '',
                subject: form.subject,
                message: form.message,
                priority: form.priority,
            }, { withCredentials: true });
            setForm({ subject:'', message:'', priority:'medium' });
            setView('list');
            loadTickets();
        } catch (err) { setError(err.response?.data?.error || 'Failed to submit'); }
        setSending(false);
    };

    const sendReply = async () => {
        if (!reply.trim()) return;
        setSending(true);
        try {
            const r = await axios.post(`${API_URL}/api/users/support/${selected._id}/reply`, { message: reply }, { withCredentials: true });
            setSelected(r.data);
            setReply('');
            loadTickets();
        } catch {}
        setSending(false);
    };

    const openDetail = (t) => { setSelected(t); setView('detail'); };

    // ── List view ─────────────────────────────────────────────────────────────
    if (view === 'list') return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">Support <span style={{color:'#7c3aed'}}>.</span></h1>
                    <p className="pg-sub">Raise a ticket — our team will respond shortly</p>
                </div>
                <button onClick={()=>setView('new')} style={{ padding:'10px 22px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
                    + New Ticket
                </button>
            </div>

            {loading ? (
                <div style={{ padding:40, textAlign:'center', color:'#94a3b8' }}>Loading...</div>
            ) : tickets.length === 0 ? (
                <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e2e8f0', padding:60, textAlign:'center' }}>
                    <div style={{ fontSize:56, marginBottom:16 }}>🎧</div>
                    <div style={{ fontWeight:800, fontSize:18, color:'#1e1b4b', marginBottom:8 }}>No tickets yet</div>
                    <div style={{ fontSize:14, color:'#94a3b8', marginBottom:24 }}>Need help? Raise a support ticket and our team will assist you.</div>
                    <button onClick={()=>setView('new')} style={{ padding:'11px 28px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer' }}>
                        + Raise a Ticket
                    </button>
                </div>
            ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {tickets.map(t => (
                        <div key={t._id} onClick={()=>openDetail(t)} style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e2e8f0', padding:'16px 20px', cursor:'pointer', borderLeft:`4px solid ${prioColor(t.priority)}`, display:'flex', alignItems:'center', gap:16, transition:'box-shadow 0.15s' }}
                            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                            onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                            <div style={{ flex:1 }}>
                                <div style={{ fontWeight:700, fontSize:15, color:'#1e1b4b', marginBottom:4 }}>{t.subject}</div>
                                <div style={{ fontSize:12, color:'#94a3b8' }}>
                                    {new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                                    {t.replies?.length > 0 && <span style={{ marginLeft:8 }}>· {t.replies.length} repl{t.replies.length===1?'y':'ies'}</span>}
                                </div>
                            </div>
                            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:prioBg(t.priority), color:prioColor(t.priority) }}>{prioLabel(t.priority)}</span>
                                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${statusColor(t.status)}15`, color:statusColor(t.status) }}>{statusLabel(t.status)}</span>
                                <span style={{ color:'#94a3b8' }}>→</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ── New ticket form ────────────────────────────────────────────────────────
    if (view === 'new') return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <button onClick={()=>setView('list')} style={{ background:'none', border:'none', color:'#7c3aed', fontWeight:700, cursor:'pointer', fontSize:14 }}>← Back</button>
                    <h1 className="pg-title" style={{ marginTop:8 }}>New Ticket <span style={{color:'#7c3aed'}}>.</span></h1>
                </div>
            </div>
            <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e2e8f0', padding:32, maxWidth:600 }}>
                <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                    {/* Topic */}
                    <div style={{ position:'relative' }}>
                        <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Topic *</label>
                        <div onClick={()=>setTopicOpen(o=>!o)} style={{ padding:'11px 14px', border:`1.5px solid ${topicOpen?'#7c3aed':'#e2e8f0'}`, borderRadius:10, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff' }}>
                            {form.subject ? <span style={{ fontWeight:600, color:'#1e1b4b' }}>{TOPICS.find(t=>t.value===form.subject)?.icon} {form.subject}</span> : <span style={{ color:'#9ca3af' }}>— Select topic —</span>}
                            <span style={{ color:'#94a3b8', transform:topicOpen?'rotate(180deg)':'none', transition:'transform 0.2s' }}>▼</span>
                        </div>
                        {topicOpen && (
                            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, marginTop:4, overflow:'hidden' }}>
                                {TOPICS.map(t => (
                                    <div key={t.value} onClick={()=>{ setForm({...form,subject:t.value}); setTopicOpen(false); }}
                                        style={{ padding:'11px 16px', cursor:'pointer', display:'flex', gap:10, fontSize:14, color:'#1e1b4b', fontWeight:form.subject===t.value?700:400, background:form.subject===t.value?'#f5f3ff':'#fff', borderBottom:'1px solid #f1f5f9' }}>
                                        <span>{t.icon}</span><span>{t.value}</span>
                                        {form.subject===t.value && <span style={{ marginLeft:'auto', color:'#7c3aed' }}>✓</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Priority */}
                    <div>
                        <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>Priority *</label>
                        <div style={{ display:'flex', gap:8 }}>
                            {[{v:'low',l:'🟢 Low',c:'#16a34a'},{v:'medium',l:'🟡 Medium',c:'#f59e0b'},{v:'high',l:'🔴 High',c:'#ef4444'}].map(p => (
                                <button key={p.v} type="button" onClick={()=>setForm({...form,priority:p.v})}
                                    style={{ flex:1, padding:'10px', border:`2px solid ${form.priority===p.v?p.c:'#e2e8f0'}`, borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', background:form.priority===p.v?p.c:'#fff', color:form.priority===p.v?'#fff':p.c, transition:'all 0.15s' }}>
                                    {p.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Message */}
                    <div>
                        <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Message *</label>
                        <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} rows={6}
                            placeholder="Describe your issue in detail..." style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }} />
                    </div>

                    {error && <div style={{ background:'#fef2f2', border:'1px solid #fecdd3', color:'#dc2626', borderRadius:8, padding:'10px 14px', fontSize:13, fontWeight:600 }}>⚠️ {error}</div>}

                    <button type="submit" disabled={sending} style={{ padding:'13px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:11, fontSize:15, fontWeight:700, cursor:'pointer', opacity:sending?0.7:1 }}>
                        {sending ? '⏳ Submitting...' : '🎫 Submit Ticket'}
                    </button>
                </form>
            </div>
        </div>
    );

    // ── Ticket detail + thread ─────────────────────────────────────────────────
    if (view === 'detail' && selected) return (
        <div className="pg-wrap">
            <div className="pg-header">
                <div>
                    <button onClick={()=>setView('list')} style={{ background:'none', border:'none', color:'#7c3aed', fontWeight:700, cursor:'pointer', fontSize:14 }}>← My Tickets</button>
                    <h1 className="pg-title" style={{ marginTop:8 }}>{selected.subject} <span style={{color:'#7c3aed'}}>.</span></h1>
                    <div style={{ display:'flex', gap:8, marginTop:6 }}>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:prioBg(selected.priority), color:prioColor(selected.priority) }}>{prioLabel(selected.priority)}</span>
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${statusColor(selected.status)}15`, color:statusColor(selected.status) }}>{statusLabel(selected.status)}</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth:700 }}>
                {/* Thread */}
                <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
                    {/* Original message */}
                    <div style={{ background:'#f5f3ff', borderRadius:14, padding:18, borderLeft:'4px solid #7c3aed' }}>
                        <div style={{ fontSize:12, color:'#7c3aed', fontWeight:700, marginBottom:6 }}>YOU · {new Date(selected.createdAt).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                        <div style={{ fontSize:14, color:'#1e1b4b', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{selected.message}</div>
                    </div>

                    {/* Replies */}
                    {selected.replies?.map((r, i) => (
                        <div key={i} style={{ background: r.from==='admin'?'#f0fdf4':'#f5f3ff', borderRadius:14, padding:18, borderLeft:`4px solid ${r.from==='admin'?'#16a34a':'#7c3aed'}`, alignSelf: r.from==='admin'?'flex-start':'flex-end', maxWidth:'90%' }}>
                            <div style={{ fontSize:12, color: r.from==='admin'?'#16a34a':'#7c3aed', fontWeight:700, marginBottom:6 }}>
                                {r.from==='admin'?'🛡 SUPPORT TEAM':'YOU'} · {new Date(r.at).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                            </div>
                            <div style={{ fontSize:14, color:'#1e1b4b', lineHeight:1.7, whiteSpace:'pre-wrap' }}>{r.message}</div>
                        </div>
                    ))}

                    {selected.status === 'open' && !selected.replies?.length && (
                        <div style={{ textAlign:'center', padding:20, color:'#94a3b8', fontSize:13 }}>
                            ⏳ Waiting for support team to respond...
                        </div>
                    )}
                </div>

                {/* Reply box — only if not closed */}
                {selected.status !== 'closed' && (
                    <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e2e8f0', padding:20 }}>
                        <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:8 }}>Add Reply</label>
                        <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={4}
                            placeholder="Write your reply..." style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box', marginBottom:10 }} />
                        <button onClick={sendReply} disabled={sending||!reply.trim()} style={{ padding:'10px 24px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', opacity:(!reply.trim()||sending)?0.5:1 }}>
                            {sending?'Sending...':'Send Reply'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return null;
}
