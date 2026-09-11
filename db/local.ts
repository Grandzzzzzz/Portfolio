import 'server-only';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { defaultContent, type Content } from '@/lib/content';

type Snapshot = { content: Content; version: number; updatedAt: string | null };
type MediaObject = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata: { contentType: string };
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const root = process.cwd();
const contentPath = path.join(root, 'content', 'site-content.json');
const mediaDirectory = path.join(root, 'public', 'uploads');

function mediaPath(key: string) {
  if (!/^(?:__upload\/)?[a-f0-9-]{36}(?:\/\d+)?$/.test(key)) throw Error('Invalid media key');
  return path.join(mediaDirectory, `${key.replaceAll('/', '-')}.bin`);
}

function metadataPath(key: string) {
  return `${mediaPath(key)}.json`;
}

async function readSnapshot(): Promise<Snapshot> {
  try {
    return JSON.parse(await readFile(contentPath, 'utf8')) as Snapshot;
  } catch {
    return { content: defaultContent, version: 0, updatedAt: null };
  }
}

export function bindings() {
  return {
    MEDIA: {
      async get(key: string): Promise<MediaObject | null> {
        try {
          const file = await readFile(mediaPath(key));
          const metadata = JSON.parse(await readFile(metadataPath(key), 'utf8')) as { contentType?: string };
          const bytes = new Uint8Array(file);
          return {
            body: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: metadata.contentType }).stream(),
            size: bytes.byteLength,
            httpEtag: `"${key}-${bytes.byteLength}"`,
            httpMetadata: { contentType: metadata.contentType ?? 'application/octet-stream' },
            arrayBuffer: async () => bytes.slice().buffer,
          };
        } catch {
          return null;
        }
      },
      async put(key: string, bytes: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) {
        await mkdir(mediaDirectory, { recursive: true });
        await writeFile(mediaPath(key), bytes);
        await writeFile(metadataPath(key), JSON.stringify({ contentType: options?.httpMetadata?.contentType ?? 'application/octet-stream' }) + '\n');
      },
      async delete(key: string) {
        await Promise.all([unlink(mediaPath(key)).catch(() => {}), unlink(metadataPath(key)).catch(() => {})]);
      },
    },
    PORTFOLIO_HOST: 'local',
    CMS_ADMIN_USER_ID: 'local',
  };
}

export async function readContent() {
  return readSnapshot();
}

export async function writeContent(content: Content, version: number): Promise<Snapshot | null> {
  const current = await readSnapshot();
  if (current.version !== version) return null;
  const next = { content, version: version + 1, updatedAt: new Date().toISOString() };
  await mkdir(path.dirname(contentPath), { recursive: true });
  await writeFile(contentPath, JSON.stringify(next, null, 2) + '\n');
  return next;
}