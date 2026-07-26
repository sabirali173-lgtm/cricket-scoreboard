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
  const docRef = await db.collection("scoreboard").doc("settings").get();

  if (!docRef.exists) {
    throw new Error("settings document not found");
  }

  return docRef.data().selectedMatchId;
}

// ===============================
// Save Live Matches
// ===============================
async function saveLiveMatches() {

  const url = `https://api.cricapi.com/v1/matches?apikey=${process.env.API_KEY}`;

  console.log("Fetching matches...");

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "success") {
    console.log("API Error:", json.reason);
    return;
  }

  const liveMatches = (json.data || []).filter(match => {
    return match.matchStarted === true && match.matchEnded === false;
  });

  await db.collection("scoreboard").doc("matches").set({
    list: liveMatches.map(match => ({
      id: match.id,
      name: match.name,
      status: match.status,
      matchType: match.matchType || "",
      date: match.date || ""
    })),
    updated: new Date().toISOString()
  });

  console.log("================================");
  console.log("Live Matches Found:", liveMatches.length);

  liveMatches.forEach(match => {
    console.log(match.name + " | " + match.status);
  });

  console.log("================================");
}

// ===============================
// Sync Score
// ===============================
async function syncScore() {

  try {

    console.log("API KEY LENGTH:", process.env.API_KEY?.length);

    await saveLiveMatches();

    const MATCH_ID = await getSelectedMatchId();

    console.log("Selected Match ID:", MATCH_ID);

    const url =
      `https://api.cricapi.com/v1/match_info?apikey=${process.env.API_KEY}&id=${MATCH_ID}`;

    console.log("Fetching:", url.replace(process.env.API_KEY, "***"));

    const response = await fetch(url);
    const json = await response.json();

    console.log("===== API RESPONSE =====");
    console.log(JSON.stringify(json, null, 2));

    if (json.status !== "success") {
      console.log("API Error:", json.reason);
      return;
    }

    if (!json.data) {
      console.log("No Match Data");
      return;
    }

    const match = json.data;

    let runs = 0;
    let wickets = 0;
    let overs = 0;

    if (Array.isArray(match.score) && match.score.length > 0) {

      const innings = match.score[match.score.length - 1];

      runs = innings.r ?? 0;
      wickets = innings.w ?? 0;
      overs = innings.o ?? 0;

    }

    const scoreboard = {

      matchId: MATCH_ID,

      team1: match.teams?.[0] || "",
      team2: match.teams?.[1] || "",

      team1Logo: match.teamInfo?.[0]?.img || "",
      team2Logo: match.teamInfo?.[1]?.img || "",

      status: match.status || "",
      match: match.name || "",
      venue: match.venue || "",

      tossWinner: match.tossWinner || "",
      tossChoice: match.tossChoice || "",
      matchWinner: match.matchWinner || "",

      runs,
      wickets,
      overs,

      updated: new Date().toISOString()

    };

    await db.collection("scoreboard").doc("live").set(scoreboard, {
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
