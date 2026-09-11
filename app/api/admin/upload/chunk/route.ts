import { bindings } from '@/db';
import { protectWrite } from '@/lib/admin';

const CHUNK_SIZE = 512 * 1024;
const MAX_PARTS = 100;

function validUploadId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);
}

export async function POST(request: Request) {
  const denied = await protectWrite(request);
  if (denied) return denied;
  try {
    const form = await request.formData();
    const uploadId = form.get('uploadId');
    const partNumber = Number(form.get('partNumber'));
    const totalParts = Number(form.get('totalParts'));
    const file = form.get('file');
    if (
      !validUploadId(uploadId) ||
      !Number.isInteger(partNumber) ||
      !Number.isInteger(totalParts) ||
      partNumber < 0 ||
      partNumber >= totalParts ||
      totalParts < 1 ||
      totalParts > MAX_PARTS ||
      !(file instanceof File) ||
      !file.size ||
      file.size > CHUNK_SIZE
    ) {
      return Response.json({ error: '上传分片无效' }, { status: 400 });
    }
    await bindings().MEDIA.put(
      `__upload/${uploadId}/${partNumber}`,
      new Uint8Array(await file.arrayBuffer()),
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: '分片上传失败，请重试' }, { status: 500 });
  }
}
