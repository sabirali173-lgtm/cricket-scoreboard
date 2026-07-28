import admin from "firebase-admin";
import fetch from "node-fetch";

// ======================================
// Firebase
// ======================================

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ======================================
// RapidAPI
// ======================================

const API_HOST = "cricbuzz-cricket.p.rapidapi.com";

async function rapidRequest(url) {

  console.log("API KEY EXISTS:", !!process.env.API_KEY);
console.log("API KEY LENGTH:", process.env.API_KEY?.length);
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": process.env.API_KEY,
      "x-rapidapi-host": API_HOST
        
      console.log("API KEY EXISTS:", !!process.env.API_KEY);
console.log("API KEY LENGTH:", process.env.API_KEY?.length);
    }
  });

  if (!response.ok) {
    throw new Error(
      `RapidAPI Error ${response.status} : ${await response.text()}`
    );
  }

  return await response.json();
}

// ======================================
// Selected Match
// ======================================

async function getSelectedMatchId() {
  const doc = await db
    .collection("scoreboard")
    .doc("settings")
    .get();

  if (!doc.exists) {
    throw new Error("settings document not found");
  }

  return String(doc.data().selectedMatchId);
}

// ======================================
// Save Live Matches
// ======================================

async function saveLiveMatches() {

  console.log("Loading live matches...");

  const json = await rapidRequest(
    "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live"
  );

  const list = [];

  if (json.typeMatches) {

    json.typeMatches.forEach(type => {

      (type.seriesMatches || []).forEach(series => {

        if (!series.seriesAdWrapper) return;

        (series.seriesAdWrapper.matches || []).forEach(match => {

          if (!match.matchInfo) return;

          list.push({

            id: String(match.matchInfo.matchId),

            name:
              `${match.matchInfo.team1.teamSName} vs ${match.matchInfo.team2.teamSName}`,

            status:
              match.matchInfo.status,

            format:
              match.matchInfo.matchFormat

          });

        });

      });

    });

  }

  await db
    .collection("scoreboard")
    .doc("matches")
    .set({

      list,

      updated:
        new Date().toISOString()

    });

  console.log(
    `Live Matches Saved : ${list.length}`
  );

}

// ======================================
// Sync Score
// ======================================

async function syncScore() {

  try {

    await saveLiveMatches();

    const MATCH_ID = await getSelectedMatchId();

    console.log("Selected Match:", MATCH_ID);

    const json = await rapidRequest(
      `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${MATCH_ID}/hscard`
    );

    if (!json.scorecard || !json.scorecard.length) {
      console.log("Scorecard not found");
      return;
    }

    const innings =
      json.scorecard[json.scorecard.length - 1];

    const runs = innings.score || 0;
    const wickets = innings.wickets || 0;
    const overs = innings.overs || 0;

    const batsmen =
      innings.batsman ||
      innings.batsmen ||
      [];

    const bowlers =
      innings.bowler ||
      innings.bowlers ||
      [];

    const partnerships =
      innings.partnership?.partnership || [];

    const striker =
      batsmen.find(x =>
        (x.outdec || "").toLowerCase() === "not out"
      ) || batsmen[0] || null;

    const nonStriker =
      batsmen.filter(x =>
        (x.outdec || "").toLowerCase() === "not out"
      )[1] || batsmen[1] || null;

    const currentBowler =
      bowlers[0] || null;

    const currentPartnership =
      partnerships.length
        ? partnerships[partnerships.length - 1]
        : null;

  const scoreboard = {

  matchId: MATCH_ID,

  match:
    json.matchHeader?.matchDescription || "",

  status:
    json.status || "",

  venue:
    json.venueInfo?.ground || "",

  team1:
    json.matchHeader?.team1?.name || "",

  team2:
    json.matchHeader?.team2?.name || "",

  team1Logo:
    json.matchHeader?.team1?.imageId
      ? `https://static.cricbuzz.com/a/img/v1/152x152/i1/c${json.matchHeader.team1.imageId}/team.jpg`
      : "",

  team2Logo:
    json.matchHeader?.team2?.imageId
      ? `https://static.cricbuzz.com/a/img/v1/152x152/i1/c${json.matchHeader.team2.imageId}/team.jpg`
      : "",

  runs,
  wickets,
  overs,

  target:
    innings.target || "",

  batsman1:
    striker?.name || "",

  batsman1Runs:
    striker
      ? `${striker.runs} (${striker.balls})`
      : "",

  batsman2:
    nonStriker?.name || "",

  batsman2Runs:
    nonStriker
      ? `${nonStriker.runs} (${nonStriker.balls})`
      : "",

  bowler:
    currentBowler?.name || "",

  bowlerFigures:
    currentBowler
      ? `${currentBowler.wickets}/${currentBowler.runs}`
      : "",

  crr:
    innings.runRate?.toString() ||
    innings.runrate?.toString() ||
    "",

  rrr:
    innings.requiredRunRate?.toString() || "",

  lastOver:
    innings.lastOver || "",

  partnership:
    currentPartnership
      ? `${currentPartnership.totalruns} (${currentPartnership.totalballs})`
      : "",

  matchPhase:
    overs < 6
      ? "Powerplay"
      : overs < 15
      ? "Middle Overs"
      : "Death Overs",

  updated:
    new Date().toISOString()

};

      console.log("===== SCOREBOARD =====");
    console.log(JSON.stringify(scoreboard, null, 2));

    await db
      .collection("scoreboard")
      .doc("live")
      .set(scoreboard, {
        merge: true
      });

    console.log("================================");
    console.log("Firebase Updated Successfully");
    console.log("================================");

  } catch (err) {

    console.error("SYNC ERROR:");
    console.error(err);

    process.exit(1);

  }

}

// ======================================
// Start Sync
// ======================================

syncScore();
