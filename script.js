// sync.js - node-fetch version
import admin from 'firebase-admin';
import fetch from 'node-fetch';

// ===============================
// Firebase Initialization
// ===============================
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// ===============================
// Configuration
// ===============================
const API_KEY = process.env.API_KEY;
const RAPIDAPI_HEADERS = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

// ===============================
// Helper Functions (using fetch)
// ===============================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const apiCall = async (url, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            console.log(`📡 Fetching: ${url}`);
            const response = await fetch(url, { headers: RAPIDAPI_HEADERS });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`❌ Attempt ${i + 1} failed:`, error.message);
            if (i === retries) throw error;
            await delay(2000 * (i + 1));
        }
    }
};

// ===============================
// Main Sync Function
// ===============================
async function syncCricketData() {
    try {
        console.log('🚀 Starting Cricket Data Sync...');
        console.log(`📝 API Key exists: ${!!API_KEY}`);
        console.log(`📝 API Key length: ${API_KEY?.length || 0}`);
        console.log(`📝 Firebase initialized: ${admin.apps.length > 0}`);

        // Step 1: Get Live Matches
        console.log('\n📊 Fetching live matches...');
        const liveData = await apiCall('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live');
        
        // Store matches
        await db.collection('scoreboard').doc('matches').set({
            data: liveData,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('✅ Live matches stored');

        // Step 2: Get Selected Match
        console.log('\n📋 Fetching settings...');
        const settingsDoc = await db.collection('scoreboard').doc('settings').get();
        const selectedMatchId = settingsDoc.data()?.selectedMatchId;

        if (!selectedMatchId) {
            console.log('⚠️ No match selected in settings');
            return;
        }
        console.log(`✅ Selected match ID: ${selectedMatchId}`);

        // Step 3: Get Match Details
        console.log('\n🏏 Fetching match details...');
        let matchDetails = null;
        
        // Try hscard endpoint first
        try {
            matchDetails = await apiCall(`https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${selectedMatchId}/hscard`);
            console.log('✅ HSCARD endpoint success');
        } catch (error) {
            console.log('⚠️ HSCARD failed, trying scard...');
            try {
                matchDetails = await apiCall(`https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${selectedMatchId}/scard`);
                console.log('✅ SCARD endpoint success');
            } catch (error2) {
                console.log('⚠️ SCARD also failed');
                // Try to find match in live data
                const matches = liveData.matches || liveData || [];
                const match = matches.find(m => m.id === selectedMatchId || m.matchId === selectedMatchId);
                if (match) {
                    matchDetails = match;
                    console.log('✅ Found match in live data');
                }
            }
        }

        if (!matchDetails) {
            console.log('❌ No match details found');
            return;
        }

        // Step 4: Process and Store
        console.log('\n💾 Processing match data...');
        const processedData = {
            teams: {
                team1: matchDetails.team1 || matchDetails.team1Name || { name: 'Team 1' },
                team2: matchDetails.team2 || matchDetails.team2Name || { name: 'Team 2' }
            },
            score: {
                team1: matchDetails.score?.team1 || matchDetails.team1Score || { runs: 0, wickets: 0, overs: '0.0' },
                team2: matchDetails.score?.team2 || matchDetails.team2Score || { runs: 0, wickets: 0, overs: '0.0' }
            },
            batsmen: matchDetails.batsmen || matchDetails.batsman || [],
            bowler: matchDetails.bowler || matchDetails.bowlers || { name: '', figures: '' },
            partnership: matchDetails.partnership || { runs: 0, balls: 0 },
            runRate: matchDetails.runRate || matchDetails.crr || 0,
            requiredRunRate: matchDetails.requiredRunRate || matchDetails.rrr || 0,
            matchPhase: matchDetails.matchPhase || matchDetails.status || 'Live',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('scoreboard').doc('live').set(processedData, { merge: true });
        console.log('✅ Match data stored successfully');

        console.log('\n🎉 Sync completed successfully!');

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        throw error;
    }
}

// ===============================
// Execute
// ===============================
syncCricketData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('🔥 Sync failed:', error.message);
        process.exit(1);
    });
