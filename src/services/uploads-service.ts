const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const FOLDER = 'citypay/reports';

/**
 * Uploads a local photo to Cloudinary with the unsigned preset and returns its public URL.
 * Throws instead of returning the local file:// URI: that path only exists on this phone
 * and used to be stored in the database as if it were evidence.
 */
export async function uploadPhoto(uri: string): Promise<string> {
  if (/^https?:\/\//.test(uri)) return uri;
  if (!CLOUD_NAME || !PRESET) throw new Error('Falta configurar Cloudinary para subir fotos.');

  const name = uri.split('/').pop() || `foto_${Date.now()}.jpg`;
  const ext = /\.(\w+)$/.exec(name)?.[1]?.toLowerCase() ?? 'jpeg';
  const form = new FormData();
  // React Native's FormData accepts { uri, name, type } for files.
  form.append('file', { uri, name, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` } as unknown as Blob);
  form.append('upload_preset', PRESET);
  form.append('folder', FOLDER);

  let res: Response;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form });
  } catch {
    throw new Error('No se pudieron subir las fotos. Revisa tu conexión.');
  }
  if (!res.ok) throw new Error('El servidor de imágenes rechazó una foto. Intenta con otra imagen.');
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('No se recibió la dirección de la foto subida.');
  return data.secure_url;
}
