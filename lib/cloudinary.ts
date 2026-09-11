import { v2 as cloudinary } from 'cloudinary';

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const key = process.env.CLOUDINARY_API_KEY;
const secret = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(){
  return Boolean(cloud && key && secret);
}

export function getCloudinary(){
  if (!isCloudinaryConfigured()) throw new Error('Cloudinary not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local');
  cloudinary.config({ cloud_name: cloud!, api_key: key!, api_secret: secret!, secure: true });
  return cloudinary;
}

export async function uploadToCloudinary(buffer: Buffer, folder='tasktimer/blogs', publicId?: string){
  const c = getCloudinary();
  return new Promise<any>((resolve, reject)=>{
    const stream = c.uploader.upload_stream({ folder, public_id: publicId, resource_type:'image', transformation:[{fetch_format:'auto', quality:'auto'}] }, (err, res)=> err?reject(err):resolve(res));
    stream.end(buffer);
  });
}
