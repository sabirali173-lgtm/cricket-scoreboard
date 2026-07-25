import { db, doc, onSnapshot } from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

// TEAM LOGOS
const teamLogos = {
    "Pakistan": "images/teams/pakistan.png",
    "India": "images/teams/india.png",
    "Australia": "images/teams/australia.png",
    "England": "images/teams/england.png",
    "South Africa": "images/teams/south-africa.png",
    "New Zealand": "images/teams/new-zealand.png",
    "West Indies": "images/teams/west-indies.png",
    "Sri Lanka": "images/teams/sri-lanka.png",
    "Bangladesh": "images/teams/bangladesh.png",
    "Afghanistan": "images/teams/afghanistan.png",
    "Zimbabwe": "images/teams/zimbabwe.png",
    "Ireland": "images/teams/ireland.png",
    "Netherlands": "images/teams/netherlands.png"
};

onSnapshot(scoreRef, (snapshot) => {

    if (!snapshot.exists()) return;

    const data = snapshot.data();
    console.log(data);

    // Teams
    document.getElementById("team1").textContent = data.team1 || "";
    document.getElementById("team2").textContent = data.team2 || "";

    // Team Logos
    if (document.getElementById("team1Logo")) {
        document.getElementById("team1Logo").src =
            teamLogos[data.team1] || "";
    }

    if (document.getElementById("team2Logo")) {
        document.getElementById("team2Logo").src =
            teamLogos[data.team2] || "";
    }

    // Score
    document.getElementById("runs").textContent = data.runs || 0;
    document.getElementById("wickets").textContent = data.wickets || 0;
    document.getElementById("overs").textContent = data.overs || "0.0";

    // Run Rates
    document.getElementById("crr").textContent =
        data.CRR || data.crr || "0.00";

    if (document.getElementById("rrr")) {
        document.getElementById("rrr").textContent =
            data.RRR || data.rrr || "-";
    }

    // Batsmen
    document.getElementById("batsman1").textContent =
        data.batsman1 || "";

    document.getElementById("batsman1Runs").textContent =
        data.batsman1Runs || "0 (0)";

    document.getElementById("batsman2").textContent =
        data.batsman2 || "";

    document.getElementById("batsman2Runs").textContent =
        data.batsman2Runs || "0 (0)";

    // Bowler
    document.getElementById("bowler").textContent =
        data.bowler || "";

    document.getElementById("bowlerFigures").textContent =
        data.bowlerFigures || "-";

    // Match Info
    document.getElementById("target").textContent =
        data.target || "";

    document.getElementById("status").textContent =
        data.status || "";

    // Extra Info
    if (document.getElementById("lastOver")) {
        document.getElementById("lastOver").textContent =
            data["Last over"] || data.lastOver || "-";
    }

    if (document.getElementById("partnership")) {
        document.getElementById("partnership").textContent =
            data.Partnership || data.partnership || "-";
    }

    if (document.getElementById("matchPhase")) {
        document.getElementById("matchPhase").textContent =
            data.Matchphase || data.matchPhase || "-";
    }

    if (document.getElementById("toss")) {
        document.getElementById("toss").textContent =
            data.Toss || data.toss || "-";
    }

});
