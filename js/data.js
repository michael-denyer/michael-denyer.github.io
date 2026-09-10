// Public GitHub activity. Failed refreshes retain the last successful values.
const USER = "michael-denyer";

export const fallback = {
  boilers: [
    { name: "michael-denyer", pressure: 0.15 },
    { name: "michael-denyer.github.io", pressure: 0.15 },
    { name: "jamma", pressure: 0.15 },
  ],
  totalStars: null,
  openPrs: null,
  streakDays: null,
  ticker: ["Public GitHub activity unavailable"],
};

function pressureFromPushed(pushedAt) {
  const hours = (Date.now() - new Date(pushedAt).getTime()) / 36e5;
  if (hours < 24) return 0.9;
  if (hours < 24 * 7) return 0.65;
  if (hours < 24 * 30) return 0.4;
  return 0.15;
}

async function request(url, format = "json") {
  const response = await fetch(url, {cache: "no-store", credentials: "omit", signal: AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
  return format === "text" ? response.text() : response.json();
}

export async function fetchLive(previous = fallback) {
  const live = structuredClone(previous);
  const [reposResult, prsResult, streakResult] = await Promise.allSettled([
    request(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=30&type=owner`),
    request(`https://api.github.com/search/issues?q=is:pr+is:open+is:public+user:${USER}`),
    request(`https://raw.githubusercontent.com/${USER}/${USER}/output/cafe-day.svg`, "text"),
  ]);

  if (prsResult.status === "fulfilled" && Number.isInteger(prsResult.value?.total_count) && prsResult.value.total_count >= 0) {
    live.openPrs = prsResult.value.total_count;
  }
  if (streakResult.status === "fulfilled") {
    const match = streakResult.value.match(/(\d+) days? of kibble/);
    if (match) live.streakDays = Number(match[1]);
    else if (streakResult.value.includes("bowl empty")) live.streakDays = 0;
  }

  if (reposResult.status === "fulfilled" && Array.isArray(reposResult.value)) {
    // Only explicitly public repositories may supply names or commit messages.
    const repos = reposResult.value.filter(r => r?.visibility === "public" && r.private === false && !r.fork && typeof r.name === "string");
    const recent = repos.slice(0, 3);
    if (recent.length) {
      live.boilers = recent.map(r => ({name: r.name, pressure: pressureFromPushed(r.pushed_at)}));
      live.totalStars = repos.reduce((sum, r) => sum + (Number.isFinite(r.stargazers_count) ? r.stargazers_count : 0), 0);
    }
    // PushEvent no longer contains commit summaries. Read the commits themselves.
    const results = await Promise.allSettled(recent.map(r =>
      request(`https://api.github.com/repos/${USER}/${encodeURIComponent(r.name)}/commits?per_page=3`)));
    const commits = [];
    for (const [index, result] of results.entries()) {
      if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
      for (const entry of result.value) {
        const message = entry?.commit?.message;
        const date = Date.parse(entry?.commit?.committer?.date);
        if (typeof message !== "string" || !Number.isFinite(date) || typeof entry.sha !== "string") continue;
        commits.push({sha: entry.sha, date, text: `${recent[index].name}: ${message.split("\n")[0].slice(0, 300)}`});
      }
    }
    const seen = new Set();
    const messages = commits.sort((a, b) => b.date - a.date).filter(commit => {
      if (seen.has(commit.sha)) return false;
      seen.add(commit.sha);
      return true;
    }).slice(0, 8).map(commit => commit.text);
    if (messages.length) live.ticker = messages;
  }
  return live;
}
