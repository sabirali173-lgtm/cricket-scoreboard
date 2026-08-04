import fetch from 'node-fetch';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// (dotenv hata diya gaya hai, ab hum GitHub Actions ke env variable ko seedha use karenge)

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ✅ Firebase Admin SDK INITIALIZE (For Firestore)
let db;
try {
    const filePath = path.join(__dirname, 'serviceAccountKey.json');
    const serviceAccount = JSON.parse(readFileSync(filePath, 'utf8'));
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    // Firestore instance
    db = admin.firestore();
    console.log("✅ Firebase Admin (Firestore) Initialized");
} catch (error) {
    console.error("❌ Firebase Init Error. serviceAccountKey.json check karein.", error.message);
    process.exit(1);
}

// 🔑 GitHub Actions ka environment variable seedha use kiya
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error("❌ API_KEY environment variable set nahi hai!");
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
        let matchesList = [];
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
                                    
                                    matchesList.push({
                                        id: String(info.matchId),
                                        title: `${team1Name} vs ${team2Name}`,
                                        team1: team1Name,
                                        team2: team2Name,
                                        status: info.status,
                                        format: info.matchFormat
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // ✅ FIRESTORE MEIN SAVE
        if (matchesList.length > 0) {
            const docRef = db.collection('scoreboard').doc('availableMatches');
            await docRef.set({ list: matchesList });
            console.log(`\n🎉 SUCCESS! ${matchesList.length} matches uploaded to Firestore!`);
            console.log('Ab admin.html par "Refresh Live Matches" dabayein!');
        } else {
            console.log('\n⚠️ Koi match nahi mila API mein.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugAPI();
