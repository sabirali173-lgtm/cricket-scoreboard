import {
  db,
  doc,
  setDoc,
  updateDoc
} from "./firebase.js";

const API_KEY = "82fd1839-3089-4d0b-b466-8387599932f1";

// ===============================
// Load Live Matches
// ===============================
async function loadMatches() {

  try {

    const btn = document.querySelector("button");

    if (btn) btn.innerText = "Loading...";

    const response = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`
    );

    const json = await response.json();

    console.log(json);

    if (json.status === "failure") {
      alert(json.reason || "Invalid API Key");

      if (btn) btn.innerText = "Load Live Matches";
      return;
    }

    const select = document.getElementById("matchSelect");

    select.innerHTML = "";

    json.data.forEach(match => {

      const option = document.createElement("option");

      option.value = match.id;

      option.text =
        `${match.name} | ${match.status}`;

      select.appendChild(option);

    });

    if (btn) btn.innerText = "Refresh Matches";

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

    alert("✅ Match Saved");

  } catch (err) {

    console.error(err);

    alert("Failed to Save Match");

  }

}

// ===============================
// Manual Score Update
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

      updated: new Date().toISOString()

    };

    await updateDoc(
      doc(db, "scoreboard", "live"),
      data
    );

    alert("✅ Score Updated");

  } catch (err) {

    console.error(err);

    alert("Unable to Update Score");

  }

}

window.loadMatches = loadMatches;
window.saveMatch = saveMatch;
window.saveScore = saveScore;
