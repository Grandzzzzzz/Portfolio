'use client';

import { prepareImageUpload } from './compress-image';

const CHUNK_SIZE = 512 * 1024;

type UploadResult = { url: string; mediaType: 'image' | 'video' };

async function readResponse(response: Response) {
  const body = await response.text();
  try {
    return JSON.parse(body) as { error?: string; url?: string; mediaType?: 'image' | 'video' };
  } catch {
    throw Error(response.status === 413 ? '上传请求过大，请重试' : '上传失败，请重试');
  }
}

export async function uploadMedia(file: File): Promise<UploadResult> {
  const prepared = await prepareImageUpload(file);
  if (prepared.size > 50 * 1024 * 1024) throw Error('文件不能超过 50 MB');

  const uploadId = crypto.randomUUID();
  const totalParts = Math.ceil(prepared.size / CHUNK_SIZE);
  for (let partNumber = 0; partNumber < totalParts; partNumber++) {
    const form = new FormData();
    form.append('uploadId', uploadId);
    form.append('partNumber', String(partNumber));
    form.append('totalParts', String(totalParts));
    form.append(
      'file',
      prepared.slice(partNumber * CHUNK_SIZE, (partNumber + 1) * CHUNK_SIZE),
      prepared.name,
    );
    const response = await fetch('/api/admin/upload/chunk', {
      method: 'POST',
      body: form,
    });
    const data = await readResponse(response);
    if (!response.ok) throw Error(data.error || '分片上传失败');
  }

  const response = await fetch('/api/admin/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uploadId, totalParts }),
  });
  const data = await readResponse(response);
  if (!response.ok || !data.url || !data.mediaType)
    throw Error(data.error || '上传合并失败');
  return { url: data.url, mediaType: data.mediaType };
}
