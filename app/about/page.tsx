import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
export const metadata = { title: 'About — TaskTimer', description: 'About TaskTimer — free time tracker for freelancers and teams.' };
export default function About(){
  return (
    <><PublicHeader />
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'40px 20px' }}>
        <div style={{ maxWidth:760, margin:'0 auto', textAlign:'center' }}>
          <h1 style={{ fontSize:36, fontWeight:900 }}>Built for makers, billed by the hour</h1>
          <p style={{ color:'var(--gray-500)', marginTop:8 }}>We hated spreadsheets for time tracking, so we built TaskTimer — fast, free, and focused on earnings.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:24, marginTop:36, alignItems:'center' }}>
          <div className="card"><div className="card-body"><h3 style={{ fontWeight:800, marginBottom:8 }}>Our story</h3><p style={{ color:'var(--gray-500)', fontSize:14, lineHeight:1.7 }}>From Dhaka to global, TaskTimer helps freelancers track billable hours, calculate BDT earnings live and withdraw via bKash/Nagad. Simple timer, powerful insights.</p><div style={{ display:'flex', gap:10, marginTop:14 }}><span style={{ background:'var(--primary-light)', color:'var(--primary)', padding:'6px 10px', borderRadius:20, fontSize:12, fontWeight:700 }}>2014 — Idea</span><span style={{ background:'var(--gray-100)', padding:'6px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>2025 — 10k+ users</span></div></div></div>
          <div className="card" style={{ background:'linear-gradient(135deg,var(--primary),#8b5cf6)', color:'#fff', border:'none' }}><div className="card-body"><div style={{ fontSize:28, fontWeight:900 }}>Mission</div><div style={{ opacity:0.95, fontSize:14, marginTop:6 }}>Make time tracking invisible — so you can focus on work, not worksheets.</div><div style={{ marginTop:16, display:'flex', gap:12 }}><div><div style={{ fontWeight:800, fontSize:20 }}>27%</div><div style={{ fontSize:11, opacity:0.9 }}>more accurate billing</div></div><div><div style={{ fontWeight:800, fontSize:20 }}>2 sec</div><div style={{ fontSize:11, opacity:0.9 }}>to start timer</div></div></div></div></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginTop:24 }}>
          {[{t:'Values',d:'Speed, simplicity, transparency.'},{t:'Team',d:'Small, remote, product-obsessed.'},{t:'Support',d:'We reply within hours, not days.'}].map(x=> <div key={x.t} className="card"><div className="card-body"><b>{x.t}</b><div style={{ color:'var(--gray-500)', fontSize:13, marginTop:4 }}>{x.d}</div></div></div>)}
        </div>
      </main>
      <PublicFooter />
      <style>{`@media(max-width:900px){div[style*="grid-template-columns:1.2fr"]{grid-template-columns:1fr!important}div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}
