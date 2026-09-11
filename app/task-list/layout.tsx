import { buildPageMetadata } from '@/lib/seo';
export async function generateMetadata(){ return buildPageMetadata('/task-list'); }
export default function Layout({children}:{children:React.ReactNode}){ return <>{children}</>;}
