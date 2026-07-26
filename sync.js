import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// 👇 Current Live Match ID
const MATCH_ID = "ea479cff-ddbe-48e0-9e4a-528f61a8a175";

async function syncScore() {
  try {
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

      runs = innings.r || 0;
      wickets = innings.w || 0;
      overs = innings.o || 0;
    }

    const scoreboard = {
      team1: match.t1 || "",
      team2: match.t2 || "",
      team1Logo: match.t1img || "",
      team2Logo: match.t2img || "",
      status: match.status || "",
      series: match.series || "",
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

console.log("Firebase Write Success");

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
    console.error(err);
    process.exit(1);
  }
}

syncScore();
