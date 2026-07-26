import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===============================
// Read selected Match ID
// ===============================
async function getSelectedMatchId() {
  const docRef = await db.collection("scoreboard").doc("settings").get();

  if (!docRef.exists) {
    throw new Error("settings document not found");
  }

  return docRef.data().selectedMatchId;
}

// ===============================
// Save Matches To Firebase
// ===============================
async function saveLiveMatches() {

  const url = `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.API_KEY}&offset=0`;

  console.log("Fetching live matches...");

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "success") {
    console.log("Unable to load matches:", json.reason);
    return;
  }

  const liveMatches = (json.data || []).filter(match => match.id);

  await db.collection("scoreboard").doc("matches").set({
    list: liveMatches.map(match => ({
      id: match.id,
      name: match.name,
      status: match.status,
      matchType: match.matchType || ""
    })),
    updated: new Date().toISOString()
  });

  console.log("================================");
  console.log("Matches Returned:", json.data.length);
  console.log("Matches Saved:", liveMatches.length);

  liveMatches.forEach(m => {
    console.log(m.name, "|", m.status);
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

    console.log("===== SCOREBOARD =====");
    console.log(JSON.stringify(scoreboard, null, 2));

    await db.collection("scoreboard").doc("live").set(scoreboard, {
      merge: true
    });

    console.log("================================");
    console.log("Firebase Updated Successfully");
    console.log("Runs:", runs);
    console.log("Wickets:", wickets);
    console.log("Overs:", overs);
    console.log("================================");

  } catch (err) {

    console.error("ERROR:", err);
    process.exit(1);

  }

}

syncScore();
