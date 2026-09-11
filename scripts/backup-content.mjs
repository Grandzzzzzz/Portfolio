import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const base = process.env.PORTFOLIO_LOCAL_URL || 'http://localhost:3000';
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
  throw Error('Backup source must be local.');
const snapshot = await fetch(new URL('/api/content', base)).then(async (r) => {
  if (!r.ok) throw Error('Cannot read local content');
  return r.json();
});
const content = snapshot.content ?? snapshot;
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const directory = path.resolve('.backups', stamp);
await mkdir(path.join(directory, 'media'), { recursive: true });
const keys = new Set();
function collect(value) {
  if (typeof value === 'string' && /^\/api\/media\/[a-f0-9-]{36}$/.test(value))
    keys.add(value.slice('/api/media/'.length));
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object')
    Object.values(value).forEach(collect);
}
collect(content);
const media = [];
for (const key of keys) {
  const response = await fetch(new URL('/api/media/' + key, base));
  if (!response.ok) throw Error(`Cannot back up image ${key}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await writeFile(path.join(directory, 'media', key), bytes);
  media.push({
    key,
    type: response.headers.get('content-type'),
    size: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
}
await writeFile(
  path.join(directory, 'content.json'),
  JSON.stringify(content, null, 2),
);
await writeFile(
  path.join(directory, 'manifest.json'),
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      version: snapshot.version ?? null,
      media,
    },
    null,
    2,
  ),
);
// Only seed an empty database. Never overwrite content already edited online.
const literal = JSON.stringify(content).replaceAll("'", "''");
await writeFile(
  path.join(directory, 'seed.sql'),
  `INSERT INTO site_content (id,content,version,updated_at) VALUES (1,'${literal}',1,'${new Date().toISOString()}') ON CONFLICT(id) DO NOTHING;\n`,
);
console.log(
  JSON.stringify({
    directory,
    projects: content.projects.length,
    uploadedImages: media.length,
    bytes: media.reduce((n, m) => n + m.size, 0),
  }),
);
