import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { getBlogsFromDb } from '@/lib/blogs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'TaskTimer — Free Online Task Timer & Time Tracker', description: 'Free online task timer to track work time and earnings. Start in one click.' };
export default async function HomePage(){
  const blogs = await getBlogsFromDb().catch(()=> []);
  const latest = blogs.slice(0,4);
  return (
    <>
      <PublicHeader />
      <main>
        <section style={{ maxWidth:1200, margin:'0 auto', padding:'60px 20px', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:32, alignItems:'center' }}>
          <div>
            <div style={{ display:'inline-flex', gap:6, alignItems:'center', background:'var(--primary-light)', color:'var(--primary)', padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}><i className="fas fa-bolt"/> Free • No credit card • Instant start</div>
            <h1 style={{ fontSize:44, fontWeight:900, letterSpacing:-1, lineHeight:1.1, margin:'16px 0' }}>Track time.<br/>Get paid.<br/><span style={{ color:'var(--primary)' }}>Stay productive.</span></h1>
            <p style={{ color:'var(--gray-500)', fontSize:16, lineHeight:1.6 }}>TaskTimer is a free online task timer for freelancers and teams. Start/pause timers, set hourly rates and see earnings live — with daily stats and CSV export.</p>
            <div style={{ display:'flex', gap:10, marginTop:20, flexWrap:'wrap' }}><Link href="/auth" className="btn-primary" style={{ padding:'14px 20px', fontSize:15, textDecoration:'none' }}><i className="fas fa-play"/> Start Free Timer</Link><Link href="/about" className="btn-secondary" style={{ padding:'14px 20px', textDecoration:'none' }}>How it works</Link></div>
            <div style={{ display:'flex', gap:24, marginTop:20, fontSize:12, color:'var(--gray-500)' }}><span><b style={{ color:'var(--gray-800)' }}>10k+</b> timers</span><span><b style={{ color:'var(--gray-800)' }}>4.9/5</b> rating</span><span><b style={{ color:'var(--gray-800)' }}>bKash/Nagad</b> payouts</span></div>
          </div>
          <div style={{ background:'#fff', border:'1px solid var(--gray-200)', borderRadius:16, padding:20, boxShadow:'var(--shadow-lg)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}><b>Current Task</b><span style={{ fontSize:11, background:'var(--success-light)', color:'var(--success)', padding:'4px 8px', borderRadius:20, fontWeight:700 }}>● Running</span></div>
            <div style={{ fontSize:52, fontWeight:900, textAlign:'center', margin:'20px 0', letterSpacing:2 }}>02:34:18</div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}><span className="btn-primary" style={{ width:56, height:56, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}><i className="fas fa-pause"/></span><span className="btn-secondary" style={{ width:48, height:48, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}><i className="fas fa-stop" style={{ color:'var(--danger)' }}/></span></div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:20 }}>
              <div style={{ background:'var(--primary-light)', borderRadius:12, padding:12, textAlign:'center' }}><div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600 }}>TODAY</div><div style={{ fontWeight:800 }}>05h 12m</div></div>
              <div style={{ background:'#fef3c7', borderRadius:12, padding:12, textAlign:'center' }}><div style={{ fontSize:11, color:'var(--gray-500)', fontWeight:600 }}>EARNINGS</div><div style={{ fontWeight:800 }}>৳1,240</div></div>
            </div>
          </div>
        </section>
        <section style={{ background:'#fff', borderTop:'1px solid var(--gray-200)', borderBottom:'1px solid var(--gray-200)' }}>
          <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 20px', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
            {[{icon:'fa-bolt',t:'One-click timer',d:'Start, pause, resume without friction.'},{icon:'fa-coins',t:'Live earnings',d:'Hourly rate → instant BDT calculation.'},{icon:'fa-chart-line',t:'Insights',d:'Daily/weekly charts and CSV export.'},{icon:'fa-shield',t:'Admin ready',d:'Manage users, tasks and payouts.'}].map(f=> <div key={f.t} style={{ textAlign:'center' }}><div style={{ width:44, height:44, borderRadius:12, background:'var(--primary-light)', color:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}><i className={`fas ${f.icon}`}/></div><b style={{ fontSize:14 }}>{f.t}</b><div style={{ fontSize:13, color:'var(--gray-500)' }}>{f.d}</div></div>)}
          </div>
        </section>
        <section style={{ maxWidth:1200, margin:'0 auto', padding:'50px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'end', marginBottom:20, flexWrap:'wrap', gap:10 }}>
            <div><h2 style={{ fontSize:28, fontWeight:800, margin:0 }}><i className="fas fa-blog" style={{ color:'var(--primary)', marginRight:8 }}/> Latest from Blog</h2><p style={{ color:'var(--gray-500)', marginTop:4 }}>Fresh productivity tips, dynamic from dashboard</p></div>
            <Link href="/blog" className="btn-secondary" style={{ textDecoration:'none' }}>View all <i className="fas fa-arrow-right"/></Link>
          </div>
          {latest.length===0 ? (
            <div className="card"><div className="card-body" style={{ textAlign:'center', padding:32, color:'var(--gray-400)' }}><i className="fas fa-newspaper" style={{ fontSize:28, marginBottom:8 }}/><div>Blog coming soon — create your first thumbnail post from Dashboard → Blog → New Post</div></div></div>
          ) : (
            <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
              {latest.map(b=> (
                <Link key={b.slug} href={`/blog/${b.slug}`} style={{ textDecoration:'none' }}>
                  <div className="card" style={{ overflow:'hidden', height:'100%' }}>
                    {String(b.image).startsWith('http') ? <img src={String(b.image)} alt={b.title} style={{ width:'100%', height:160, objectFit:'cover' }} /> : <div style={{ height:160, background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)' }}><i className="fas fa-image" style={{ fontSize:28 }}/></div>}
                    <div className="card-body" style={{ padding:14 }}>
                      <div style={{ fontSize:11, color:'var(--primary)', fontWeight:700 }}>{b.category} · {b.read}</div>
                      <div style={{ fontWeight:800, color:'var(--gray-900)', fontSize:14, lineHeight:1.4, marginTop:4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{b.title}</div>
                      <div style={{ fontSize:12, color:'var(--gray-500)', marginTop:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{b.excerpt}</div>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:8 }}>{b.date} · {b.author}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div style={{ textAlign:'center', marginTop:20 }}>
              <Link href="/blog" className="btn-primary" style={{ padding:'10px 22px', fontSize:13, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6 }}><i className="fas fa-blog"/> Blog</Link>
            </div>
            </>
          )}
        </section>
        <section style={{ maxWidth:1200, margin:'0 auto', padding:'50px 20px', textAlign:'center' }}>
          <h2 style={{ fontSize:28, fontWeight:800 }}>Ready to track smarter?</h2>
          <p style={{ color:'var(--gray-500)' }}>Join thousands tracking billable hours with TaskTimer.</p>
          <Link href="/auth" className="btn-primary" style={{ display:'inline-flex', marginTop:14, padding:'12px 20px', textDecoration:'none' }}>Create free account →</Link>
        </section>
      </main>
      <PublicFooter />
      <style>{`@media(max-width:900px){section{grid-template-columns:1fr!important}}@media(max-width:1024px){div[style*="repeat(4,1fr)"]{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:600px){div[style*="repeat(4,1fr)"]{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}
