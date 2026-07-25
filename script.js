import { db, doc, onSnapshot } from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

onSnapshot(scoreRef, (snapshot) => {
    if (!snapshot.exists()) return;

    document.getElementById("crr").textContent = data.crr || "0.00";
document.getElementById("rrr").textContent = data.rrr || "-";
document.getElementById("lastOver").textContent = data.lastOver || "-";
document.getElementById("partnership").textContent = data.partnership || "-";
document.getElementById("matchPhase").textContent = data.matchPhase || "";
document.getElementById("toss").textContent = data.toss || "";

    const data = snapshot.data();

    document.getElementById("team1").textContent = data.team1 || "";
    document.getElementById("team2").textContent = data.team2 || "";

    document.getElementById("runs").textContent = data.runs || 0;
    document.getElementById("wickets").textContent = data.wickets || 0;
    document.getElementById("overs").textContent = data.overs || "0.0";

    document.getElementById("crr").textContent = data.crr || "0.00";

    document.getElementById("batsman1").textContent = data.batsman1 || "";
    document.getElementById("batsman1Runs").textContent = data.batsman1Runs || "";

    document.getElementById("batsman2").textContent = data.batsman2 || "";
    document.getElementById("batsman2Runs").textContent = data.batsman2Runs || "";

    document.getElementById("bowler").textContent = data.bowler || "";
    document.getElementById("bowlerFigures").textContent = data.bowlerFigures || "";

    document.getElementById("target").textContent = data.target || "";
    document.getElementById("status").textContent = data.status || "";

    document.getElementById("batsman1Runs").textContent = data.batsman1Runs || "0 (0)";
    document.getElementById("batsman2Runs").textContent = data.batsman2Runs || "0 (0)";
    
    document.getElementById("bowlerFigures").textContent = data.bowlerFigures || "-";
    document.getElementById("crr").textContent = data.crr || "0.00";

    document.getElementById("rrr").textContent = data.rrr || "0.00";
document.getElementById("lastOver").textContent = data.lastOver || "-";
document.getElementById("partnership").textContent = data.partnership || "-";
document.getElementById("matchPhase").textContent = data.matchPhase || "-";
document.getElementById("toss").textContent = data.toss || "-";
});
