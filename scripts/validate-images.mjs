import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/data.ts', import.meta.url), 'utf8');
const imageUrls = [...source.matchAll(/image: '([^']+)'/g)].map((match) => match[1]);
const fileNames = imageUrls
  .filter((url) => url.includes('/Special:FilePath/'))
  .map((url) => decodeURIComponent(url.split('/Special:FilePath/')[1].split('?')[0]));

if (!fileNames.length) {
  console.log(`Checked ${imageUrls.length} image references; no Commons redirects to validate.`);
  process.exit(0);
}

const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
endpoint.search = new URLSearchParams({
  action: 'query',
  format: 'json',
  origin: '*',
  titles: fileNames.map((name) => `File:${name}`).join('|'),
}).toString();

const response = await fetch(endpoint, { headers: { 'User-Agent': 'NYC-City-Guide/1.0 image-reference-check' } });
if (!response.ok) throw new Error(`Commons API returned ${response.status}`);
const payload = await response.json();
const missing = Object.values(payload.query.pages)
  .filter((page) => 'missing' in page)
  .map((page) => page.title);

if (missing.length) {
  console.error(`Missing Commons files (${missing.length}):\n${missing.join('\n')}`);
  process.exit(1);
}

console.log(`Checked ${imageUrls.length} image references; all ${fileNames.length} Commons redirect files exist.`);
