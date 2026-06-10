// Live GitHub data with baked fallbacks. All endpoints are unauthenticated
// and CORS-friendly; failures fall back silently so the scene never breaks.

const USER = "michael-denyer";

export const fallback = {
  boilers: [
    { name: "michael-denyer", pressure: 0.9 },
    { name: "pstack-claude", pressure: 0.65 },
    { name: "jamma", pressure: 0.45 },
  ],
  totalStars: 8,
  openPrs: 2,
  streakDays: 10,
  ticker: [
    "feat: star-scaled cats, broken-streak stares, octocat portrait",
    "feat: commit cafe workflow replaces snake",
    "feat: GitHub API collector with streak computation",
  ],
};

function pressureFromPushed(pushedAt) {
  const hours = (Date.now() - new Date(pushedAt).getTime()) / 36e5;
  if (hours < 24) return 0.9;
  if (hours < 24 * 7) return 0.65;
  if (hours < 24 * 30) return 0.4;
  return 0.15;
}

export async function fetchLive() {
  const live = structuredClone(fallback);
  const results = await Promise.allSettled([
    fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=30`),
    fetch(`https://api.github.com/search/issues?q=is:pr+is:open+user:${USER}`),
    fetch(`https://api.github.com/users/${USER}/events/public?per_page=30`),
    fetch(`https://raw.githubusercontent.com/${USER}/${USER}/output/cafe-day.svg`),
  ]);

  try {
    if (results[0].status === "fulfilled" && results[0].value.ok) {
      const repos = (await results[0].value.json()).filter((r) => !r.fork && !r.private);
      live.boilers = repos.slice(0, 3).map((r) => ({
        name: r.name,
        pressure: pressureFromPushed(r.pushed_at),
      }));
      live.totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    }
  } catch { /* keep fallback */ }

  try {
    if (results[1].status === "fulfilled" && results[1].value.ok) {
      live.openPrs = (await results[1].value.json()).total_count ?? live.openPrs;
    }
  } catch { /* keep fallback */ }

  try {
    if (results[2].status === "fulfilled" && results[2].value.ok) {
      const events = await results[2].value.json();
      const msgs = [];
      for (const ev of events) {
        if (ev.type === "PushEvent") {
          for (const c of ev.payload.commits ?? []) {
            msgs.push(`${ev.repo.name.split("/")[1]}: ${c.message.split("\n")[0]}`);
          }
        }
      }
      if (msgs.length) live.ticker = msgs.slice(0, 8);
    }
  } catch { /* keep fallback */ }

  try {
    if (results[3].status === "fulfilled" && results[3].value.ok) {
      const svg = await results[3].value.text();
      const m = svg.match(/(\d+) days? of kibble/);
      if (m) live.streakDays = parseInt(m[1], 10);
      else if (svg.includes("bowl empty")) live.streakDays = 0;
    }
  } catch { /* keep fallback */ }

  return live;
}
