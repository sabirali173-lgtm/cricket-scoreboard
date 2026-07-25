import { db, doc, onSnapshot } from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

onSnapshot(scoreRef, (snapshot) => {
  if (!snapshot.exists()) return;

  const data = snapshot.data();

  // Main Score
  document.getElementById("team1").textContent = data.team1 || "";
  document.getElementById("team2").textContent = data.team2 || "";
  document.getElementById("runs").textContent = data.runs || 0;
  document.getElementById("wickets").textContent = data.wickets || 0;
  document.getElementById("overs").textContent = data.overs || 0;

  // Batsmen
  document.getElementById("batsman1").textContent = data.batsman1 || "";
  document.getElementById("batsman1Runs").textContent = data.batsman1Runs || "0 (0)";

  document.getElementById("batsman2").textContent = data.batsman2 || "";
  document.getElementById("batsman2Runs").textContent = data.batsman2Runs || "0 (0)";

  // Bowler
  document.getElementById("bowler").textContent = data.bowler || "";
  document.getElementById("bowlerFigures").textContent = data.bowlerFigures || "";

  // Match Info
  document.getElementById("target").textContent = data.target || 0;
  document.getElementById("status").textContent = data.status || "";
});
