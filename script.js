import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===============================
// Read Selected Match ID
// ===============================
async function getSelectedMatchId() {

  const docRef = await db
    .collection("scoreboard")
    .doc("settings")
    .get();

  if (!docRef.exists) {
    throw new Error("settings document not found");
  }

  return docRef.data().selectedMatchId;

}

// ===============================
// Save Current Matches
// ===============================
async function saveLiveMatches() {

  const url =
    `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.API_KEY}&offset=0`;

  console.log("Fetching Current Matches...");

  const response = await fetch(url);

  const json = await response.json();

  if (json.status !== "success") {

    console.log("API ERROR:", json.reason);

    return;

  }

  const matches = (json.data || []).map(match => ({

    id: match.id,

    name: match.name,

    status: match.status,

    matchType: match.matchType || "",

    matchStarted: match.matchStarted || false,

    matchEnded: match.matchEnded || false,

    date: match.date || "",

    teams: match.teams || []

  }));

  await db
    .collection("scoreboard")
    .doc("matches")
    .set({

      list: matches,

      updated: new Date().toISOString()

    });

  console.log("================================");
  console.log("Matches Returned:", matches.length);

  matches.forEach(match => {

    console.log(
      match.name,
      "|",
      match.status
    );

  });

  console.log("================================");

}

// ===============================
// Sync Selected Match
// ===============================
async function syncScore() {

  try {

    console.log(
      "API KEY LENGTH:",
      process.env.API_KEY?.length
    );

    // Save Match List
    await saveLiveMatches();

    // Selected Match
    const MATCH_ID =
      await getSelectedMatchId();

    console.log(
      "Selected Match:",
      MATCH_ID
    );

    const url =
      `https://api.cricapi.com/v1/match_info?apikey=${process.env.API_KEY}&id=${MATCH_ID}`;

    console.log(
      "Fetching:",
      url.replace(process.env.API_KEY, "***")
    );

    const response =
      await fetch(url);

    const json =
      await response.json();

    if (json.status !== "success") {

      console.log(
        "API Error:",
        json.reason
      );

      return;

    }

    if (!json.data) {

      console.log("No Match Data");

      return;

    }

    const match = json.data;

        // ===============================
    // Score
    // ===============================

    let runs = 0;
    let wickets = 0;
    let overs = 0;

    if (Array.isArray(match.score) && match.score.length > 0) {

      const innings = match.score[match.score.length - 1];

      runs = innings.r ?? 0;
      wickets = innings.w ?? 0;
      overs = innings.o ?? 0;

    }

    // ===============================
    // Build Scoreboard Object
    // ===============================

    const scoreboard = {

      matchId: MATCH_ID,

      match: match.name || "",

      status: match.status || "",

      venue: match.venue || "",

      team1: match.teams?.[0] || "",

      team2: match.teams?.[1] || "",

      team1Logo: match.teamInfo?.find(
        t => t.name === match.teams?.[0]
      )?.img || "",

      team2Logo: match.teamInfo?.find(
        t => t.name === match.teams?.[1]
      )?.img || "",

      runs,

      wickets,

      overs,

      target: match.target || "",

      batsman1: match.batsman1 || "",

      batsman1Runs: match.batsman1Runs || "",

      batsman2: match.batsman2 || "",

      batsman2Runs: match.batsman2Runs || "",

      bowler: match.bowler || "",

      bowlerFigures: match.bowlerFigures || "",

      crr: match.crr || "",

      rrr: match.rrr || "",

      partnership: match.partnership || "",

      lastOver: match.lastOver || "",

      matchPhase: match.matchPhase || "",

      toss:
        match.tossWinner
          ? `${match.tossWinner} won toss & chose ${match.tossChoice}`
          : "",

      tossWinner: match.tossWinner || "",

      tossChoice: match.tossChoice || "",

      matchWinner: match.matchWinner || "",

      updated: new Date().toISOString()

    };

    // ===============================
    // Save To Firebase
    // ===============================

    await db
      .collection("scoreboard")
      .doc("live")
      .set(scoreboard, {
        merge: true
      });

    console.log("================================");
    console.log("Firebase Updated Successfully");
    console.log(scoreboard);
    console.log("================================");

  } catch (err) {

    console.error(err);

    process.exit(1);

  }

}

syncScore();
