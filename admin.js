import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "./firebase.js";

// ===============================
// Load Live Matches
// ===============================
async function loadMatches() {

  try {

    const btn = document.querySelector("button");

    if (btn) btn.innerText = "Loading...";

    const snap = await getDoc(doc(db, "scoreboard", "matches"));

    if (!snap.exists()) {

      alert("No matches found.");

      if (btn) btn.innerText = "Refresh Live Matches";

      return;

    }

    const matches = snap.data().list || [];

    const select = document.getElementById("matchSelect");

    select.innerHTML = "";

    matches.forEach(match => {

      const option = document.createElement("option");

      option.value = match.id;

      option.text =
        `${match.name} | ${match.status}`;

      select.appendChild(option);

    });

    if (btn) btn.innerText = "Refresh Live Matches";

  } catch (err) {

    console.error(err);

    alert("Unable to load matches");

  }

}

// ===============================
// Save Selected Match
// ===============================
async function saveMatch() {

  try {

    const matchId =
      document.getElementById("matchSelect").value;

    await setDoc(
      doc(db, "scoreboard", "settings"),
      {
        selectedMatchId: matchId
      },
      {
        merge: true
      }
    );

    alert("✅ Match Selected");

  } catch (err) {

    console.error(err);

    alert("Unable to Save Match");

  }

}
// ===============================
// Save Score To Firebase
// ===============================
async function saveScore() {

  try {

    const data = {

      team1: document.getElementById("team1").value,

      team2: document.getElementById("team2").value,

      runs: Number(document.getElementById("runs").value),

      wickets: Number(document.getElementById("wickets").value),

      overs: document.getElementById("overs").value,

      target: Number(document.getElementById("target").value),

      crr: document.getElementById("crr").value,

      rrr: document.getElementById("rrr").value,

      batsman1: document.getElementById("batsman1").value,

      batsman1Runs: document.getElementById("batsman1Runs").value,

      batsman2: document.getElementById("batsman2").value,

      batsman2Runs: document.getElementById("batsman2Runs").value,

      bowler: document.getElementById("bowler").value,

      bowlerFigures: document.getElementById("bowlerFigures").value,

      status: document.getElementById("status").value,

      venue: document.getElementById("venue").value,

      toss: document.getElementById("toss").value,

      lastOver: document.getElementById("lastOver").value,

      partnership: document.getElementById("partnership").value,

      matchPhase: document.getElementById("matchPhase").value,

      updated: new Date().toISOString()

    };

    await updateDoc(
      doc(db, "scoreboard", "live"),
      data
    );

    alert("✅ Firebase Updated Successfully");

  } catch (err) {

    console.error(err);

    alert("❌ Unable to Update Firebase");

  }

}
// ===============================
// Expose Functions To HTML
// ===============================
window.loadMatches = loadMatches;
window.saveMatch = saveMatch;
window.saveScore = saveScore;

// ===============================
// Auto Load Matches On Page Load
// ===============================
window.addEventListener("load", () => {

    loadMatches();

});

// ===============================
// Auto Refresh Every 60 Seconds
// ===============================
setInterval(() => {

    loadMatches();

}, 60000);
