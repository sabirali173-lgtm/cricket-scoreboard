// debug.js - Fixed with Firebase Upload logic
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';

// 👇 YAHAN APNI FIREBASE CONFIG KEYS PASTE KAREIN (Admin wali same keys) 👇
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// GitHub Actions mein API_KEY environment variable se lega
const API_KEY = process.env.API_KEY;

// Agar local testing ke liye, direct key bhi daal sakte ho (Comment remove kar dein)
// const API_KEY = "your_rapidapi_key_here";

const headers = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function debugAPI() {
    try {
        console.log('🔍 Fetching API data...');
        if (!API_KEY) {
            console.error('❌ API_KEY is not set!');
            return;
        }
        
        const response = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', { headers });
        if (!response.ok) {
            console.error(`❌ API Error: ${response.status}`);
            return;
        }
        
        const data = await response.json();
        let matchesList = {};

        console.log('📊 Parsing matches from API...');

        // API JSON structure ko traverse karna
        if (data.typeMatches) {
            for (const type of data.typeMatches) {
                if (type.seriesMatches) {
                    for (const series of type.seriesMatches) {
                        if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                            for (const matchWrapper of series.seriesAdWrapper.matches) {
                                const info = matchWrapper.matchInfo;
                                if (info && info.matchId) {
                                    // Team ka full naam nikaalna (SName ya Name)
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

        // ✅ FIREBASE MEIN SAVE KARNA (Sabse zaroori step!)
        if (Object.keys(matchesList).length > 0) {
            const matchesRef = ref(db, 'cricket-scoreboard/availableMatches');
            await set(matchesRef, matchesList);
            
            console.log(`\n🎉 SUCCESS! ${Object.keys(matchesList).length} matches uploaded to Firebase!`);
            console.log('Ab apne Admin Panel par ja kar "Refresh Live Matches" dabayein.');
        } else {
            console.log('\n⚠️ Koi match nahi mila API mein.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

debugAPI();
