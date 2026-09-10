// Give every local runtime asset the same content-derived release URL.
// Run before publishing; --check detects forgotten or inconsistent versions.
import {createHash} from 'node:crypto';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../',import.meta.url));
const code = (await readdir(path.join(root,'js'))).filter(name=>name.endsWith('.js')).map(name=>`js/${name}`).sort();
const pages = ['index.html','scripts/crew-preview.html'];
const textFiles = [...pages,...code,'style.css'];
const assetFiles = (await readdir(path.join(root,'assets'),{recursive:true})).filter(name=>/\.(webp|wav)$/.test(name)).map(name=>`assets/${name}`).sort();
const normalize = text => text.replace(/\?v=[a-f\d]{12}/g,'').replace(/(<meta name="aether-release" content=")[^"]*("\s*\/?>)/,'$1RELEASE$2');
const contents = new Map();
const hash = createHash('sha256');
for (const name of [...textFiles,...assetFiles,'favicon.svg']) {
  const bytes = await readFile(path.join(root,name));
  hash.update(name).update('\0').update(textFiles.includes(name) ? normalize(bytes.toString()) : bytes);
  if (textFiles.includes(name)) contents.set(name,bytes.toString());
}
const release = hash.digest('hex').slice(0,12);
let changed = false;
for (const [name,source] of contents) {
  let output = normalize(source).replace(/(['"`])([^'"`\s]+\.(?:js|css|webp|svg|wav))\1/g,(match,quote,url) =>
    /^(?:[a-z]+:|\/\/)/i.test(url) ? match : `${quote}${url}?v=${release}${quote}`);
  output = output.replace('name="aether-release" content="RELEASE"',`name="aether-release" content="${release}"`);
  if (output === source) continue;
  changed = true;
  if (process.argv.includes('--check')) console.error(`STALE asset URLs: ${name}`);
  else await writeFile(path.join(root,name),output);
}
console.log(`Release ${release}`);
if (changed && process.argv.includes('--check')) process.exitCode = 1;
