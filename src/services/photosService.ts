import {
  collection, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string;
const API_KEY      = import.meta.env.VITE_CLOUDINARY_API_KEY as string;
const API_SECRET   = import.meta.env.VITE_CLOUDINARY_API_SECRET as string;

export interface Photo {
  id: string;
  titulo: string;
  descricao: string;
  imageUrl: string;
  storagePath: string; // Cloudinary public_id
  createdAt: Date;
  updatedAt: Date;
  status: 'publicado' | 'oculto';
  createdBy: string;
}

export interface UploadMeta {
  titulo: string;
  descricao: string;
  status: 'publicado' | 'oculto';
  createdBy: string;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_MB = 10;

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) return 'Formato inválido. Use JPG, PNG ou WEBP.';
  if (file.size > MAX_MB * 1024 * 1024) return `Arquivo muito grande. Máximo ${MAX_MB}MB.`;
  return null;
}

export async function compressImage(file: File, maxPx = 1920, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(
        b => b ? resolve(b) : reject(new Error('Compression failed')),
        mime,
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

function cloudinaryUpload(
  blob: Blob,
  onProgress: (pct: number) => void,
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', blob);
    fd.append('upload_preset', UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        resolve({ secure_url: res.secure_url, public_id: res.public_id });
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          reject(new Error(res.error?.message ?? `Erro Cloudinary (${xhr.status})`));
        } catch {
          reject(new Error(`Erro Cloudinary (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Erro de rede no upload'));
    xhr.send(fd);
  });
}

async function sha1(message: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(message));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function cloudinaryDelete(publicId: string): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await sha1(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`);

  const fd = new FormData();
  fd.append('public_id', publicId);
  fd.append('api_key', API_KEY);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);

  await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: 'POST',
    body: fd,
  });
}

export async function uploadPhoto(
  file: File,
  meta: UploadMeta,
  onProgress: (pct: number) => void,
): Promise<void> {
  const blob = await compressImage(file);
  const { secure_url, public_id } = await cloudinaryUpload(blob, onProgress);
  await addDoc(collection(db, 'photos'), {
    ...meta,
    imageUrl: secure_url,
    storagePath: public_id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function toPhoto(d: QueryDocumentSnapshot): Photo {
  const data = d.data();
  return {
    id: d.id,
    titulo: data.titulo ?? '',
    descricao: data.descricao ?? '',
    imageUrl: data.imageUrl ?? '',
    storagePath: data.storagePath ?? '',
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    status: data.status ?? 'oculto',
    createdBy: data.createdBy ?? '',
  };
}

export async function getAllPhotos(): Promise<Photo[]> {
  const snap = await getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc')));
  return snap.docs.map(toPhoto);
}

export async function getPublicPhotos(): Promise<Photo[]> {
  const snap = await getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc')));
  return snap.docs.map(toPhoto).filter(p => p.status === 'publicado');
}

export async function updatePhoto(
  id: string,
  data: Partial<Pick<Photo, 'titulo' | 'descricao' | 'status'>>,
): Promise<void> {
  await updateDoc(doc(db, 'photos', id), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePhoto(id: string, publicId: string): Promise<void> {
  try { await cloudinaryDelete(publicId); } catch { /* already deleted */ }
  await deleteDoc(doc(db, 'photos', id));
}

export async function deletePhotoBatch(photos: Pick<Photo, 'id' | 'storagePath'>[]): Promise<void> {
  await Promise.all(photos.map(p => deletePhoto(p.id, p.storagePath)));
}
