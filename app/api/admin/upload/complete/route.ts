import { bindings } from '@/db';
import { protectWrite } from '@/lib/admin';

const MAX_SIZE = 50 * 1024 * 1024;
const MAX_PARTS = 100;

function validUploadId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);
}

function detectType(bytes: Uint8Array) {
  if (bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71)
    return { type: 'image/png', mediaType: 'image' as const };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return { type: 'image/jpeg', mediaType: 'image' as const };
  if (
    new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' &&
    new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  )
    return { type: 'image/webp', mediaType: 'image' as const };
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3)
    return { type: 'video/webm', mediaType: 'video' as const };
  if (new TextDecoder().decode(bytes.slice(4, 8)) === 'ftyp')
    return { type: 'video/mp4', mediaType: 'video' as const };
  return null;
}

export async function POST(request: Request) {
  const denied = await protectWrite(request);
  if (denied) return denied;
  try {
    const input = (await request.json()) as {
      uploadId?: unknown;
      totalParts?: unknown;
    };
    const uploadId = input.uploadId;
    const totalParts = Number(input.totalParts);
    if (
      !validUploadId(uploadId) ||
      !Number.isInteger(totalParts) ||
      totalParts < 1 ||
      totalParts > MAX_PARTS
    )
      return Response.json({ error: '上传任务无效' }, { status: 400 });

    const bucket = bindings().MEDIA;
    const chunks: Uint8Array[] = [];
    let totalSize = 0;
    for (let part = 0; part < totalParts; part++) {
      const object = await bucket.get(`__upload/${uploadId}/${part}`);
      if (!object) return Response.json({ error: '上传分片缺失，请重试' }, { status: 400 });
      const bytes = new Uint8Array(await object.arrayBuffer());
      chunks.push(bytes);
      totalSize += bytes.byteLength;
      if (totalSize > MAX_SIZE)
        return Response.json({ error: '文件不能超过 50 MB' }, { status: 413 });
    }

    const bytes = new Uint8Array(totalSize);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const detected = detectType(bytes);
    if (!detected)
      return Response.json({ error: '请上传 JPG、PNG、WebP、MP4 或 WebM 文件' }, { status: 400 });

    const id = crypto.randomUUID();
    await bucket.put(id, bytes, { httpMetadata: { contentType: detected.type } });
    await Promise.all(
      Array.from({ length: totalParts }, (_, part) =>
        bucket.delete(`__upload/${uploadId}/${part}`),
      ),
    );
    return Response.json({ url: `/api/media/${id}`, mediaType: detected.mediaType });
  } catch {
    return Response.json({ error: '上传合并失败，请重试' }, { status: 500 });
  }
}
