import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const MATCH_ID = "a2cdbdde-a120-43f2-8089-fba847d42ab3";

async function syncScore() {
  try {
    const url = `https://api.cricapi.com/v1/match_info?apikey=${process.env.API_KEY}&id=${MATCH_ID}`;

    const res = await fetch(url);
    const json = await res.json();

    console.log("========== FULL API RESPONSE ==========");
    console.log(JSON.stringify(json, null, 2));

    if (!json.data) {
      console.log("No match data found");
      return;
    }

    const match = json.data;

    console.log("========== MATCH ==========");
    console.log(JSON.stringify(match, null, 2));

    console.log("========== SCORE ==========");
    console.log(JSON.stringify(match.score, null, 2));

    const scoreboard = {
      team1: match.t1 || "",
      team2: match.t2 || "",
      team1Logo: match.t1img || "",
      team2Logo: match.t2img || "",
      status: match.status || "",
      series: match.series || "",
      updated: new Date().toISOString(),
    };

    if (Array.isArray(match.score) && match.score.length > 0) {
      const innings = match.score[match.score.length - 1];

      scoreboard.runs = innings.r ?? 0;
      scoreboard.wickets = innings.w ?? 0;
      scoreboard.overs = innings.o ?? 0;

      console.log("Runs:", scoreboard.runs);
      console.log("Wickets:", scoreboard.wickets);
      console.log("Overs:", scoreboard.overs);
    }

    await db.collection("scoreboard").doc("live").set(scoreboard, {
      merge: true,
    });

    console.log("✅ Score updated successfully");

  } catch (err) {
    console.error("ERROR:");
    console.error(err);
    process.exit(1);
  }
}

syncScore();
