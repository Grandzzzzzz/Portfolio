import 'server-only';
import { defaultContent, type Content } from '@/lib/content';

type Snapshot = { content: Content; version: number; updatedAt: string | null };
type MediaObject = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata: { contentType: string };
  arrayBuffer: () => Promise<ArrayBuffer>;
};

const media = new Map<string, { bytes: Uint8Array; contentType: string }>();
const snapshot: Snapshot = { content: defaultContent, version: 0, updatedAt: null };

export function bindings() {
  return {
    MEDIA: {
      async get(key: string): Promise<MediaObject | null> {
        const stored = media.get(key);
        if (!stored) return null;
        const bytes = stored.bytes.slice();
        return {
          body: new Blob([bytes as Uint8Array<ArrayBuffer>], { type: stored.contentType }).stream(),
          size: bytes.byteLength,
          httpEtag: `"${key}"`,
          httpMetadata: { contentType: stored.contentType },
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