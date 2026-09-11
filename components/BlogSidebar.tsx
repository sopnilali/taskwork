'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { blogs, categories } from '@/lib/blogs';
export default function BlogSidebar({ active }: { active?: string }){
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q')||'');
  const go = ()=> { const p=new URLSearchParams(); if(q) p.set('q', q); const cat=sp.get('cat'); if(cat) p.set('cat', cat); router.push(`/blog${p.toString()?'?'+p.toString():''}`); };
  return (
    <aside style={{ display:'flex', flexDirection:'column', gap:16, position:'sticky', top:84 }}>
      <div className="card"><div className="card-body">
        <div style={{ fontWeight:700, marginBottom:8, fontSize:14 }}>Search</div>
        <div style={{ display:'flex', gap:6 }}><input placeholder="Search posts..." className="form-control" style={{ flex:1 }} value={q} onChange={e=> setQ(e.target.value)} onKeyDown={e=> e.key==='Enter' && go()} /><button className="btn-primary" onClick={go}><i className="fas fa-search"/></button></div>
        {(sp.get('q')||sp.get('cat')) && <button className="btn-secondary" style={{ width:'100%', marginTop:8, fontSize:12 }} onClick={()=> router.push('/blog')}>Clear filters</button>}
      </div></div>
      <div className="card"><div className="card-body">
        <div style={{ fontWeight:700, marginBottom:8 }}>Categories</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {categories.map(c=> <Link key={c} href={`/blog?cat=${c}`} style={{ padding:'6px 10px', borderRadius:20, border:'1px solid var(--gray-200)', fontSize:12, fontWeight:600, color: active===c ? '#fff' : 'var(--gray-600)', background: active===c ? 'var(--primary)' : '#fff', textDecoration:'none' }}>{c}</Link>)}
        </div>
      </div></div>
      <div className="card"><div className="card-body">
        <div style={{ fontWeight:700, marginBottom:8 }}>Recent Posts</div>
        {blogs.slice(0,4).map(b=> <Link key={b.slug} href={`/blog/${b.slug}`} style={{ display:'block', padding:'10px 0', borderBottom:'1px solid var(--gray-100)', textDecoration:'none' }}><div style={{ fontSize:13, fontWeight:600, color:'var(--gray-800)' }}>{b.title}</div><div style={{ fontSize:11, color:'var(--gray-500)' }}>{b.date} · {b.read}</div></Link>)}
      </div></div>
      <div className="card" style={{ background:'linear-gradient(135deg,var(--primary),#8b5cf6)', color:'#fff', border:'none' }}><div className="card-body">
        <div style={{ fontWeight:800, marginBottom:6 }}>Start tracking now</div><div style={{ fontSize:13, opacity:0.9, marginBottom:10 }}>Free timer, no credit card.</div><Link href="/auth" className="btn-secondary" style={{ justifyContent:'center', width:'100%', textDecoration:'none' }}>Create account →</Link>
      </div></div>
    </aside>
  );
}
