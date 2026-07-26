// ===============================
// Load Matches From Firebase
// ===============================
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "./firebase.js";

async function loadMatches() {

  try {

    const btn = document.querySelector("button");

    if (btn) btn.innerText = "Loading...";

    const snap = await getDoc(doc(db, "scoreboard", "matches"));

    if (!snap.exists()) {
      alert("No matches found. Run GitHub Sync first.");
      if (btn) btn.innerText = "Refresh Matches";
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

    if (btn) btn.innerText = "Refresh Matches";

  } catch (err) {

    console.error(err);

    alert("Unable to load matches");

  }

}
