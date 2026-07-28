import admin from "firebase-admin";
import fetch from "node-fetch";

// ===============================
// RapidAPI Request
// ===============================
async function rapidRequest(url) {

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.API_KEY,
      "x-rapidapi-host": "cricbuzz-cricket.p.rapidapi.com"
    }
  });

  if (!response.ok) {
    throw new Error(`RapidAPI Error ${response.status}`);
  }

  return await response.json();

}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===============================
// Read Selected Match ID
// ===============================
async function getSelectedMatchId() {
  const docRef = await db.collection("scoreboard").doc("settings").get();

  if (!docRef.exists) {
    throw new Error("settings document not found");
  }

  return docRef.data().selectedMatchId;
}

// ===============================
// Load Matches
// ===============================
async function saveLiveMatches() {

  const url =
    `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.API_KEY}&offset=0`;

  console.log("Fetching Live Matches...");

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "success") {
    console.log("API Error:", json.reason);
    return;
  }

  const matches = (json.data || []).map(match => ({
    id: match.id,
    name: match.name,
    status: match.status,
    matchType: match.matchType || "",
    team1: match.teams?.[0] || "",
    team2: match.teams?.[1] || "",
    date: match.date || ""
  }));

  await db.collection("scoreboard").doc("matches").set({
    list: matches,
    updated: new Date().toISOString()
  });

  console.log("Matches:", matches.length);
}

// ===============================
// Sync Score
// ===============================
async function syncScore() {

  try {

    await saveLiveMatches();

    const MATCH_ID = await getSelectedMatchId();

    console.log("Selected Match:", MATCH_ID);

    const scorecardUrl =
  `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${MATCH_ID}/hscard`;

const json = await rapidRequest(scorecardUrl);

const match = json;

const innings = json.scorecard?.[json.scorecard.length - 1];

if (!innings) {
  console.log("No innings found");
  return;
}

    const scorecardUrl =
      `https://api.cricapi.com/v1/match_scorecard?apikey=${process.env.API_KEY}&id=${MATCH_ID}`;

    console.log("Loading Scorecard...");

    const scorecardRes = await fetch(scorecardUrl);
    const scorecardJson = await scorecardRes.json();

    let batsman1 = "";
    let batsman1Runs = "";

    let batsman2 = "";
    let batsman2Runs = "";

    let bowler = "";
    let bowlerFigures = "";

    let partnership = "";
    let lastOver = "";
    let crr = "";
    let rrr = "";

    if (
      scorecardJson.status === "success" &&
      scorecardJson.scorecard &&
      scorecardJson.scorecard.length > 0
    ) {

      const innings =
        scorecardJson.scorecard[
          scorecardJson.scorecard.length - 1
        ];

      crr = innings.runrate || "";

      const batsmen = innings.batsman || [];

      const notOut = batsmen.filter(
        b => b.outdec &&
        b.outdec.toLowerCase().includes("not out")
      );

      if (notOut[0]) {
        batsman1 = notOut[0].name;
        batsman1Runs =
          `${notOut[0].runs} (${notOut[0].balls})`;
      }

      if (notOut[1]) {
        batsman2 = notOut[1].name;
        batsman2Runs =
          `${notOut[1].runs} (${notOut[1].balls})`;
      }

          const bowlers = innings.bowler || [];

      if (bowlers.length > 0) {

        const currentBowler = bowlers[bowlers.length - 1];

        bowler = currentBowler.name;
        bowlerFigures =
          `${currentBowler.overs}-${currentBowler.wickets}-${currentBowler.runs}`;
      }

      const partnerships =
        innings.partnership?.partnership || [];

      if (partnerships.length > 0) {

        const p = partnerships[partnerships.length - 1];

        partnership =
          `${p.totalruns} (${p.totalballs})`;
      }

      lastOver = "";
    }

    let runs = 0;
    let wickets = 0;
    let overs = 0;

    const runs = innings.score || 0;
const wickets = innings.wickets || 0;
const overs = innings.overs || 0;

const batsmen = innings.batsman || [];
const bowlers = innings.bowler || [];
const partnerships = innings.partnership?.partnership || [];

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
      status: match.status || "",

      venue: match.venue || "",

      tossWinner: match.tossWinner || "",
      tossChoice: match.tossChoice || "",
      matchWinner: match.matchWinner || "",

  runs,
wickets,
overs,

target: "",

batsman1: notOut[0]?.name || "",
batsman1Runs: `${notOut[0]?.runs || 0} (${notOut[0]?.balls || 0})`,

batsman2: notOut[1]?.name || "",
batsman2Runs: `${notOut[1]?.runs || 0} (${notOut[1]?.balls || 0})`,

bowler: bowlers[0]?.name || "",
bowlerFigures: `${bowlers[0]?.wickets || 0}/${bowlers[0]?.runs || 0}`,

crr: innings.runrate?.toString() || "",
rrr: "",

lastOver: "",

partnership: currentPartnership
  ? `${currentPartnership.totalruns} (${currentPartnership.totalballs})`
  : "",

matchPhase:
  overs < 6
    ? "Powerplay"
    : overs < 15
    ? "Middle Overs"
    : "Death Overs",

    await db
      .collection("scoreboard")
      .doc("live")
      .set(scoreboard, { merge: true });

    console.log("Firebase Updated Successfully");

  } catch (err) {

    console.error(err);
    process.exit(1);

  }

}

syncScore();
