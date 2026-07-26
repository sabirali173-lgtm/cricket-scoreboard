import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Current Match ID
const MATCH_ID = "ea479cff-ddbe-48e0-9e4a-528f61a8a175";

async function syncScore() {
  try {
    console.log("API KEY LENGTH:", process.env.API_KEY?.length);

    const url = `https://api.cricapi.com/v1/match_info?apikey=${process.env.API_KEY}&id=${MATCH_ID}`;

    console.log("Fetching:", url.replace(process.env.API_KEY, "***"));

    const response = await fetch(url);
    const json = await response.json();

    console.log("===== API RESPONSE =====");
    console.log(JSON.stringify(json, null, 2));

    if (json.status === "failure") {
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
      team1: match.teams?.[0] || "",
      team2: match.teams?.[1] || "",

      team1Logo: match.teamInfo?.[0]?.img || "",
      team2Logo: match.teamInfo?.[1]?.img || "",

      status: match.status || "",
      match: match.name || "",
      venue: match.venue || "",

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
    console.log("Firebase Write Success");
    console.log("Runs:", runs);
    console.log("Wickets:", wickets);
    console.log("Overs:", overs);
    console.log("================================");

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

syncScore();
