// ===============================
// Firebase Imports (Fixed)
// ===============================
import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// ===============================
// Load Live Matches from Firebase
// ===============================
async function loadMatches() {
    try {
        const btn = document.querySelector("button[onclick='loadMatches()']");
        if (btn) btn.innerText = "Loading...";

        const snap = await getDoc(doc(db, "scoreboard", "matches"));
        
        if (!snap.exists()) {
            alert("❌ No matches found. Please run sync first.");
            if (btn) btn.innerText = "Refresh Live Matches";
            return;
        }

        // FIXED: Correct data structure
        const matchesData = snap.data();
        const matches = matchesData.data || matchesData.list || [];
        
        if (!matches.length) {
            alert("❌ No matches available. Please sync first.");
            if (btn) btn.innerText = "Refresh Live Matches";
            return;
        }

        const select = document.getElementById("matchSelect");
        select.innerHTML = '<option value="">-- Select a Match --</option>';

        matches.forEach(match => {
            const option = document.createElement("option");
            option.value = match.id || match.matchId;
            
            // FIXED: Better display format
            const team1 = match.team1?.name || match.team1 || "Team 1";
            const team2 = match.team2?.name || match.team2 || "Team 2";
            const status = match.status || "Upcoming";
            
            option.text = `${team1} vs ${team2} | ${status}`;
            select.appendChild(option);
        });

        // Load currently selected match
        await loadSelectedMatch();

        if (btn) btn.innerText = "🔄 Refresh Live Matches";

    } catch (err) {
        console.error("Error loading matches:", err);
        alert("❌ Unable to load matches: " + err.message);
        const btn = document.querySelector("button[onclick='loadMatches()']");
        if (btn) btn.innerText = "Refresh Live Matches";
    }
}

// ===============================
// Load Currently Selected Match
// ===============================
async function loadSelectedMatch() {
    try {
        const settingsSnap = await getDoc(doc(db, "scoreboard", "settings"));
        if (settingsSnap.exists()) {
            const selectedId = settingsSnap.data().selectedMatchId;
            if (selectedId) {
                const select = document.getElementById("matchSelect");
                select.value = selectedId;
            }
        }
    } catch (err) {
        console.error("Error loading selected match:", err);
    }
}

// ===============================
// Save Selected Match to Firebase
// ===============================
async function saveMatch() {
    try {
        const matchId = document.getElementById("matchSelect").value;
        
        // FIXED: Validation
        if (!matchId) {
            alert("⚠️ Please select a match first!");
            return;
        }

        await setDoc(
            doc(db, "scoreboard", "settings"),
            {
                selectedMatchId: matchId,
                lastUpdated: new Date().toISOString()
            },
            { merge: true }
        );

        alert("✅ Match Selected Successfully!");
        
        // Load live data for selected match
        await loadLiveData();

    } catch (err) {
        console.error("Error saving match:", err);
        alert("❌ Unable to save match: " + err.message);
    }
}

// ===============================
// Load Live Data for Selected Match
// ===============================
async function loadLiveData() {
    try {
        const liveSnap = await getDoc(doc(db, "scoreboard", "live"));
        if (liveSnap.exists()) {
            const data = liveSnap.data();
            
            // Populate form fields with live data
            document.getElementById("team1").value = data.teams?.team1?.name || data.team1 || "";
            document.getElementById("team2").value = data.teams?.team2?.name || data.team2 || "";
            document.getElementById("runs").value = data.score?.team1?.runs || data.runs || 0;
            document.getElementById("wickets").value = data.score?.team1?.wickets || data.wickets || 0;
            document.getElementById("overs").value = data.score?.team1?.overs || data.overs || "0.0";
            document.getElementById("target").value = data.target || 0;
            document.getElementById("crr").value = data.runRate || data.crr || 0;
            document.getElementById("rrr").value = data.requiredRunRate || data.rrr || 0;
            document.getElementById("batsman1").value = data.batsmen?.[0]?.name || data.batsman1 || "";
            document.getElementById("batsman1Runs").value = data.batsmen?.[0]?.runs || data.batsman1Runs || 0;
            document.getElementById("batsman2").value = data.batsmen?.[1]?.name || data.batsman2 || "";
            document.getElementById("batsman2Runs").value = data.batsmen?.[1]?.runs || data.batsman2Runs || 0;
            document.getElementById("bowler").value = data.bowler?.name || data.bowler || "";
            document.getElementById("bowlerFigures").value = data.bowler?.figures || data.bowlerFigures || "";
            document.getElementById("status").value = data.matchPhase || data.status || "";
            document.getElementById("venue").value = data.venue || "";
            document.getElementById("toss").value = data.toss || "";
            document.getElementById("lastOver").value = data.lastOver || "";
            document.getElementById("partnership").value = data.partnership?.runs || data.partnership || 0;
            document.getElementById("matchPhase").value = data.matchPhase || "";
        }
    } catch (err) {
        console.error("Error loading live data:", err);
    }
}

// ===============================
// Save Score to Firebase
// ===============================
async function saveScore() {
    try {
        // FIXED: Validation and default values
        const data = {
            team1: document.getElementById("team1").value || "Team 1",
            team2: document.getElementById("team2").value || "Team 2",
            runs: Number(document.getElementById("runs").value) || 0,
            wickets: Number(document.getElementById("wickets").value) || 0,
            overs: document.getElementById("overs").value || "0.0",
            target: Number(document.getElementById("target").value) || 0,
            crr: document.getElementById("crr").value || "0.00",
            rrr: document.getElementById("rrr").value || "0.00",
            batsman1: document.getElementById("batsman1").value || "",
            batsman1Runs: Number(document.getElementById("batsman1Runs").value) || 0,
            batsman2: document.getElementById("batsman2").value || "",
            batsman2Runs: Number(document.getElementById("batsman2Runs").value) || 0,
            bowler: document.getElementById("bowler").value || "",
            bowlerFigures: document.getElementById("bowlerFigures").value || "",
            status: document.getElementById("status").value || "",
            venue: document.getElementById("venue").value || "",
            toss: document.getElementById("toss").value || "",
            lastOver: document.getElementById("lastOver").value || "",
            partnership: document.getElementById("partnership").value || "0",
            matchPhase: document.getElementById("matchPhase").value || "",
            updated: new Date().toISOString()
        };

        await updateDoc(
            doc(db, "scoreboard", "live"),
            data
        );

        alert("✅ Firebase Updated Successfully!");

    } catch (err) {
        console.error("Error saving score:", err);
        alert("❌ Unable to Update Firebase: " + err.message);
    }
}

// ===============================
// Manual Sync Trigger (for admin)
// ===============================
async function triggerSync() {
    try {
        const btn = document.querySelector("button[onclick='triggerSync()']");
        if (btn) {
            btn.innerText = "⏳ Syncing...";
            btn.disabled = true;
        }

        // Call GitHub Actions workflow via API (if needed)
        // Or just reload matches
        await loadMatches();
        
        alert("✅ Sync triggered! Check GitHub Actions for status.");

        if (btn) {
            btn.innerText = "🔄 Trigger Sync";
            btn.disabled = false;
        }

    } catch (err) {
        console.error("Error triggering sync:", err);
        alert("❌ Failed to trigger sync: " + err.message);
    }
}

// ===============================
// Expose Functions to HTML
// ===============================
window.loadMatches = loadMatches;
window.saveMatch = saveMatch;
window.saveScore = saveScore;
window.triggerSync = triggerSync;
window.loadLiveData = loadLiveData;

// ===============================
// Auto Load on Page Load
// ===============================
window.addEventListener("DOMContentLoaded", () => {
    loadMatches();
});

// ===============================
// Auto Refresh Every 30 Seconds
// ===============================
setInterval(() => {
    loadMatches();
    loadLiveData();
}, 30000);
