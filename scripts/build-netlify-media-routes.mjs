import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('dist');
const uploadsDirectory = path.join(outputDirectory, 'uploads');
const redirectsPath = path.join(outputDirectory, '_redirects');
const headersPath = path.join(outputDirectory, '_headers');
const mediaIdPattern = /^[a-f0-9-]{36}$/;

const files = await readdir(uploadsDirectory);
const mediaIds = files
  .filter((file) => file.endsWith('.bin'))
  .map((file) => file.slice(0, -'.bin'.length))
  .filter((id) => mediaIdPattern.test(id))
  .sort();

if (mediaIds.length === 0) throw Error('Netlify media route generation found no uploaded media files.');

const media = await Promise.all(
  mediaIds.map(async (id) => {
    const metadata = JSON.parse(
      await readFile(path.join(uploadsDirectory, `${id}.bin.json`), 'utf8'),
    );
    if (
      !metadata ||
      typeof metadata !== 'object' ||
      typeof metadata.contentType !== 'string' ||
      !metadata.contentType
    )
      throw Error(`Missing content type metadata for media ${id}.`);
    return { id, contentType: metadata.contentType };
  }),
);

const redirects = media
  .map(({ id }) => `/api/media/${id}  /uploads/${id}.bin  200`)
  .join('\n');
const headers = media
  .map(
    ({ id, contentType }) =>
      `/api/media/${id}\n  Content-Type: ${contentType}\n  Cache-Control: public, max-age=31536000, immutable`,
  )
  .join('\n\n');

const existingRedirects = await readFile(redirectsPath, 'utf8').catch(() => '');
const existingHeaders = await readFile(headersPath, 'utf8').catch(() => '');

await writeFile(
  redirectsPath,
  `${existingRedirects.trimEnd()}\n${redirects}\n`,
);
await writeFile(headersPath, `${existingHeaders.trimEnd()}\n\n${headers}\n`);
