import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../api';

const TOPICS = [
    { value:'Account blocked / refund issue', icon:'🔒', label:'Account blocked / refund issue' },
    { value:'Payment issue',                  icon:'💳', label:'Payment issue' },
    { value:'Plan upgrade help',              icon:'🚀', label:'Plan upgrade help' },
    { value:'Technical issue',               icon:'⚙️', label:'Technical issue' },
    { value:'Billing question',              icon:'🧾', label:'Billing question' },
    { value:'Other',                         icon:'💬', label:'Other' },
];

export default function ContactSupport({ user }) {
    const [form,    setForm]    = useState({ name: user?.name||'', email: user?.email||'', subject: '', message: '' });
    const [sending, setSending] = useState(false);
    const [done,    setDone]    = useState(false);
    const [error,   setError]   = useState('');
    const [topicOpen, setTopicOpen] = useState(false);

    const send = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.subject || !form.message) { setError('All fields required'); return; }
        setSending(true); setError('');
        try {
            await axios.post(`${API_URL}/api/users/support`, form, { withCredentials: true });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send. Please email us directly.');
        }
        setSending(false);
    };

    return (
        <div className="pg-wrap">
            {/* Header */}
            <div className="pg-header">
                <div>
                    <h1 className="pg-title">Contact Support <span style={{color:'#7c3aed'}}>.</span></h1>
                    <p className="pg-sub">We typically respond within 24 hours</p>
                </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:24, alignItems:'start' }}>

                {/* Left — Form */}
                <div>
                    {done ? (
                        <div style={{ background:'#f0fdf4', border:'1.5px solid #bbf7d0', borderRadius:20, padding:48, textAlign:'center' }}>
                            <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
                            <h2 style={{ color:'#16a34a', margin:'0 0 8px', fontSize:22 }}>Message Sent!</h2>
                            <p style={{ color:'#15803d', fontSize:14, lineHeight:1.7 }}>
                                We've received your message and will respond to<br/>
                                <strong>{form.email}</strong> within 24 hours.
                            </p>
                            <button onClick={()=>{setDone(false); setForm(f=>({...f, subject:'', message:''}));}}
                                style={{ marginTop:24, padding:'11px 28px', background:'#16a34a', color:'#fff', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontSize:14 }}>
                                Send Another Message
                            </button>
                        </div>
                    ) : (
                        <div style={{ background:'#fff', borderRadius:20, border:'1.5px solid #e2e8f0', padding:32, boxShadow:'0 4px 20px rgba(0,0,0,0.05)' }}>
                            <h2 style={{ margin:'0 0 24px', fontSize:17, fontWeight:800, color:'#1e1b4b' }}>Send us a message</h2>

                            <form onSubmit={send} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                                    <div>
                                        <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Your Name *</label>
                                        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Narendra Singh"
                                            style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1e1b4b' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Email Address *</label>
                                        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="you@example.com" type="email"
                                            style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', color:'#1e1b4b' }} />
                                    </div>
                                </div>

                                <div style={{ position:'relative' }}>
                                    <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Topic *</label>
                                    <div onClick={()=>setTopicOpen(o=>!o)}
                                        style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${topicOpen?'#7c3aed':'#e2e8f0'}`, borderRadius:10, fontSize:14, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', boxSizing:'border-box', userSelect:'none' }}>
                                        {form.subject
                                            ? <span style={{ color:'#1e1b4b', fontWeight:600 }}>{TOPICS.find(t=>t.value===form.subject)?.icon} {form.subject}</span>
                                            : <span style={{ color:'#9ca3af' }}>— Select a topic —</span>
                                        }
                                        <span style={{ color:'#94a3b8', fontSize:12, transform:topicOpen?'rotate(180deg)':'none', transition:'transform 0.2s' }}>▼</span>
                                    </div>
                                    {topicOpen && (
                                        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.12)', zIndex:100, marginTop:4, overflow:'hidden' }}>
                                            {TOPICS.map(t => (
                                                <div key={t.value} onClick={()=>{ setForm({...form,subject:t.value}); setTopicOpen(false); }}
                                                    style={{ padding:'11px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:10, fontSize:14, color:'#1e1b4b', fontWeight: form.subject===t.value?700:400, background: form.subject===t.value?'#f5f3ff':'#fff', borderBottom:'1px solid #f1f5f9', transition:'background 0.1s' }}
                                                    onMouseEnter={e=>e.currentTarget.style.background='#f5f3ff'}
                                                    onMouseLeave={e=>e.currentTarget.style.background=form.subject===t.value?'#f5f3ff':'#fff'}>
                                                    <span style={{ fontSize:18 }}>{t.icon}</span>
                                                    <span>{t.label}</span>
                                                    {form.subject===t.value && <span style={{ marginLeft:'auto', color:'#7c3aed', fontWeight:800 }}>✓</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label style={{ fontSize:12, fontWeight:700, color:'#374151', display:'block', marginBottom:6 }}>Message *</label>
                                    <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})}
                                        placeholder="Describe your issue in detail — the more you share, the faster we can help." rows={6}
                                        style={{ width:'100%', padding:'11px 14px', border:'1.5px solid #e2e8f0', borderRadius:10, fontSize:14, outline:'none', resize:'vertical', boxSizing:'border-box', color:'#1e1b4b', lineHeight:1.6 }} />
                                </div>

                                {error && (
                                    <div style={{ background:'#fef2f2', border:'1px solid #fecdd3', color:'#dc2626', borderRadius:10, padding:'11px 16px', fontSize:13, fontWeight:600, display:'flex', gap:8, alignItems:'center' }}>
                                        ⚠️ {error}
                                    </div>
                                )}

                                <button type="submit" disabled={sending}
                                    style={{ padding:'13px', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:11, fontSize:15, fontWeight:700, cursor:sending?'not-allowed':'pointer', opacity:sending?0.7:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                                    {sending ? (<><span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>⏳</span> Sending...</>) : '📨 Send Message'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Right — Info */}
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                    {/* Contact info */}
                    <div style={{ background:'#fff', borderRadius:16, border:'1.5px solid #e2e8f0', padding:22, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div style={{ fontWeight:800, fontSize:14, color:'#1e1b4b', marginBottom:16 }}>Get in touch</div>
                        {[
                            { icon:'📧', label:'Email', value:'chauhan.narendrasingh.01@gmail.com', href:'mailto:chauhan.narendrasingh.01@gmail.com', color:'#ea4335' },
                            { icon:'⏱', label:'Response time', value:'Within 24 hours', href:null, color:'#7c3aed' },
                            { icon:'🕐', label:'Support hours', value:'Mon–Sat, 9am–6pm IST', href:null, color:'#0369a1' },
                        ].map(c => (
                            <div key={c.label} style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
                                <div style={{ width:36, height:36, borderRadius:10, background:`${c.color}11`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{c.icon}</div>
                                <div>
                                    <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 }}>{c.label}</div>
                                    {c.href
                                        ? <a href={c.href} style={{ fontSize:13, color:c.color, fontWeight:600, wordBreak:'break-all', textDecoration:'none' }}>{c.value}</a>
                                        : <div style={{ fontSize:13, color:'#374151', fontWeight:600 }}>{c.value}</div>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Common topics */}
                    <div style={{ background:'#f8fafc', borderRadius:16, border:'1.5px solid #e2e8f0', padding:22 }}>
                        <div style={{ fontWeight:800, fontSize:14, color:'#1e1b4b', marginBottom:12 }}>Common topics</div>
                        {[
                            '🔒 Account blocked after refund',
                            '💳 Payment not processed',
                            '🚀 Upgrade plan',
                            '⚙️ Monitoring not working',
                            '📊 Alert not received',
                        ].map(t => (
                            <div key={t} style={{ fontSize:13, color:'#475569', padding:'7px 0', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:8 }}>
                                <span>{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
