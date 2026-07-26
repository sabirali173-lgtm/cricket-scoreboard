const scoreboard = {
  team1: match.t1 || "",
  team2: match.t2 || "",

  team1Logo: match.t1img || "",
  team2Logo: match.t2img || "",

  team1Score: match.t1s || "",
  team2Score: match.t2s || "",

  status: match.status || "",
  series: match.series || "",

  updated: new Date().toISOString()
};

if (match.score && match.score.length) {

  const innings = match.score[match.score.length - 1];

  scoreboard.runs = innings.r || "";
  scoreboard.wickets = innings.w || "";
  scoreboard.overs = innings.o || "";
}
