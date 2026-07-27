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
