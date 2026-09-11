import { buildPageMetadata } from '@/lib/seo';
export async function generateMetadata(){ return buildPageMetadata('/admin'); }
export default function Layout({children}:{children:React.ReactNode}){ return <>{children}</>;}
