import Link from 'next/link';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import BlogSidebar from '@/components/BlogSidebar';
import { getBlogFromDb } from '@/lib/blogs';
import { getSeoSettings, DEFAULT_SEO } from '@/lib/seo';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const b = await getBlogFromDb(slug);
  if(!b) return { title:'Post not found' };
  const seo = await getSeoSettings().catch(()=> DEFAULT_SEO);
  const title = (b as any).seo_title || b.title;
  const desc = (b as any).seo_description || b.excerpt;
  const kw = (b as any).seo_keywords || b.category;
  return { title: { absolute: title + ' — TaskTimer Blog' }, description: desc, keywords: kw.split(',').map((k:string)=>k.trim()), openGraph:{ title, description:desc, url: seo.site_url + ((b as any).canonical || `/blog/${slug}`), images:[(b as any).og_image || '/tasktimer-logo.svg'] }, twitter:{ card:'summary_large_image' as const, title, description:desc }, robots:{ index:(b as any).robots_index!==false, follow:(b as any).robots_follow!==false }, alternates:{ canonical: (b as any).canonical || `/blog/${slug}` } };
}
export default async function BlogSingle({ params }: { params: Promise<{ slug: string }> }){
  const { slug } = await params;
  const post = await getBlogFromDb(slug);
  if(!post) return <><PublicHeader /><main style={{ maxWidth:1200, margin:'0 auto', padding:'40px 20px' }}><div className="card"><div className="card-body" style={{ textAlign:'center' }}>Post not found — <Link href="/blog">Back to blog</Link></div></div></main><PublicFooter /></>;
  return (
    <><PublicHeader />
      <main style={{ maxWidth:1200, margin:'0 auto', padding:'30px 20px' }}>
        <div style={{ marginBottom:12 }}><Link href="/blog" style={{ fontSize:13, color:'var(--primary)', textDecoration:'none' }}><i className="fas fa-arrow-left"/> Back to blog</Link></div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start' }}>
          <article className="card"><div className="card-body">
            <div style={{ fontSize:12, color:'var(--primary)', fontWeight:700 }}>{post.category} · {post.read} · {post.date}</div>
            <h1 style={{ fontSize:26, fontWeight:900, margin:'8px 0' }}>{post.title}</h1>
            <div style={{ fontSize:12, color:'var(--gray-500)', marginBottom:14 }}>By {post.author}</div>
            {String(post.image).startsWith('http') ? <img src={String(post.image)} alt={post.title} style={{ width:'100%', height:260, borderRadius:12, objectFit:'cover', border:'1px solid var(--gray-200)', marginBottom:16 }} /> : <div style={{ width:'100%', height:160, borderRadius:12, background:'var(--gray-100)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--gray-400)', marginBottom:16 }}><i className="fas fa-image" style={{ fontSize:32 }}/></div>}
            <div style={{ fontSize:14, color:'var(--gray-700)', lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: post.content }} />
            <div style={{ marginTop:20, paddingTop:16, borderTop:'1px solid var(--gray-100)', display:'flex', gap:8 }}>
              <Link href="/blog" className="btn-secondary" style={{ textDecoration:'none' }}>← All posts</Link><Link href="/auth" className="btn-primary" style={{ textDecoration:'none' }}>Start tracking →</Link>
            </div>
          </div></article>
          <BlogSidebar active={post.category} />
        </div>
      </main>
      <PublicFooter />
      <style>{`@media(max-width:900px){div[style*="1fr 340px"]{grid-template-columns:1fr!important}}article h3{margin:14px 0 6px;font-size:15;font-weight:800}article ul{padding-left:18px}article blockquote{border-left:3px solid var(--primary);padding:8px 12px;background:var(--gray-50);border-radius:8;margin:12px 0;font-style:italic}`}</style>
    </>
  );
}
