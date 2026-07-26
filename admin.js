import {
  db,
  doc,
  setDoc
} from "./firebase.js";

async function loadMatches() {
  try {
    const API_KEY = "YOUR_API_KEY";

    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}`
    );

    const json = await res.json();

    const select = document.getElementById("matchSelect");
    select.innerHTML = "";

    if (json.status !== "success") {
      alert("Unable to load matches");
      return;
    }

    json.data.forEach(match => {
      const option = document.createElement("option");
      option.value = match.id;
      option.text = match.name;
      select.appendChild(option);
    });

  } catch (err) {
    console.error(err);
    alert("Error loading matches");
  }
}

async function saveMatch() {
  try {
    const matchId = document.getElementById("matchSelect").value;

    await setDoc(
      doc(db, "scoreboard", "settings"),
      {
        selectedMatchId: matchId
      },
      { merge: true }
    );

    alert("Match selected successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to save match");
  }
}

// Existing button ke liye placeholder
window.saveScore = function () {
  alert("saveScore() abhi implement karna baqi hai.");
};

window.loadMatches = loadMatches;
window.saveMatch = saveMatch;
