import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config(); // .env file ko load karein

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Firebase Admin SDK Initialize
let db;
try {
    // Step 1: Apni firebase ki Service Account JSON file yahan rakhni hai (neechay guide hai)
    const filePath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(readFileSync(filePath, 'utf8'));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        // Step 2: Apna database URL yahan daalein (Firebase Console se copy karein)
        databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com"
    });
    db = admin.database();
    console.log("✅ Firebase Admin Initialized");
} catch (error) {
    console.error("❌ Firebase Admin Init Error. Kya serviceAccountKey.json file folder mein hai?", error.message);
    process.exit(1);
}

// API Key (Ye .env file se aayega)
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error("❌ .env file mein API_KEY nahi mila!");
    process.exit(1);
}

const headers = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    'User-Agent': 'Mozilla/5.0'
};

async function debugAPI() {
    try {
        console.log('🔍 Fetching API data...');
        const response = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', { headers });
        
        if (!response.ok) {
            console.error(`❌ API Error: ${response.status}`);
            return;
        }
        
        const data = await response.json();
        let matchesList = {};
        console.log('📊 Parsing matches from API...');

        if (data.typeMatches) {
            for (const type of data.typeMatches) {
                if (type.seriesMatches) {
                    for (const series of type.seriesMatches) {
                        if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                            for (const matchWrapper of series.seriesAdWrapper.matches) {
                                const info = matchWrapper.matchInfo;
                                if (info && info.matchId) {
                                    const team1Name = info.team1?.teamName || "Team 1";
                                    const team2Name = info.team2?.teamName || "Team 2";
                                    
                                    matchesList[info.matchId] = {
                                        id: info.matchId,
                                        title: `${team1Name} vs ${team2Name}`,
                                        team1: team1Name,
                                        team2: team2Name,
                                        status: info.status,
                                        format: info.matchFormat
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }

        // ✅ FIREBASE MEIN SAVE KARNA
        if (Object.keys(matchesList).length > 0) {
            const matchesRef = db.ref('cricket-scoreboard/availableMatches');
            await matchesRef.set(matchesList);
            console.log(`\n🎉 SUCCESS! ${Object.keys(matchesList).length} matches uploaded to Firebase!`);
            console.log('Ab admin.html par "Refresh Live Matches" dabayein!');
        } else {
            console.log('\n⚠️ Koi match nahi mila API mein.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugAPI();
