import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const shared = process.argv.includes('--shared');
const output = resolve(root, shared ? 'dist' : 'dist-gallery');
const names = ['structure', 'descriptions', 'vehicles', 'photos', 'placements'];
const catalog = Object.fromEntries(names.map(name => [name,
  JSON.parse(readFileSync(resolve(root, 'data', `${name}.json`), 'utf8'))]));
const images = new Set();
const imageRoot = resolve(root, 'assets/images/cars') + sep;
for (const photo of Object.values(catalog.photos.items)) {
  for (const field of ['url', 'full']) {
    const relative = photo[field];
    if (typeof relative !== 'string') throw new Error(`Missing local photo ${field}`);
    const file = resolve(root, relative);
    if (!file.startsWith(imageRoot) || !statSync(file).isFile()) {
      throw new Error(`Photo must be a local catalog image: ${relative}`);
    }
    images.add(relative);
  }
}
if (Object.keys(catalog.placements.cells).length !== 64) throw new Error('Expected 64 gallery cells');
const files = shared ? [] : [...names.map(name => `data/${name}.json`), ...images];
for (const relative of files) {
  const target = resolve(output, relative);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(resolve(root, relative), target);
}
const pageDir = shared ? resolve(output, 'gallery') : output;
mkdirSync(pageDir, { recursive: true });
copyFileSync(resolve(root, 'gallery.js'), resolve(pageDir, 'gallery.js'));
// Share the application's root data/images without duplicating them under /gallery.
// A base URL also keeps resource paths correct for the slashless /gallery address.
let html = readFileSync(resolve(root, 'avtomobilnaya_kniga_peremen_gallery.html'), 'utf8')
  .replace(/\s*<a href="automotive_book_of_changes_spec\.md">[^<]*<\/a>/, '')
  .replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
if (shared) html = html.replace('<head>', '<head><base href="../">')
  .replace('src="gallery.js"', 'src="gallery/gallery.js"');
writeFileSync(resolve(pageDir, 'index.html'), html);
const bytes = files.reduce((sum, file) => sum + statSync(resolve(output, file)).size,
  Buffer.byteLength(html) + statSync(resolve(pageDir, 'gallery.js')).size);
console.log(`Gallery built: ${shared ? 'dist/gallery/ (shared catalog)' : 'dist-gallery/'} — 64 cells, ${images.size} local images, ${(bytes / 1024 / 1024).toFixed(2)} MiB ${shared ? 'additional files' : 'total'}`);
