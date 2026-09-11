import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
export const metadata = { title: 'Pricing — TaskTimer', description: 'Simple pricing for time tracking. Free forever, Pro for teams.' };
const plans = [
  { name:'Free', price:'৳0', sub:'/ forever', feats:['Unlimited tasks','Live earnings','CSV export','Daily stats'], cta:'Start Free', highlight:false },
  { name:'Pro', price:'৳499', sub:'/ month', feats:['Everything in Free','Team members','Priority support','Advanced analytics','Payout via bank'], cta:'Go Pro', highlight:true },
  { name:'Team', price:'৳1,499', sub:'/ month', feats:['Up to 25 users','Admin panel','SSO & roles','API access','Dedicated manager'], cta:'Contact Sales', highlight:false },
];
export default function Pricing(){
  return (
    <><PublicHeader />
      <main style={{ maxWidth:1100, margin:'0 auto', padding:'40px 20px', textAlign:'center' }}>
        <h1 style={{ fontSize:32, fontWeight:900 }}>Simple pricing, no surprises</h1>
        <p style={{ color:'var(--gray-500)' }}>Start free, upgrade when you earn more.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginTop:28, textAlign:'left' }}>
          {plans.map(p=> <div key={p.name} className="card" style={p.highlight ? { border:'2px solid var(--primary)', transform:'scale(1.02)' } : {}}><div className="card-body">
            <div style={{ fontWeight:800, fontSize:14 }}>{p.name}</div>
            <div style={{ margin:'10px 0' }}><span style={{ fontSize:28, fontWeight:900 }}>{p.price}</span><span style={{ color:'var(--gray-500)', fontSize:12 }}>{p.sub}</span></div>
            <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:6 }}>{p.feats.map(f=> <li key={f} style={{ fontSize:13, color:'var(--gray-600)' }}><i className="fas fa-check" style={{ color:'var(--success)', marginRight:6 }}/>{f}</li>)}</ul>
            <Link href="/auth" style={{ display:'block', textAlign:'center', marginTop:16, padding:'10px 14px', borderRadius:10, fontWeight:700, fontSize:13, textDecoration:'none', background: p.highlight ? 'var(--primary)' : '#fff', color: p.highlight ? '#fff' : 'var(--gray-800)', border: p.highlight ? 'none' : '1px solid var(--gray-200)' }}>{p.cta}</Link>
          </div></div>)}
        </div>
        <div style={{ marginTop:20, color:'var(--gray-500)', fontSize:12 }}>All plans include 7-day refund. bKash • Nagad • Rocket • Bank</div>
      </main>
      <PublicFooter />
      <style>{`@media(max-width:900px){div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}
