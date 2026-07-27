import {
    db,
    doc,
    onSnapshot
} from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

// ===============================
// Live Firebase Listener
// ===============================
onSnapshot(scoreRef, (snapshot) => {

    if (!snapshot.exists()) return;

    const data = snapshot.data();

    console.log("LIVE SCORE:", data);

    // ===============================
    // Teams
    // ===============================
    document.getElementById("team1").textContent =
        data.team1 || "";

    document.getElementById("team2").textContent =
        data.team2 || "";

    // ===============================
    // Team Logos
    // ===============================
    if (document.getElementById("team1Logo")) {

        document.getElementById("team1Logo").src =
            data.team1Logo || "";

    }

    if (document.getElementById("team2Logo")) {

        document.getElementById("team2Logo").src =
            data.team2Logo || "";

    }

    // ===============================
    // Score
    // ===============================
    document.getElementById("runs").textContent =
        data.runs ?? 0;

    document.getElementById("wickets").textContent =
        data.wickets ?? 0;

    document.getElementById("overs").textContent =
        data.overs ?? "0.0";

    // ===============================
    // Run Rates
    // ===============================
    if (document.getElementById("crr")) {

        document.getElementById("crr").textContent =
            data.crr || "-";

    }

    if (document.getElementById("rrr")) {

        document.getElementById("rrr").textContent =
            data.rrr || "-";

    }
      // ===============================
    // Batsmen
    // ===============================
    if (document.getElementById("batsman1")) {

        document.getElementById("batsman1").textContent =
            data.batsman1 || "-";

    }

    if (document.getElementById("batsman1Runs")) {

        document.getElementById("batsman1Runs").textContent =
            data.batsman1Runs || "0 (0)";

    }

    if (document.getElementById("batsman2")) {

        document.getElementById("batsman2").textContent =
            data.batsman2 || "-";

    }

    if (document.getElementById("batsman2Runs")) {

        document.getElementById("batsman2Runs").textContent =
            data.batsman2Runs || "0 (0)";

    }

    // ===============================
    // Bowler
    // ===============================
    if (document.getElementById("bowler")) {

        document.getElementById("bowler").textContent =
            data.bowler || "-";

    }

    if (document.getElementById("bowlerFigures")) {

        document.getElementById("bowlerFigures").textContent =
            data.bowlerFigures || "-";

    }

    // ===============================
    // Match Information
    // ===============================
    if (document.getElementById("target")) {

        document.getElementById("target").textContent =
            data.target || "-";

    }

    if (document.getElementById("status")) {

        document.getElementById("status").textContent =
            data.status || "";

    }

    if (document.getElementById("venue")) {

        document.getElementById("venue").textContent =
            data.venue || "";

    }

    if (document.getElementById("toss")) {

        document.getElementById("toss").textContent =
            data.toss ||
            `${data.tossWinner || ""} ${data.tossChoice || ""}`;

    }
      // ===============================
    // Last Over
    // ===============================
    if (document.getElementById("lastOver")) {

        document.getElementById("lastOver").textContent =
            data.lastOver || "-";

    }

    // ===============================
    // Partnership
    // ===============================
    if (document.getElementById("partnership")) {

        document.getElementById("partnership").textContent =
            data.partnership || "-";

    }

    // ===============================
    // Match Phase
    // ===============================
    if (document.getElementById("matchPhase")) {

        document.getElementById("matchPhase").textContent =
            data.matchPhase || "-";

    }

    // ===============================
    // Match Name
    // ===============================
    if (document.getElementById("match")) {

        document.getElementById("match").textContent =
            data.match || "";

    }

    // ===============================
    // Updated Time
    // ===============================
    if (document.getElementById("updated")) {

        const time = data.updated
            ? new Date(data.updated).toLocaleTimeString()
            : "--";

        document.getElementById("updated").textContent = time;

    }

    console.log("Overlay Updated Successfully");

});
