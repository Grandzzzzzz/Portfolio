'use client';

const TARGET_BYTES = 3.5 * 1024 * 1024;
const MAX_DIMENSION = 2400;

export async function prepareImageUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size <= TARGET_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    for (const quality of [0.82, 0.72, 0.62]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', quality),
      );
      if (blob && blob.size <= TARGET_BYTES) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
          type: 'image/webp',
          lastModified: file.lastModified,
        });
      }
    }
  } catch {
    // Keep the original file so the server can return the final upload error.
  }

  return file;
}
