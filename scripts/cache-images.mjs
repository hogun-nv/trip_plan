import { access, mkdir, readFile, stat, writeFile } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const source = await readFile(new URL('app/data.ts', projectRoot), 'utf8');
const entries = [...source.matchAll(/id: '([^']+)'[\s\S]*?image: '([^']+)'/g)]
  .map(([, id, image]) => ({ id, image }));

if (entries.length !== 48) throw new Error(`Expected 48 images, found ${entries.length}`);

const outputDir = new URL('public/images/', projectRoot);
await mkdir(outputDir, { recursive: true });

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function commonsFileName(url) {
  const parsedUrl = new URL(url);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  return decodeURIComponent(parsedUrl.hostname === 'upload.wikimedia.org' && parsedUrl.pathname.includes('/thumb/')
    ? pathParts.at(-2)
    : pathParts.at(-1));
}

const api = new URL('https://commons.wikimedia.org/w/api.php');
api.search = new URLSearchParams({
  action: 'query',
  format: 'json',
  prop: 'imageinfo',
  iiprop: 'url',
  titles: entries.map(({ image }) => `File:${commonsFileName(image)}`).join('|'),
}).toString();
const apiResponse = await fetch(api, { headers: { 'User-Agent': 'NYC-City-Guide/1.0 local-image-cache' } });
if (!apiResponse.ok) throw new Error(`Commons API returned ${apiResponse.status}`);
const apiPayload = await apiResponse.json();
const canonicalUrls = new Map(Object.values(apiPayload.query.pages)
  .filter((page) => page.imageinfo?.[0]?.url)
  .map((page) => [page.title.slice(5).replaceAll('_', ' '), page.imageinfo[0].url]));
const resolvedEntries = entries.map((entry) => ({
  ...entry,
  image: canonicalUrls.get(commonsFileName(entry.image).replaceAll('_', ' ')) ?? entry.image,
}));

async function fetchImage(url) {
  const parsedUrl = new URL(url);
  parsedUrl.search = '';
  parsedUrl.hash = '';
  const fileName = commonsFileName(url);
  const commonsRedirect = new URL(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`);
  const directOriginal = new URL(parsedUrl);
  if (directOriginal.hostname === 'upload.wikimedia.org' && directOriginal.pathname.includes('/thumb/')) {
    directOriginal.pathname = directOriginal.pathname
      .replace('/wikipedia/commons/thumb/', '/wikipedia/commons/')
      .split('/').slice(0, -1).join('/');
  }
  const candidates = [commonsRedirect, directOriginal];

  for (const candidate of candidates) {
    const proxy = new URL('https://wsrv.nl/');
    proxy.searchParams.set('url', candidate.toString().replace(/^https?:\/\//, ''));
    proxy.searchParams.set('w', '1400');
    proxy.searchParams.set('we', '1');
    proxy.searchParams.set('output', 'jpg');
    proxy.searchParams.set('q', '78');
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const response = await fetch(proxy, {
        headers: { 'User-Agent': 'NYC-City-Guide/1.0 local-image-cache' },
        redirect: 'follow',
      });
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        return Buffer.from(await response.arrayBuffer());
      }
      if (response.status === 404) break;
      if (response.status !== 429 && response.status < 500) {
        throw new Error(`${response.status} for ${url}`);
      }
      const retryAfter = Number(response.headers.get('retry-after') ?? 0) * 1000;
      await wait(Math.max(retryAfter, 2000 + (attempt * 2000)));
    }
  }
  throw new Error(`Retry limit reached for ${url}`);
}

async function cacheEntry({ id, image }) {
  const output = new URL(`${id}.jpg`, outputDir);
  try {
    await access(output);
    console.log(`${id}: cached`);
    return;
  } catch { /* download missing output */ }
  await writeFile(output, await fetchImage(image));
  const { size } = await stat(output);
  console.log(`${id}: ${Math.round(size / 1024)} KB`);
  await wait(300);
}

const queue = [...resolvedEntries];
const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) await cacheEntry(queue.shift());
});
await Promise.all(workers);
console.log(`Cached ${entries.length} optimized images in public/images/.`);
