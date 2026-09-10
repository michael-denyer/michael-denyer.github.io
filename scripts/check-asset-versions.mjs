import assert from 'node:assert/strict';
import {appendFile,cp,mkdtemp,mkdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = fileURLToPath(new URL('../',import.meta.url));
const fixture = await mkdtemp(path.join(tmpdir(),'aether-release-check-'));
try {
  await mkdir(path.join(fixture,'scripts'));
  for (const name of ['index.html','style.css','favicon.svg','js','assets','scripts/crew-preview.html','scripts/version-assets.mjs']) {
    await cp(path.join(root,name),path.join(fixture,name),{recursive:true});
  }
  const run = (...args) => spawnSync(process.execPath,[path.join(fixture,'scripts/version-assets.mjs'),...args],{encoding:'utf8'});
  const release = async () => (await readFile(path.join(fixture,'index.html'),'utf8')).match(/name="aether-release" content="([a-f\d]{12})"/)[1];
  assert.equal(run('--check').status,0);
  const before = await release();
  // An edit deep in the import graph must invalidate the HTML entry, every
  // module import, and the pose-sheet requests, including unchanged images.
  await appendFile(path.join(fixture,'js/crew-animation.js'),'\n// Changed nested animation module.\n');
  assert.equal(run('--check').status,1,'Detect a release that still uses old cache keys');
  assert.equal(run().status,0);
  const after = await release();
  assert.notEqual(after,before);
  for (const name of ['index.html','js/main.js','js/audio.js','js/sprites.js','js/artwork.js','js/crew-animation.js','scripts/crew-preview.html']) {
    const text = await readFile(path.join(fixture,name),'utf8');
    assert.ok(text.includes(`?v=${after}`),`${name} uses the new release`);
    assert.ok(!text.includes(`?v=${before}`),`${name} has no stale references`);
  }
  assert.equal(run('--check').status,0);
  assert.equal(run().status,0);
  assert.equal(await release(),after,'Stamping unchanged files is idempotent');
  await appendFile(path.join(fixture,'assets/audio/dog-bark.wav'), Buffer.from([0,0]));
  assert.equal(run('--check').status,1,'A changed recording also invalidates the release');
  assert.equal(run().status,0);
  const audioRelease = await release();
  assert.notEqual(audioRelease,after);
  assert.ok((await readFile(path.join(fixture,'js/audio.js'),'utf8')).includes(`dog-bark.wav?v=${audioRelease}`));
  console.log('PASS: nested code and audio edits invalidate the complete asset graph; stamping is idempotent');
} finally {
  await rm(fixture,{recursive:true,force:true});
}
