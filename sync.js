// sync.js - Complete Fixed Version
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
// Helper Functions
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
// Extract Match ID from Live Data
// ===============================
function extractMatchId(liveData, selectedMatchId) {
    // Try different possible structures
    const matches = liveData.matches || liveData.matchList || liveData.data || [];
    
    // If matches is not an array, try to find it
    let matchArray = [];
    if (Array.isArray(matches)) {
        matchArray = matches;
    } else if (typeof matches === 'object') {
        // Sometimes the data is nested deeper
        matchArray = Object.values(matches).flat();
    }
    
    console.log(`🔍 Found ${matchArray.length} matches in live data`);
    
    // Find the match
    const match = matchArray.find(m => 
        m.id === selectedMatchId || 
        m.matchId === selectedMatchId ||
        m.match_id === selectedMatchId ||
        String(m.id) === String(selectedMatchId)
    );
    
    return match;
}

// ===============================
// Get Correct Match ID Format
// ===============================
function getCricbuzzMatchId(match) {
    // Cricbuzz API uses numeric IDs for hscard endpoint
    // The ID from live matches might be different
    return match.matchId || match.id || match.match_id;
}

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

        // Step 3: Find match in live data
        const match = extractMatchId(liveData, selectedMatchId);
        
        if (!match) {
            console.log('❌ Match not found in live data');
            console.log('📋 Available matches:', Object.keys(liveData));
            return;
        }

        // Step 4: Get the correct match ID format
        const cricbuzzMatchId = getCricbuzzMatchId(match);
        console.log(`🔑 Cricbuzz Match ID: ${cricbuzzMatchId}`);

        // Step 5: Get Match Details
        console.log('\n🏏 Fetching match details...');
        let matchDetails = null;
        
        // Try with numeric ID first (Cricbuzz expects numeric)
        const numericId = parseInt(cricbuzzMatchId) || cricbuzzMatchId;
        
        // Try multiple endpoints with both ID formats
        const endpointsToTry = [
            `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${numericId}/hscard`,
            `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${cricbuzzMatchId}/hscard`,
            `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${numericId}/scard`,
            `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${cricbuzzMatchId}/scard`
        ];

        for (const endpoint of endpointsToTry) {
            try {
                matchDetails = await apiCall(endpoint);
                console.log(`✅ Endpoint success: ${endpoint}`);
                break;
            } catch (error) {
                console.log(`⚠️ Endpoint failed: ${endpoint}`);
            }
        }

        // If all endpoints fail, use the match data from live
        if (!matchDetails) {
            console.log('⚠️ Using match data from live matches');
            matchDetails = match;
        }

        // Step 6: Process and Store
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
            matchResult: matchDetails.result || '',
            venue: matchDetails.venue || '',
            tossWinner: matchDetails.tossWinner || '',
            tossDecision: matchDetails.tossDecision || '',
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        };

        // Store in Firebase
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
