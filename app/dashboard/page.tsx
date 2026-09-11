'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SummaryCards from '@/components/SummaryCards';
import MiniActivityChart from '@/components/MiniActivityChart';
import ActivityPanel from '@/components/ActivityPanel';

export default function DashboardPage() {
    const { user, loading, authFetch } = useAuth();
    const router = useRouter();
    const [refreshKey] = useState(0);
    const [currentSessionSeconds] = useState(0);
    const [myBlogs, setMyBlogs] = useState<any[]>([]);
    const [showBlogForm, setShowBlogForm] = useState(false);
    const [editSlug, setEditSlug] = useState<string | null>(null);
    const [blogForm, setBlogForm] = useState({ title:'', excerpt:'', content:'', category:'Productivity', image:'', read_time:'3 min', seo_title:'', seo_description:'', seo_keywords:'', og_image:'/tasktimer-logo.svg', canonical:'', robots_index:true, robots_follow:true, published:true });
    const [blogMsg, setBlogMsg] = useState('');
    useEffect(() => {
        if (!loading && !user) router.replace('/auth');
        if (user) fetchBlogs();
    }, [user, loading, router]);
    const fetchBlogs = async () => { try{ const r = await authFetch('/api/blogs?mine=1'); const d = await r.json(); if(Array.isArray(d)) setMyBlogs(d);}catch{} };
    const pathToFocus = (p: string) => p.replace(/^\/blog\//,'').replace(/^\//,'').split(/[-_\/]+/).filter(Boolean).join(' ');
    const autoFocus = (title: string, slugOrPath: string) => {
        const fromPath = pathToFocus(slugOrPath || title);
        const fromTitle = title.toLowerCase().split(/\s+/).slice(0,4).join(' ');
        return (fromPath || fromTitle).slice(0,80);
    };
    const resetBlogForm = () => { setBlogForm({ title:'', excerpt:'', content:'', category:'Productivity', image:'', read_time:'3 min', seo_title:'', seo_description:'', seo_keywords:'', og_image:'/tasktimer-logo.svg', canonical:'', robots_index:true, robots_follow:true, published:true }); setEditSlug(null); setShowBlogForm(false); };
    const submitBlog = async () => {
        if(!blogForm.title || !blogForm.content){ setBlogMsg('Title & content required'); return; }
        const method = editSlug ? 'PUT' : 'POST';
        const url = editSlug ? `/api/blogs/${editSlug}` : '/api/blogs';
        const r = await authFetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(blogForm) });
        const d = await r.json(); if(!r.ok){ setBlogMsg(d.error||'Failed'); return; }
        setBlogMsg(editSlug?'Updated':'Created'); fetchBlogs(); resetBlogForm(); setTimeout(()=>setBlogMsg(''),2000);
    };
    const delBlog = async (slug: string) => { if(!confirm('Delete?')) return; await authFetch(`/api/blogs/${slug}`, { method:'DELETE' }); fetchBlogs(); };

    if (loading) return <div className="loading-screen"><div className="loading-logo"><i className="fas fa-clock"></i></div><div className="loading-spinner"></div><p>Loading...</p></div>;
    if (!user) return null;
    const isAdmin = Boolean(user.is_admin);

    return (
        <>
            <Header />
            <div className="dashboard-layout">
                <Sidebar />
                <div className="dashboard-main">
                    <div className="page-header">
                        <div>
                            <h1 className="page-title"><i className="fas fa-table-columns"></i> {isAdmin ? 'Dashboard' : 'My Dashboard'}</h1>
                            <p className="page-subtitle">Welcome back, {user.username} — {isAdmin ? "here's your overview" : "blog & read access"}</p>
                        </div>
                        <div className="page-header-actions">
                            {isAdmin ? (
                              <>
                                <button className="btn-primary" onClick={() => router.push('/task-work')}><i className="fas fa-play"></i> Start Working</button>
                                <button className="btn-secondary" onClick={() => router.push('/task-list')}><i className="fas fa-list"></i> View Tasks</button>
                              </>
                            ) : (
                              <>
                                <button className="btn-primary" onClick={() => router.push('/dashboard/blogs/new')}><i className="fas fa-plus"></i> New Post</button>
                                <button className="btn-secondary" onClick={() => router.push('/blog')}><i className="fas fa-book-open"></i> View Blog</button>
                              </>
                            )}
                        </div>
                    </div>
                    {isAdmin ? (
                    <>
                    <SummaryCards refreshKey={refreshKey} currentSessionSeconds={currentSessionSeconds} />
                    <MiniActivityChart />
                    <div className="dashboard-overview-grid">
                        <div className="overview-card">
                            <div className="overview-card-icon"><i className="fas fa-bolt"></i></div>
                            <h3>Quick Start</h3>
                            <p>Go to Task Work to start timer and track your work instantly</p>
                            <button className="overview-card-btn" onClick={() => router.push('/task-work')}>Go to Task Work →</button>
                        </div>
                        <div className="overview-card activity-preview">
                            <div className="overview-card-head">
                                <div className="overview-card-icon list"><i className="fas fa-list-check"></i></div>
                                <div>
                                    <h3>Your Tasks</h3>
                                    <p style={{ marginBottom: 0 }}>Activity Log</p>
                                </div>
                                <button className="overview-card-link" onClick={() => router.push('/task-list')}>View all →</button>
                            </div>
                            <div className="your-tasks-activity">
                                <ActivityPanel refreshKey={refreshKey} />
                            </div>
                        </div>
                    </div>
                    </>
                    ) : (
                    <div className="card" style={{ marginBottom:16, background:'var(--primary-light)', border:'1px solid var(--primary)' }}>
                      <div className="card-body" style={{ display:'flex', gap:12, alignItems:'center' }}>
                        <div style={{ width:36, height:36, borderRadius:8, background:'var(--primary)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="fas fa-user"/></div>
                        <div><div style={{ fontWeight:800 }}>User Mode — Blog Only</div><div style={{ fontSize:12, color:'var(--gray-600)' }}>You have blog post create + read access. Task/Payout/Admin are admin-only.</div></div>
                        <button className="btn-primary" style={{ marginLeft:'auto' }} onClick={()=> router.push('/dashboard/blogs/new')}>Create Blog Post →</button>
                      </div>
                    </div>
                    )}
                    <div id="blog-post-form" className="card" style={{ marginTop:16 }}>
                        <div className="card-body">
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
                                <h3 style={{ margin:0, fontWeight:800, fontSize:15 }}><i className="fas fa-blog" style={{ color:'var(--primary)', marginRight:6 }}/> Blog Posts — Create & SEO</h3>
                                <div style={{ display:'flex', gap:8 }}>
                                    <button className="btn-secondary" onClick={()=> window.open('/blog','_blank')}><i className="fas fa-eye"/> View Blog</button>
                                    <button id="blog-new-post-btn" className="btn-primary" onClick={()=> setShowBlogForm(v=>!v)}><i className="fas fa-plus"/> {showBlogForm?'Close':'New Post'}</button>
                                </div>
                            </div>
                            {blogMsg && <div style={{ background:'var(--success-light)', color:'var(--success)', padding:'8px 12px', borderRadius:8, fontSize:12, marginTop:10 }}>{blogMsg}</div>}
                            {showBlogForm && (
                            <div style={{ display:'grid', gap:12, marginTop:14, background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:12, padding:16 }}>
                                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
                                    <div><label className="form-label">Title *</label><input className="form-control" value={blogForm.title} onChange={e=> { const t=e.target.value; const slug=t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); const focus=autoFocus(t, slug); setBlogForm(s=> ({...s, title:t, seo_title: s.seo_title||t, seo_keywords: s.seo_keywords||focus, canonical: s.canonical||`/blog/${slug}`})); }} placeholder="Post title" /></div>
                                    <div><label className="form-label">Category</label><select className="form-select" value={blogForm.category} onChange={e=> setBlogForm({...blogForm, category:e.target.value})}><option>Productivity</option><option>Freelance</option><option>Focus</option><option>Teams</option><option>SEO</option><option>General</option></select></div>
                                </div>
                                <div><label className="form-label">Excerpt</label><textarea className="form-control" rows={2} value={blogForm.excerpt} onChange={e=> setBlogForm({...blogForm, excerpt:e.target.value, seo_description: blogForm.seo_description||e.target.value})} placeholder="Short summary 120-160 chars" /></div>
                                <div><label className="form-label">Content (HTML) *</label><textarea className="form-control" rows={5} value={blogForm.content} onChange={e=> setBlogForm({...blogForm, content:e.target.value})} placeholder="<p>Your article...</p>" /></div>
                                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                                    <div><label className="form-label">Image Emoji</label><input className="form-control" value={blogForm.image} onChange={e=> setBlogForm({...blogForm, image:e.target.value})} /></div>
                                    <div><label className="form-label">Read time</label><input className="form-control" value={blogForm.read_time} onChange={e=> setBlogForm({...blogForm, read_time:e.target.value})} placeholder="3 min" /></div>
                                    <div><label className="form-label">Published</label><select className="form-select" value={String(blogForm.published)} onChange={e=> setBlogForm({...blogForm, published:e.target.value==='true'})}><option value="true">Published</option><option value="false">Draft</option></select></div>
                                </div>
                                <div style={{ background:'#fff', border:'1px dashed var(--gray-300)', borderRadius:10, padding:12 }}>
                                    <div style={{ fontWeight:700, fontSize:12, color:'var(--primary)', marginBottom:8 }}><i className="fas fa-magnifying-glass"/> SEO Friendly — per post</div>
                                    <div style={{ display:'grid', gap:10 }}>
                                        <div><label className="form-label">SEO Title ({blogForm.seo_title.length}/120)</label><input className="form-control" value={blogForm.seo_title} onChange={e=> setBlogForm({...blogForm, seo_title:e.target.value})} placeholder="SEO title override" /></div>
                                        <div><label className="form-label">SEO Description ({blogForm.seo_description.length}/160)</label><textarea className="form-control" rows={2} value={blogForm.seo_description} onChange={e=> setBlogForm({...blogForm, seo_description:e.target.value})} placeholder="Meta description" /></div>
                                        <div><label className="form-label">SEO Keywords <span style={{ fontWeight:400, color:'var(--gray-400)', fontSize:11 }}>(Focus: {pathToFocus(blogForm.canonical || blogForm.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')) || '—'} — auto from path)</span></label><input className="form-control" value={blogForm.seo_keywords} onChange={e=> setBlogForm({...blogForm, seo_keywords:e.target.value})} placeholder="comma separated — empty = auto from path" /><div style={{ fontSize:11, color:'var(--gray-400)', marginTop:4 }}>Path focus auto: leave empty to use slug-derived keyword • Example: /blog/boost-productivity-timer → “boost productivity timer”</div></div>
                                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                                            <div><label className="form-label">OG Image</label><input className="form-control" value={blogForm.og_image} onChange={e=> setBlogForm({...blogForm, og_image:e.target.value})} /></div>
                                            <div><label className="form-label">Canonical</label><input className="form-control" value={blogForm.canonical} onChange={e=> setBlogForm({...blogForm, canonical:e.target.value})} placeholder="/blog/my-post" /></div>
                                        </div>
                                        <div style={{ display:'flex', gap:12 }}><label style={{ display:'flex', gap:6, fontSize:12, fontWeight:600 }}><input type="checkbox" checked={blogForm.robots_index} onChange={e=> setBlogForm({...blogForm, robots_index:e.target.checked})} /> Index</label><label style={{ display:'flex', gap:6, fontSize:12, fontWeight:600 }}><input type="checkbox" checked={blogForm.robots_follow} onChange={e=> setBlogForm({...blogForm, robots_follow:e.target.checked})} /> Follow</label></div>
                                    </div>
                                </div>
                                <div style={{ display:'flex', gap:8 }}>
                                    <button className="btn-primary" onClick={submitBlog}><i className="fas fa-floppy-disk"/> {editSlug?'Update':'Publish'}</button>
                                    <button className="btn-secondary" onClick={resetBlogForm}>Cancel</button>
                                </div>
                            </div>
                            )}
                            <div style={{ marginTop:14 }}>
                                {myBlogs.length===0 ? <div style={{ textAlign:'center', color:'var(--gray-400)', fontSize:13, padding:20 }}>No posts yet — create your first SEO friendly post</div> : (
                                    <div style={{ display:'grid', gap:8 }}>
                                        {myBlogs.map((b:any)=> (
                                            <div key={b.slug} className="card" style={{ border:'1px solid var(--gray-200)' }}><div className="card-body" style={{ display:'flex', gap:12, alignItems:'center', padding:'12px 14px' }}>
                                                {String(b.image).startsWith('http') ? <img src={String(b.image)} alt={b.title} style={{ width:36, height:36, borderRadius:8, objectFit:'cover', border:'1px solid var(--gray-200)' }} /> : <div style={{ width:36, height:36, borderRadius:8, background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)' }}><i className="fas fa-image"/></div>}
                                                <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.title}</div><div style={{ fontSize:11, color:'var(--gray-500)' }}>{b.category} · {b.read_time||b.read} · {b.published?'Published':'Draft'} · SEO: {b.seo_title?'✓':'–'}</div></div>
                                                <div style={{ display:'flex', gap:6 }}>
                                                    <button className="btn-secondary" style={{ padding:'6px 10px', fontSize:12 }} onClick={()=> { setEditSlug(b.slug as string); setBlogForm({ title:b.title, excerpt:b.excerpt, content:b.content, category:b.category, image:b.image, read_time:b.read_time||b.read, seo_title:b.seo_title||'', seo_description:b.seo_description||'', seo_keywords:b.seo_keywords||'', og_image:b.og_image||'', canonical:b.canonical||'', robots_index:b.robots_index!==false, robots_follow:b.robots_follow!==false, published:b.published!==false }); setShowBlogForm(true); window.scrollTo({top:600,behavior:'smooth'}); }}><i className="fas fa-pen"/></button>
                                                    <button className="btn-secondary" style={{ padding:'6px 10px', color:'var(--danger)', borderColor:'var(--danger-light)' }} onClick={()=> delBlog(b.slug as string)}><i className="fas fa-trash"/></button>
                                                    <a href={`/blog/${b.slug}`} target="_blank" className="btn-secondary" style={{ padding:'6px 10px', textDecoration:'none', fontSize:12 }}><i className="fas fa-external-link"/></a>
                                                </div>
                                            </div></div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
