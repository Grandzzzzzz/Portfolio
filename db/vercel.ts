import 'server-only';
import contentSnapshot from '../content/site-content.json';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { type Content, validateContent } from '@/lib/content';

type Snapshot = { content: Content; version: number; updatedAt: string | null };
type MediaObject = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata: { contentType: string };
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const media = new Map<string, { bytes: Uint8Array; contentType: string }>();
const rawSnapshot = contentSnapshot as Snapshot;
const snapshot: Snapshot = { ...rawSnapshot, content: validateContent(rawSnapshot.content) };
const uploadsPath = path.join(process.cwd(), 'public', 'uploads');

export function bindings() {
  return {
    MEDIA: {
      async get(key: string): Promise<MediaObject | null> {
        let bytes: Uint8Array;
        let contentType = 'application/octet-stream';
        const stored = media.get(key);
        if (stored) {
          bytes = stored.bytes.slice();
          contentType = stored.contentType;
        } else {
          try {
            bytes = new Uint8Array(await readFile(path.join(uploadsPath, `${key}.bin`)));
            const metadata = JSON.parse(await readFile(path.join(uploadsPath, `${key}.bin.json`), 'utf8')) as { contentType?: string };
            contentType = metadata.contentType ?? contentType;
          } catch {
            return null;
          }
        }
        return {
          body: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: contentType }).stream(),
          size: bytes.byteLength,
          httpEtag: `"${key}"`,
          httpMetadata: { contentType },
          arrayBuffer: async () => bytes.slice().buffer,
        };
      },
      async put(key: string, bytes: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) {
        media.set(key, { bytes: bytes.slice(), contentType: options?.httpMetadata?.contentType ?? 'application/octet-stream' });
      },
      async delete(key: string) {
        media.delete(key);
      },
    },
    PORTFOLIO_HOST: 'vercel',
    CMS_ADMIN_USER_ID: process.env.CMS_ADMIN_USER_ID,
  };
}

export async function readContent(): Promise<Snapshot> {
  return snapshot;
}

export async function writeContent(content: Content, version: number): Promise<Snapshot | null> {
  if (snapshot.version !== version) return null;
  snapshot.content = content;
  snapshot.version += 1;
  snapshot.updatedAt = new Date().toISOString();
  return { ...snapshot };
}