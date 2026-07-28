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
// RapidAPI Request
// ======================================

async function rapidRequest(url) {

  const response = await fetch(url, {

    method: "GET",

    headers: {

      "x-rapidapi-key": process.env.API_KEY,

      "x-rapidapi-host":
        "cricbuzz-cricket.p.rapidapi.com"

    }

  });

  if (!response.ok) {

    throw new Error(
      `RapidAPI Error ${response.status}`
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

    throw new Error(
      "settings document not found"
    );

  }

  return doc.data().selectedMatchId;

}

// ======================================
// Live Matches
// ======================================

async function saveLiveMatches() {

  console.log("Loading Live Matches...");

  const json = await rapidRequest(

    "https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live"

  );

  const matches = [];

  if (json.typeMatches) {

    json.typeMatches.forEach(type => {

      type.seriesMatches.forEach(series => {

        if (!series.seriesAdWrapper) return;

        series.seriesAdWrapper.matches.forEach(item => {

          if (!item.matchInfo) return;

          matches.push({

            id:
              item.matchInfo.matchId.toString(),

            name:
              item.matchInfo.matchDesc,

            status:
              item.matchInfo.status,

            matchType:
              item.matchInfo.matchFormat,

            team1:
              item.matchInfo.team1.teamName,

            team2:
              item.matchInfo.team2.teamName,

            date:
              item.matchInfo.startDate

          });

        });

      });

    });

  }

  await db
    .collection("scoreboard")
    .doc("matches")
    .set({

      list: matches,

      updated:
        new Date().toISOString()

    });

  console.log(

    "Live Matches:",

    matches.length

  );

  // ======================================
// Sync Score
// ======================================

async function syncScore() {

  try {

    await saveLiveMatches();

    const MATCH_ID =
      await getSelectedMatchId();

    console.log(
      "Selected Match:",
      MATCH_ID
    );

    const url =
      `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${MATCH_ID}/hscard`;

    const json =
      await rapidRequest(url);

    if (
      !json.scorecard ||
      json.scorecard.length === 0
    ) {

      console.log(
        "Scorecard not found"
      );

      return;

    }

    const innings =
      json.scorecard[
        json.scorecard.length - 1
      ];

    let runs =
      innings.score || 0;

    let wickets =
      innings.wickets || 0;

    let overs =
      innings.overs || 0;

    const batsmen =
      innings.batsman || [];

    console.log("BATSMEN DATA:");
console.log(JSON.stringify(batsmen, null, 2));

    const bowlers =
      innings.bowler || [];

    console.log("BOWLER DATA:");
console.log(JSON.stringify(bowlers, null, 2));

    const partnerships =
      innings.partnership?.partnership || [];

    const notOut = batsmen.filter(player => {
  const status =
    player.outdec ||
    player.outDesc ||
    player.status ||
    "";

  return !status.toLowerCase().includes("out");
});

    const currentPartnership =
      partnerships.length > 0

        ? partnerships[
            partnerships.length - 1
          ]

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

      target: "",

      batsman1:
        notOut[0]?.name || "",

      batsman1Runs:
        notOut[0]
          ? `${notOut[0].runs} (${notOut[0].balls})`
          : "",

      batsman2:
        notOut[1]?.name || "",

      batsman2Runs:
        notOut[1]
          ? `${notOut[1].runs} (${notOut[1].balls})`
          : "",

      bowler:
        bowlers[0]?.name || "",

      bowlerFigures:
        bowlers[0]
          ? `${bowlers[0].wickets}/${bowlers[0].runs}`
          : "",

      crr:
        innings.runrate?.toString() || "",

      rrr: "",

      lastOver: "",

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

    console.error(err);
    process.exit(1);

  }

}

syncScore();

}
