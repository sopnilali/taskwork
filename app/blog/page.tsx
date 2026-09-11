import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import BlogSidebar from '@/components/BlogSidebar';
import { getBlogsFromDb } from '@/lib/blogs';
import { buildPageMetadata } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function generateMetadata(){ return buildPageMetadata('/blog'); }
export default async function BlogAll({ searchParams }: { searchParams: Promise<{ cat?: string; q?: string }> }){
  const { cat, q } = await searchParams;
  const blogs = await getBlogsFromDb(cat, q);
  return (
    <><PublicHeader />
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'30px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'end', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div><h1 style={{ fontSize:28, fontWeight:900 }}>Blog</h1><p style={{ color:'var(--gray-500)', fontSize:13 }}>Insights for freelancers and teams. {(cat||q) && <span style={{ background:'var(--primary-light)', color:'var(--primary)', padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:700, marginLeft:6 }}>{cat?`Category: ${cat}`:`Search: "${q}"`} · {blogs.length}</span>}</p></div>
          <div style={{ fontSize:12, color:'var(--gray-400)', background:'#fff', border:'1px solid var(--gray-200)', padding:'6px 10px', borderRadius:20 }}>{blogs.length} posts {cat||q ? ' (filtered)' : ''} · dynamic</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>
          <div style={{ display:'grid', gap:12 }}>
            {blogs.length===0 ? <div className="card"><div className="card-body" style={{ textAlign:'center', padding:32 }}><div style={{ fontSize:32, marginBottom:8 }}>🔍</div><div style={{ fontWeight:700 }}>No posts found</div><div style={{ fontSize:12, color:'var(--gray-500)' }}>Try different keyword or category</div></div></div> : null}
            {blogs.map(b=> (
              <Link key={b.slug} href={`/blog/${b.slug}`} style={{ textDecoration:'none' }}>
                <div className="card" style={{ transition:'all .15s' }}>
                  <div className="card-body" style={{ display:'flex', gap:14 }}>
                    {String(b.image).startsWith('http') ? <img src={String(b.image)} alt={b.title} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:'1px solid var(--gray-200)' }} /> : <div style={{ width:56, height:56, borderRadius:12, background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)' }}><i className="fas fa-image"/></div>}
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:'var(--primary)', fontWeight:700 }}>{b.category} · {b.read}</div>
                      <div style={{ fontWeight:800, color:'var(--gray-900)' }}>{b.title}</div>
                      <div style={{ color:'var(--gray-500)', fontSize:13, marginTop:4 }}>{b.excerpt}</div>
                      <div style={{ fontSize:11, color:'var(--gray-400)', marginTop:6 }}>{b.date} · {b.author}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <BlogSidebar active={cat} />
        </div>
      </main>
      <PublicFooter />
      <style>{`@media(max-width:900px){div[style*="1fr 340px"]{grid-template-columns:1fr!important}}`}</style>
    </>
  );
}
