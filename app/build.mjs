// Bundle src/main.js (+ WASM + .se1 data as base64) and inline it with the CSS into one HTML file at the repo root.
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '..', 'graha-bala.html');

const result = await esbuild.build({
  entryPoints: [path.join(here, 'src', 'main.js')],
  bundle: true, format: 'esm', platform: 'browser', target: ['es2022'],
  minify: false, legalComments: 'none', write: false,
  loader: { '.wasm': 'base64', '.se1': 'base64' },
  external: ['node:module', 'node:fs', 'node:path', 'node:url', 'node:process'],
  logLevel: 'warning',
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(here, 'src', 'styles.css'), 'utf8');
let html = fs.readFileSync(path.join(here, 'src', 'template.html'), 'utf8');
html = html.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(process.cwd(), out)} (${(fs.statSync(out).size / 1048576).toFixed(2)} MB)`);
