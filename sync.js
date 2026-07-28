const innings = json.scorecard?.[json.scorecard.length - 1];

const batsmen = innings?.batsman || [];
const bowlers = innings?.bowler || [];
const partnerships = innings?.partnership?.partnership || [];

const notOut = batsmen.filter(
  b => b.outdec && b.outdec.toLowerCase().includes("not out")
);

const currentPartnership =
  partnerships.length > 0
    ? partnerships[partnerships.length - 1]
    : null;

const scoreboard = {

  matchId: MATCH_ID,

  team1: match.teams?.[0] || "",
  team2: match.teams?.[1] || "",

  team1Logo: match.teamInfo?.[0]?.img || "",
  team2Logo: match.teamInfo?.[1]?.img || "",

  match: match.name || "",
  status: json.status || "",

  venue: match.venue || "",

  tossWinner: match.tossWinner || "",
  tossChoice: match.tossChoice || "",
  matchWinner: match.matchWinner || "",

  runs: innings?.score || 0,
  wickets: innings?.wickets || 0,
  overs: innings?.overs || 0,

  target: match.target || "",

  batsman1: notOut[0]?.name || "",
  batsman1Runs: notOut[0]?.runs || 0,
  batsman1Balls: notOut[0]?.balls || 0,

  batsman2: notOut[1]?.name || "",
  batsman2Runs: notOut[1]?.runs || 0,
  batsman2Balls: notOut[1]?.balls || 0,

  bowler: bowlers[0]?.name || "",
  bowlerFigures:
    `${bowlers[0]?.overs || 0}-${bowlers[0]?.wickets || 0}-${bowlers[0]?.runs || 0}`,

  crr: innings?.runrate || "",

  partnership: currentPartnership
    ? `${currentPartnership.totalruns} (${currentPartnership.totalballs})`
    : "",

  lastOver: "",

  rrr: "",

  matchPhase:
    innings?.overs < 6
      ? "Powerplay"
      : innings?.overs < 15
      ? "Middle Overs"
      : "Death Overs",

  updated: new Date().toISOString()

};
