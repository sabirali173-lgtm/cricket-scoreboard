import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "./firebase.js";

// =============================
// Load Matches From Firebase
// =============================
async function loadMatches() {

  try {

    const select = document.getElementById("matchSelect");

    select.innerHTML = "<option>Loading...</option>";

    const snap = await getDoc(
      doc(db, "scoreboard", "matches")
    );

    if (!snap.exists()) {

      select.innerHTML =
        "<option>No Live Matches</option>";

      return;

    }

    const matches = snap.data().list || [];

    select.innerHTML = "";

    if (matches.length === 0) {

      select.innerHTML =
        "<option>No Live Matches Available</option>";

      return;

    }

    matches.forEach(match => {

      const option = document.createElement("option");

      option.value = match.id;

      option.textContent =
        `${match.name} | ${match.status}`;

      select.appendChild(option);

    });

    // Restore selected match
    const setting = await getDoc(
      doc(db, "scoreboard", "settings")
    );

    if (setting.exists()) {

      const id =
        setting.data().selectedMatchId;

      if (id) {

        select.value = id;

      }

    }

  } catch (err) {

    console.error(err);

    alert("Unable to Load Matches");

  }

}

// =============================
// Save Selected Match
// =============================
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

    alert("Unable to Save");

  }

}

// =============================
// Manual Score Update
// =============================
async function saveScore() {

  try {

    const score = {

      team1:
        document.getElementById("team1").value,

      team2:
        document.getElementById("team2").value,

      runs:
        Number(document.getElementById("runs").value),

      wickets:
        Number(document.getElementById("wickets").value),

      overs:
        document.getElementById("overs").value,

      batsman1:
        document.getElementById("batsman1").value,

      batsman2:
        document.getElementById("batsman2").value,

      bowler:
        document.getElementById("bowler").value,

      target:
        document.getElementById("target").value,

      status:
        document.getElementById("status").value,

      updated:
        new Date().toISOString()

    };

    await updateDoc(
      doc(db, "scoreboard", "live"),
      score
    );

    alert("✅ Score Updated");

  } catch (err) {

    console.error(err);

    alert("Unable To Update");

  }

}

// =============================
// Auto Refresh Every 30 Seconds
// =============================
loadMatches();

setInterval(loadMatches, 30000);

// =============================

window.loadMatches = loadMatches;
window.saveMatch = saveMatch;
window.saveScore = saveScore;
