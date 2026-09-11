import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
export const metadata = { title: 'Contact — TaskTimer', description: 'Contact TaskTimer support.' };
export default function Contact(){
  return (
    <><PublicHeader />
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'40px 20px' }}>
        <div style={{ maxWidth:820, margin:'0 auto', textAlign:'center' }}>
          <h1 style={{ fontSize:32, fontWeight:900 }}>Contact us</h1>
          <p style={{ color:'var(--gray-500)' }}>We usually reply within 2 hours.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:16, marginTop:24, maxWidth:1100, marginLeft:'auto', marginRight:'auto' }}>
          <div className="card"><div className="card-body">
            <div style={{ display:'grid', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}><div><label className="form-label">Name</label><input className="form-control" placeholder="Your name" /></div><div><label className="form-label">Email</label><input className="form-control" placeholder="you@email.com" /></div></div>
              <div><label className="form-label">Subject</label><input className="form-control" placeholder="How can we help?" /></div>
              <div><label className="form-label">Message</label><textarea className="form-control" rows={5} placeholder="Tell us more..." /></div>
              <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}><i className="fas fa-paper-plane"/> Send message</button>
            </div>
          </div></div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div className="card"><div className="card-body"><b><i className="fas fa-envelope" style={{ color:'var(--primary)', marginRight:6 }}/> Email</b><div style={{ color:'var(--gray-500)', fontSize:13 }}>support@tasktimer.example.com</div><b style={{ marginTop:10, display:'block' }}><i className="fas fa-phone" style={{ color:'var(--success)', marginRight:6 }}/> Phone</b><div style={{ color:'var(--gray-500)', fontSize:13 }}>+880 1XXX-XXXXXX</div><b style={{ marginTop:10, display:'block' }}><i className="fas fa-location-dot" style={{ color:'var(--danger)', marginRight:6 }}/> Dhaka, Bangladesh</b></div></div>
            <div className="card"><div className="card-body"><div style={{ fontWeight:700, marginBottom:6 }}>Office hours</div><div style={{ fontSize:13, color:'var(--gray-500)' }}>Sat — Thu: 10am — 7pm (BST)</div><div style={{ marginTop:10, height:120, background:'var(--gray-100)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)', fontSize:12 }}><i className="fas fa-map" style={{ marginRight:6 }}/> Map placeholder</div></div></div>
          </div>
        </div>
      </main>
      <PublicFooter />
      <style>{`@media(max-width:900px){div[style*="1.1fr 0.9fr"]{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}
