import { db, doc, onSnapshot } from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

// Local fallback logos
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

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value ?? "";
    }
}

function setImage(id, src) {
    const img = document.getElementById(id);
    if (img && src) {
        img.src = src;
    }
}

onSnapshot(scoreRef, (snapshot) => {

    if (!snapshot.exists()) return;

    const data = snapshot.data();

    console.log("LIVE SCORE:", data);

    // ===========================
    // Teams
    // ===========================
    setText("team1", data.team1 || "");
    setText("team2", data.team2 || "");

    // ===========================
    // Team Logos
    // ===========================
    setImage(
        "team1Logo",
        data.team1Logo ||
        teamLogos[data.team1] ||
        ""
    );

    setImage(
        "team2Logo",
        data.team2Logo ||
        teamLogos[data.team2] ||
        ""
    );

    // ===========================
    // Score
    // ===========================
    setText("runs", data.runs ?? 0);
    setText("wickets", data.wickets ?? 0);
    setText("overs", data.overs ?? "0.0");

    // ===========================
    // Run Rate
    // ===========================
    setText("crr", data.crr || data.CRR || "0.00");
    setText("rrr", data.rrr || data.RRR || "-");

    // ===========================
    // Batsmen
    // ===========================
    setText("batsman1", data.batsman1 || "-");
    setText("batsman1Runs", data.batsman1Runs || "0 (0)");

    setText("batsman2", data.batsman2 || "-");
    setText("batsman2Runs", data.batsman2Runs || "0 (0)");

    // ===========================
    // Bowler
    // ===========================
    setText("bowler", data.bowler || "-");
    setText("bowlerFigures", data.bowlerFigures || "-");

    // ===========================
    // Match
    // ===========================
    setText("target", data.target || "-");
    setText("status", data.status || "");
    setText("match", data.match || "");
    setText("venue", data.venue || "");

    // ===========================
    // Toss
    // ===========================
    setText(
        "toss",
        data.toss ||
        (data.tossWinner
            ? `${data.tossWinner} won toss & chose ${data.tossChoice}`
            : "-")
    );

    // ===========================
    // Match Phase
    // ===========================
    setText("matchPhase", data.matchPhase || "-");

    // ===========================
    // Partnership
    // ===========================
    setText("partnership", data.partnership || "-");

    // ===========================
    // Last Over
    // ===========================
    setText("lastOver", data.lastOver || "-");

});
