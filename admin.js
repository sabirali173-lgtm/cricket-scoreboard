import { db, doc, onSnapshot } from "./firebase.js";

const scoreRef = doc(db, "scoreboard", "live");

onSnapshot(scoreRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const data = snapshot.data();

    document.body.innerHTML = `
    <div style="width:100%;height:100vh;background:#111;color:#fff;
    display:flex;justify-content:center;align-items:center;
    font-family:Arial,sans-serif;font-size:38px;">
        <div>
            <h1>${data.team1} ${data.runs}/${data.wickets}</h1>
            <h2>Overs : ${data.overs}</h2>
            <h3>${data.batsman1} & ${data.batsman2}</h3>
            <h4>Bowler : ${data.bowler}</h4>
            <h4>Target : ${data.target}</h4>
            <h4>Status : ${data.status}</h4>
        </div>
    </div>`;
});
