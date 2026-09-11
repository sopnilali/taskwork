import { buildPageMetadata } from '@/lib/seo';
export async function generateMetadata(){ return buildPageMetadata('/auth'); }
export default function Layout({children}:{children:React.ReactNode}){ return <>{children}</>;}
