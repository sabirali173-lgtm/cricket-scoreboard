import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Read selected Match ID from Firebase
async function getSelectedMatchId() {
  const doc = await db.collection("scoreboard").doc("settings").get();

  if (!doc.exists) {
    throw new Error("settings document not found");
  }

  return doc.data().selectedMatchId;
}

async function syncScore() {
  try {
    console.log("API KEY LENGTH:", process.env.API_KEY?.length);

    // Get Match ID from Firebase
    const MATCH_ID = await getSelectedMatchId();

    console.log("Selected Match ID:", MATCH_ID);

    const url = `https://api.cricapi.com/v1/match_info?apikey=${process.env.API_KEY}&id=${MATCH_ID}`;

    console.log("Fetching:", url.replace(process.env.API_KEY, "***"));

    // ===============================
// Save Current Matches List
// ===============================
const matchesResponse = await fetch(
  `https://api.cricapi.com/v1/currentMatches?apikey=${process.env.API_KEY}&offset=0`
);

const matchesJson = await matchesResponse.json();

if (matchesJson.status === "success") {

  await db.collection("scoreboard").doc("matches").set({

    list: matchesJson.data.map(match => ({

      id: match.id,

      name: match.name,

      status: match.status

    })),

    updated: new Date().toISOString()

  });

  console.log("✅ Live Matches Saved to Firebase");

}

    const response = await fetch(url);
    const json = await response.json();

    console.log("===== API RESPONSE =====");
    console.log(JSON.stringify(json, null, 2));

    if (json.status !== "success") {
      console.log("API Error:", json.reason);
      return;
    }

    if (!json.data) {
      console.log("No match data found");
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

      updated: new Date().toISOString(),
    };

    console.log("===== SCOREBOARD =====");
    console.log(JSON.stringify(scoreboard, null, 2));

    await db.collection("scoreboard").doc("live").set(scoreboard, {
      merge: true,
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
