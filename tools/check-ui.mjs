import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'src');
const cssFiles = readdirSync(src).filter(file => file.endsWith('.css'));
const css = cssFiles.map(file => [file, readFileSync(resolve(src, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')]);
const allCss = css.map(([, text]) => text).join('\n');
const tsx = readdirSync(src).filter(file => file.endsWith('.tsx')).map(file => readFileSync(resolve(src, file), 'utf8')).join('\n');
const ui = readFileSync(resolve(root, 'UI_SPEC.md'), 'utf8');
const errors = [];
const defined = new Set([...allCss.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
for (const [, text] of css) {
  for (const [, variable] of text.matchAll(/var\((--[\w-]+)/g)) {
    if (!defined.has(variable)) errors.push(`Undefined color/layout/type variable: ${variable}`);
  }
}
for (const [file, text] of css) {
  if (file !== 'palettes.css' && /#[\da-f]{3,8}\b|\brgba?\s*\(|:\s*(?:black|white)\s*[;)]/i.test(text)) {
    errors.push(`${file}: literal color outside the named color registries`);
  }
  if (file !== 'palettes.css' && /var\(--palette-/.test(text)) {
    errors.push(`${file}: direct palette reference bypasses the current theme`);
  }
  if (!['styles.css', 'fonts.css', 'typography.css'].includes(file) && /^\s*(?:font(?:-(?:family|size|weight|style|variant[\w-]*|stretch))?|line-height|letter-spacing|text-transform)\s*:/m.test(text)) {
    errors.push(`${file}: text properties belong in a named typography style`);
  }
  for (const [, body] of text.matchAll(/\{([^{}]*)\}/g)) {
    const properties = [...body.matchAll(/^\s*([\w-]+)\s*:/gm)].map(match => match[1]);
    if (new Set(properties).size !== properties.length) errors.push(`${file}: duplicate declaration in a CSS rule`);
  }
}
const styles = new Set([...allCss.matchAll(/\.(type-[\w-]+)/g)].map(match => match[1]));
const used = new Set([...tsx.matchAll(/\b(type-[\w-]+)/g)].map(match => match[1]));
for (const style of used) if (!styles.has(style)) errors.push(`Undefined text style: ${style}`);
for (const style of styles) {
  if (!used.has(style)) errors.push(`Unused text style: ${style}`);
  if (!ui.includes(`\`${style}\``)) errors.push(`Text style missing from UI_SPEC: ${style}`);
}
for (const [, token] of css.find(([file]) => file === 'colors.css')[1].matchAll(/(--[\w-]+)\s*:/g)) {
  if (!ui.includes(`\`${token}\``)) errors.push(`Color token missing from UI_SPEC: ${token}`);
}
if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exitCode = 1;
} else {
  console.log(`UI audit passed: ${styles.size} named/documented text styles; named colors; defined CSS variables; no duplicate declarations.`);
}
