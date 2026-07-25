import { db, doc, onSnapshot } from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

onSnapshot(scoreRef, (snapshot) => {
  if (!snapshot.exists()) return;

  const data = snapshot.data();

  document.getElementById("team1").textContent = data.team1;
  document.getElementById("team2").textContent = data.team2;
  document.getElementById("runs").textContent = data.runs;
  document.getElementById("wickets").textContent = data.wickets;
  document.getElementById("overs").textContent = data.overs;
  document.getElementById("batsman1").textContent = data.batsman1;
  document.getElementById("batsman2").textContent = data.batsman2;
  document.getElementById("bowler").textContent = data.bowler;
  document.getElementById("target").textContent = data.target;
  document.getElementById("status").textContent = data.status;
});
