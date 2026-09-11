'use client';
// @ts-nocheck
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import ClassicEditor from '@/components/ClassicEditor';

function pathToFocus(p:string){ return p.replace(/^\/blog\//,'').replace(/^\//,'').split(/[-_\/]+/).filter(Boolean).join(' '); }
function stripHtml(h:string){ return h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }

function analyze(form:any){
  const focus = String(form.focus_keyword || form.seo_keywords || pathToFocus(form.canonical || form.title) || '').toLowerCase().trim();
  const title = String(form.seo_title || form.title || '');
  const desc = String(form.seo_description || form.excerpt || '');
  const content = stripHtml(String(form.content||''));
  const url = String(form.canonical || '').toLowerCase();
  const words = content.split(/\s+/).filter(Boolean).length;
  const checks:{label:string, pass:boolean, weight:number}[] = [];
  const has = (t:string, f:string)=> Boolean(f) && t.toLowerCase().includes(f.toLowerCase());
  checks.push({ label:`Focus keyword in SEO Title`, pass: has(title, focus), weight:10 });
  checks.push({ label:`Focus keyword in Meta Description`, pass: has(desc, focus), weight:10 });
  checks.push({ label:`Focus keyword in URL (canonical)`, pass: has(url, focus.replace(/\s+/g,'-')), weight:10 });
  checks.push({ label:`Focus keyword in content (≥1×, density)`, pass: has(content, focus) && (content.toLowerCase().split(focus.toLowerCase()).length-1) >=1, weight:15 });
  checks.push({ label:`Content has focus in first 10%`, pass: has(content.slice(0, Math.floor(content.length*0.1)), focus), weight:10 });
  checks.push({ label:`Content length ≥300 words (${words})`, pass: words>=300, weight:10 });
  checks.push({ label:`SEO Title 50-60 chars (${title.length})`, pass: title.length>=50 && title.length<=60, weight:10 });
  checks.push({ label:`Meta Description 120-160 chars (${desc.length})`, pass: desc.length>=120 && desc.length<=160, weight:10 });
  checks.push({ label:`OG Image set`, pass: Boolean(String(form.og_image||'').trim()), weight:5 });
  checks.push({ label:`Canonical set`, pass: Boolean(String(form.canonical||'').trim()), weight:5 });
  checks.push({ label:`Image set`, pass: Boolean(String(form.image||'').trim()), weight:5 });
  const score = Math.round(checks.reduce((s,c)=> s + (c.pass?c.weight:0), 0));
  return { focus, words, checks, score };
}

export default function NewPostPage(){
  const { user, loading, authFetch } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const editSlug = sp.get('edit');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [previewTab, setPreviewTab] = useState<'google'|'facebook'>('google');
  const [form, setForm] = useState<any>({ title:'', excerpt:'', content:'', category:'Productivity', image:'', read_time:'3 min', seo_title:'', seo_description:'', seo_keywords:'', focus_keyword:'', og_image:'/tasktimer-logo.svg', canonical:'', robots_index:true, robots_follow:true, published:true });

  useEffect(()=>{ if(!loading && !user) router.replace('/auth'); },[user,loading,router]);
  useEffect(()=>{ if(editSlug) loadEdit(); },[editSlug]);
  const loadEdit = async ()=>{
    try{ const r=await authFetch(`/api/blogs/${editSlug}`); const d=await r.json(); if(r.ok) setForm({ title:d.title||'', excerpt:d.excerpt||'', content:d.content||'', category:d.category||'Productivity', image:d.image||'', read_time:d.read_time||'3 min', seo_title:d.seo_title||'', seo_description:d.seo_description||'', seo_keywords:d.seo_keywords||'', focus_keyword:d.focus_keyword||'', og_image:d.og_image||'/tasktimer-logo.svg', canonical:d.canonical||'', robots_index: d.robots_index===false?false:true, robots_follow: d.robots_follow===false?false:true, published: d.published===false?false:true }as any); }catch{}
  };

  const [uploading, setUploading] = useState(false);
  const onContentImageUpload = async (f: File):Promise<string>=>{
    const fd=new FormData(); fd.append('file', f); fd.append('slug','content-'+Date.now());
    const r=await authFetch('/api/upload',{method:'POST', body: fd as any});
    const d=await r.json(); if(!r.ok) throw new Error(d.error||'Upload failed'); return d.url;
  };
  const onUpload = async (f: File | null)=>{
    if(!f) return;
    setUploading(true); setMsg('');
    try{
      const fd = new FormData(); fd.append('file', f); fd.append('slug', form.title.toLowerCase().replace(/[^a-z0-9]+/g,'-'));
      const r = await authFetch('/api/upload', { method:'POST', body: fd as any });
      const d = await r.json();
      if(!r.ok) throw new Error(d.error||'Upload failed');
      setForm((s:any)=> ({...s, image: d.url, og_image: s.og_image==='/tasktimer-logo.svg' ? d.url : s.og_image }));
      setMsg('Image uploaded to Cloudinary');
    }catch(e:any){ setMsg(e.message);} finally{ setUploading(false); }
  };
  const onTitle = (t:string)=>{
    const slug=t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    const focus=pathToFocus(slug) || t.toLowerCase().split(/\s+/).slice(0,4).join(' ');
    setForm((s:any)=> ({...s, title:t, seo_title: s.seo_title||t, focus_keyword: s.focus_keyword||focus, seo_keywords: s.seo_keywords||focus, canonical: s.canonical||`/blog/${slug}`}));
  };

  const analysis = useMemo(()=> analyze(form), [form]);
  const scoreColor = analysis.score>=80 ? '#22c55e' : analysis.score>=50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = analysis.score>=80 ? 'Good' : analysis.score>=50 ? 'Okay' : 'Poor';

  const submit = async ()=>{
    if(!form.title || !form.content){ setMsg('Title & content required'); return; }
    setSaving(true);
    const url = editSlug ? `/api/blogs/${editSlug}` : '/api/blogs';
    const method = editSlug ? 'PUT' : 'POST';
    const payload = { ...form, seo_keywords: form.seo_keywords || form.focus_keyword || pathToFocus(form.canonical || form.title), focus_keyword: form.focus_keyword || pathToFocus(form.canonical || form.title), seo_score: analysis.score };
    const r = await authFetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const d=await r.json(); setSaving(false);
    if(!r.ok){ setMsg(d.error||'Failed'); return; }
    router.push('/dashboard/blogs');
  };

  if(loading) return <div className="loading-screen"><div className="loading-spinner"/></div>;
  if(!user) return null;

  const focusPreview = analysis.focus || '—';
  const googleUrl = `https://tasktimer.example.com${form.canonical || '/blog/your-slug'}`;

  return (
    <>
      <Header />
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-main">
          <div className="page-header">
            <div><h1 className="page-title"><i className="fas fa-plus" style={{color:'var(--primary)'}}/> {editSlug?'Edit Post':'New Post'} <span style={{ marginLeft:8, background: scoreColor, color:'#fff', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:800 }}>{analysis.score}/100 {scoreLabel}</span></h1><p className="page-subtitle">Rank Math style — focus keyword auto from path</p></div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={()=> router.push('/dashboard/blogs')}><i className="fas fa-list"/> All Posts</button>
              <button className="btn-secondary" onClick={()=> router.push('/blog')}><i className="fas fa-eye"/> View Blog</button>
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ display:'grid', gap:14 }}>
              {msg && <div style={{ background:'var(--danger-light)', color:'var(--danger)', padding:'8px 12px', borderRadius:8, fontSize:12 }}>{msg}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:12 }}>
                <div><label className="form-label">Title *</label><input className="form-control" value={form.title} onChange={e=> onTitle(e.target.value)} placeholder="e.g. Boost Productivity with Timer" /></div>
                <div><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e=> setForm({...form, category:e.target.value})}><option>Productivity</option><option>Freelance</option><option>Focus</option><option>Teams</option><option>SEO</option><option>General</option></select></div>
              </div>
              <div><label className="form-label">Excerpt</label><textarea className="form-control" rows={2} value={form.excerpt} onChange={e=> setForm({...form, excerpt:e.target.value, seo_description: form.seo_description||e.target.value})} placeholder="120-160 chars summary" /></div>
              <div><label className="form-label">Content * — Classic Editor (CMS) — {analysis.words} words</label><ClassicEditor value={form.content} onChange={v=> setForm({...form, content:v})} onImageUpload={onContentImageUpload} /></div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                <div>
                  <label className="form-label">Cover Image — Cloudinary</label>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    {form.image?.startsWith('http') ? <img src={form.image} alt="cover" style={{ width:42, height:42, borderRadius:8, objectFit:'cover', border:'1px solid var(--gray-200)' }} /> : <span style={{ width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gray-100)', borderRadius:8, color:'var(--gray-400)' }}><i className="fas fa-image"/></span>}
                    <label className="btn-secondary" style={{ cursor:'pointer', fontSize:12, margin:0 }}>
                      {uploading ? 'Uploading...' : <><i className="fas fa-cloud-arrow-up"/> Upload Thumbnail</>}
                      <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=> onUpload(e.target.files?.[0]||null)} disabled={uploading} />
                    </label>
                  </div>
                  <input className="form-control" style={{ marginTop:8 }} value={form.image} onChange={e=> setForm({...form, image:e.target.value})} placeholder="Cloudinary thumbnail URL — required" />
                </div>
                <div><label className="form-label">Read time</label><input className="form-control" value={form.read_time} onChange={e=> setForm({...form, read_time:e.target.value})} /></div>
                <div><label className="form-label">Status</label><select className="form-select" value={String(form.published)} onChange={e=> setForm({...form, published:e.target.value==='true'})}><option value="true">Published</option><option value="false">Draft</option></select></div>
              </div>

              <div style={{ background:'#fff', border:`2px solid ${scoreColor}`, borderRadius:12, padding:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:48, height:48, borderRadius:12, background: scoreColor, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14 }}>{analysis.score}</div>
                  <div><div style={{ fontWeight:800, fontSize:13, color: scoreColor }}>Rank Math — {scoreLabel}</div><div style={{ fontSize:11, color:'var(--gray-500)' }}>Focus: <b style={{ color:'var(--primary)' }}>{focusPreview}</b> (auto from path) • {analysis.checks.filter(c=>c.pass).length}/{analysis.checks.length} checks passed</div></div>
                  <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
                    <button className={`btn-secondary ${previewTab==='google'?'':''}`} style={previewTab==='google'?{background:'var(--primary)',color:'#fff'}:{}} onClick={()=> setPreviewTab('google')}>Google</button>
                    <button className={`btn-secondary ${previewTab==='facebook'?'':''}`} style={previewTab==='facebook'?{background:'var(--primary)',color:'#fff'}:{}} onClick={()=> setPreviewTab('facebook')}>Facebook</button>
                  </div>
                </div>

                {previewTab==='google' ? (
                  <div style={{ background:'#fff', border:'1px solid var(--gray-200)', borderRadius:10, padding:12, marginBottom:12 }}>
                    <div style={{ fontSize:12, color:'#202124', fontWeight:700 }}><i className="fas fa-magnifying-glass" style={{ marginRight:6, color:'var(--gray-400)' }}/> Google Preview</div>
                    <div style={{ color:'#1a0dab', fontSize:13, fontWeight:600, marginTop:6, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{form.seo_title || form.title || 'SEO Title here'} {form.seo_title.length>60 ? '— truncated' : ''}</div>
                    <div style={{ color:'#006621', fontSize:11 }}>{googleUrl}</div>
                    <div style={{ color:'#4d5156', fontSize:12, marginTop:4 }}>{form.seo_description || form.excerpt || 'Meta description will appear here. 120-160 chars ideal.'}</div>
                    <div style={{ display:'flex', gap:6, marginTop:8 }}>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:20, background: form.seo_title.length>=50 && form.seo_title.length<=60 ? 'var(--success-light)' : 'var(--danger-light)', color: form.seo_title.length>=50 && form.seo_title.length<=60 ? 'var(--success)' : 'var(--danger)', fontWeight:700 }}>{form.seo_title.length}/60</span>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:20, background: form.seo_description.length>=120 && form.seo_description.length<=160 ? 'var(--success-light)' : 'var(--danger-light)', color: form.seo_description.length>=120 && form.seo_description.length<=160 ? 'var(--success)' : 'var(--danger)', fontWeight:700 }}>{form.seo_description.length}/160</span>
                      <span style={{ fontSize:10, padding:'2px 6px', borderRadius:20, background: focusPreview!=='—' ? 'var(--success-light)' : 'var(--danger-light)', color: focusPreview!=='—' ? 'var(--success)' : 'var(--danger)', fontWeight:700 }}>Focus: {focusPreview.slice(0,20)}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ background:'#fff', border:'1px solid var(--gray-200)', borderRadius:10, padding:12, marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:700, marginBottom:6 }}><i className="fab fa-facebook" style={{ color:'#1877f2', marginRight:6 }}/> Facebook Preview</div>
                    <div style={{ border:'1px solid var(--gray-200)', borderRadius:10, overflow:'hidden', maxWidth:480 }}>
                      {form.og_image?.startsWith('http') ? <img src={form.og_image} alt="og" style={{ width:'100%', height:140, objectFit:'cover' }} /> : <div style={{ height:140, background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)' }}>No OG image</div>}
                      <div style={{ padding:10, background:'#f0f2f5' }}>
                        <div style={{ fontSize:11, color:'var(--gray-500)', textTransform:'uppercase' }}>{new URL(googleUrl).hostname}</div>
                        <div style={{ fontWeight:700, fontSize:13, color:'var(--gray-900)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{form.seo_title || form.title}</div>
                        <div style={{ fontSize:12, color:'var(--gray-500)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{form.seo_description || form.excerpt}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display:'grid', gap:6 }}>
                  <div style={{ fontWeight:700, fontSize:11, letterSpacing:0.5, color:'var(--gray-600)' }}>Content Analysis — Rank Math</div>
                  {analysis.checks.map((c,i)=> (
                    <div key={i} style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, padding:'6px 8px', borderRadius:8, background: c.pass ? 'var(--success-light)' : 'var(--danger-light)', border:`1px solid ${c.pass ? '#bbf7d0' : '#fecaca'}` }}>
                      <i className={`fas ${c.pass ? 'fa-circle-check' : 'fa-circle-xmark'}`} style={{ color: c.pass ? 'var(--success)' : 'var(--danger)' }}/>
                      <span style={{ flex:1, color: c.pass ? '#166534' : '#991b1b', fontWeight:600 }}>{c.label}</span>
                      <span style={{ fontSize:10, background:'#fff', padding:'2px 6px', borderRadius:20, fontWeight:700, color: c.pass ? 'var(--success)' : 'var(--danger)' }}>{c.pass?'Pass':'Fail'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gap:10, background:'var(--gray-50)', border:'1px solid var(--gray-200)', borderRadius:10, padding:12 }}>
                <div style={{ fontWeight:700, fontSize:11, color:'var(--gray-600)' }}><i className="fas fa-sliders"/> Additional SEO</div>
                <div><label className="form-label">Focus Keyword * (auto from path, Rank Math style)</label><input className="form-control" value={form.focus_keyword} onChange={e=> setForm({...form, focus_keyword:e.target.value, seo_keywords:e.target.value})} placeholder={`e.g. ${focusPreview}`} style={{ borderColor: form.focus_keyword ? 'var(--success)' : 'var(--danger)' }} /><div style={{ fontSize:11, color:'var(--gray-400)' }}>Path: {form.canonical || '/blog/your-slug'} → leave empty = auto “{focusPreview}”</div></div>
                <div><label className="form-label">SEO Title ({form.seo_title.length}/60 ideal 50-60)</label><input className="form-control" value={form.seo_title} onChange={e=> setForm({...form, seo_title:e.target.value})} /><div style={{ height:4, background:'var(--gray-200)', borderRadius:4, marginTop:4 }}><div style={{ height:'100%', width: Math.min(100, (form.seo_title.length/60)*100)+'%', background: form.seo_title.length>=50&&form.seo_title.length<=60 ? 'var(--success)' : 'var(--warning)', borderRadius:4 }}/></div></div>
                <div><label className="form-label">Meta Description ({form.seo_description.length}/160 ideal 120-160)</label><textarea className="form-control" rows={2} value={form.seo_description} onChange={e=> setForm({...form, seo_description:e.target.value})} /><div style={{ height:4, background:'var(--gray-200)', borderRadius:4, marginTop:4 }}><div style={{ height:'100%', width: Math.min(100, (form.seo_description.length/160)*100)+'%', background: form.seo_description.length>=120&&form.seo_description.length<=160 ? 'var(--success)' : 'var(--warning)', borderRadius:4 }}/></div></div>
                <div><label className="form-label">SEO Keywords (comma)</label><input className="form-control" value={form.seo_keywords} onChange={e=> setForm({...form, seo_keywords:e.target.value})} placeholder="task timer, productivity" /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><label className="form-label">OG Image</label><input className="form-control" value={form.og_image} onChange={e=> setForm({...form, og_image:e.target.value})} /></div>
                  <div><label className="form-label">Canonical (path)</label><input className="form-control" value={form.canonical} onChange={e=> setForm({...form, canonical:e.target.value})} placeholder="/blog/my-post" /></div>
                </div>
                <div style={{ display:'flex', gap:12 }}><label style={{ display:'flex', gap:6, fontSize:12, fontWeight:600 }}><input type="checkbox" checked={form.robots_index} onChange={e=> setForm({...form, robots_index:e.target.checked})} /> Index</label><label style={{ display:'flex', gap:6, fontSize:12, fontWeight:600 }}><input type="checkbox" checked={form.robots_follow} onChange={e=> setForm({...form, robots_follow:e.target.checked})} /> Follow</label></div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-primary" onClick={submit} disabled={saving}><i className="fas fa-floppy-disk"/> {saving?'Saving...': editSlug ? 'Update Post' : 'Publish Post'}</button>
                <button className="btn-secondary" onClick={()=> router.push('/dashboard/blogs')}>Cancel</button>
                <span style={{ marginLeft:'auto', fontSize:11, color:'var(--gray-500)', alignSelf:'center' }}>Score auto saved • Cloudinary ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
