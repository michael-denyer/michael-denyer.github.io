import assert from 'node:assert/strict';
import {fallback, fetchLive} from '../js/data.js';

const requests = [];
const repo = (name, visibility = 'public') => ({name, visibility, private: visibility === 'private', fork: false, pushed_at:'2026-09-10T10:00:00Z', stargazers_count:1});
const commit = (sha, message, date) => ({sha, commit:{message, committer:{date}}});
globalThis.fetch = async (url, options) => {
  requests.push({url, options});
  if (url.includes('/users/') && url.includes('/repos?')) return Response.json([
    repo('new-project'), repo('private-project', 'private'), repo('internal-project', 'internal'),
    {name:'unknown-visibility', fork:false}, repo('website'),
  ]);
  if (url.includes('/search/issues?')) return Response.json({total_count:0});
  if (url.includes('/events/')) return Response.json([{type:'PushEvent', payload:{head:'abc'}}]);
  if (url.endsWith('.svg')) return new Response('18 days of kibble');
  if (url.includes('/new-project/commits?')) return Response.json([
    commit('a', 'Newest public change\nPrivate-looking body stays out of ticker', '2026-09-10T11:00:00Z'),
    commit('b', 'Earlier public change', '2026-09-10T08:00:00Z'),
  ]);
  if (url.includes('/website/commits?')) return Response.json([
    commit('c', 'Published website fix (#3)', '2026-09-10T10:00:00Z'),
  ]);
  throw new Error(`Unexpected request: ${url}`);
};
const live = await fetchLive();
assert.deepEqual(live.ticker, [
  'new-project: Newest public change',
  'website: Published website fix (#3)',
  'new-project: Earlier public change',
]);
assert.deepEqual(live.boilers.map(r => r.name), ['new-project', 'website']);
assert.equal(live.openPrs, 0);
assert.equal(live.streakDays, 18);
assert(requests.every(r => !/private-project|internal-project|unknown-visibility|\/events\//.test(r.url)));
assert(requests.find(r => r.url.includes('/search/issues?')).url.includes('is:public'));
assert(requests.every(r => r.options.cache === 'no-store'));
assert(requests.every(r => r.options.credentials === 'omit'));

globalThis.fetch = async () => { throw new Error('offline'); };
assert.deepEqual(await fetchLive(live), live, 'Keep the last successful data during an outage');
const offline = await fetchLive();
assert.equal(offline.openPrs, null, 'Unknown counts must not masquerade as live values');
assert.match(offline.ticker[0], /unavailable/i);
assert(!fallback.ticker.some(message => message.startsWith('feat:')));
console.log('GitHub data: current commit messages, public-only sources, zero counts, and offline retention passed');
