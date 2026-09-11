import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { uploadToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export async function POST(req: NextRequest){
  const user = authenticate(req);
  if (!user) return NextResponse.json({ error:'Access denied' },{status:401});
  if (!isCloudinaryConfigured()) return NextResponse.json({ error:'Cloudinary not configured — add CLOUDINARY_* to .env.local' },{status:500});
  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error:'No file' },{status:400});
  if (file.size > 5*1024*1024) return NextResponse.json({ error:'Max 5MB' },{status:400});
  const allowed = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];
  if (!allowed.includes(file.type)) return NextResponse.json({ error:'Only image allowed' },{status:400});
  const buf = Buffer.from(await file.arrayBuffer());
  const slugBase = String(form.get('slug') || Date.now());
  const res = await uploadToCloudinary(buf, 'tasktimer/blogs', slugBase.replace(/[^a-z0-9-_]/gi,'-').slice(0,60));
  return NextResponse.json({ url: res.secure_url, public_id: res.public_id, width: res.width, height: res.height });
}
