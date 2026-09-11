import Link from 'next/link';
export default function PublicFooter(){
  return (
    <footer style={{ background:'#0f172a', color:'#cbd5e1', marginTop:40 }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'40px 20px', display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr 1.2fr', gap:24 }}>
        <div>
          <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}><div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,var(--primary),#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><i className="fas fa-clock"/></div><b style={{ color:'#fff' }}>TaskTimer</b></div>
          <p style={{ fontSize:13, color:'#94a3b8', lineHeight:1.6 }}>Free online task timer to track work time, hourly earnings and productivity. No setup, start in seconds.</p>
          <div style={{ display:'flex', gap:8, marginTop:12 }}><a href="#" style={{ width:32, height:32, borderRadius:8, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><i className="fab fa-github"/></a><a href="#" style={{ width:32, height:32, borderRadius:8, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><i className="fab fa-twitter"/></a><a href="#" style={{ width:32, height:32, borderRadius:8, background:'#1e293b', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}><i className="fas fa-envelope"/></a></div>
        </div>
        <div><div style={{ color:'#fff', fontWeight:700, marginBottom:10 }}>Product</div><div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}><Link href="/about" style={{ color:'#94a3b8', textDecoration:'none' }}>About</Link><Link href="/pricing" style={{ color:'#94a3b8', textDecoration:'none' }}>Pricing</Link><Link href="/blog" style={{ color:'#94a3b8', textDecoration:'none' }}>Blog</Link><Link href="/contact" style={{ color:'#94a3b8', textDecoration:'none' }}>Contact</Link></div></div>
        <div><div style={{ color:'#fff', fontWeight:700, marginBottom:10 }}>App</div><div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:13 }}><Link href="/dashboard" style={{ color:'#94a3b8', textDecoration:'none' }}>Dashboard</Link><Link href="/task-work" style={{ color:'#94a3b8', textDecoration:'none' }}>Task Work</Link><Link href="/task-list" style={{ color:'#94a3b8', textDecoration:'none' }}>Task List</Link><Link href="/auth" style={{ color:'#94a3b8', textDecoration:'none' }}>Sign In</Link></div></div>
        <div><div style={{ color:'#fff', fontWeight:700, marginBottom:10 }}>Stay updated</div><p style={{ fontSize:13, color:'#94a3b8' }}>Get productivity tips.</p><div style={{ display:'flex', gap:6, marginTop:8 }}><input placeholder="Your email" style={{ flex:1, padding:'10px 12px', borderRadius:8, border:'1px solid #334155', background:'#1e293b', color:'#fff', fontSize:13 }} /><button className="btn-primary" style={{ padding:'10px 14px' }}>Join</button></div></div>
      </div>
      <div style={{ borderTop:'1px solid #1e293b', textAlign:'center', padding:'14px 20px', fontSize:12, color:'#64748b' }}>© {new Date().getFullYear()} TaskTimer — Free Online Task Timer. All rights reserved.</div>
      <style>{`@media(max-width:900px){footer>div:first-child{grid-template-columns:1fr 1fr!important}}@media(max-width:600px){footer>div:first-child{grid-template-columns:1fr!important}}`}</style>
    </footer>
  );
}
