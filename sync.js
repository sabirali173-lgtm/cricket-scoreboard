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
// Extract All Matches from Live Data
// ===============================
function extractAllMatches(liveData) {
    const allMatches = [];
    
    // Check if liveData has typeMatches
    if (liveData.typeMatches && Array.isArray(liveData.typeMatches)) {
        for (const typeMatch of liveData.typeMatches) {
            if (typeMatch.seriesMatches && Array.isArray(typeMatch.seriesMatches)) {
                for (const series of typeMatch.seriesMatches) {
                    if (series.matches && Array.isArray(series.matches)) {
                        // Add match type and series info to each match
                        for (const match of series.matches) {
                            allMatches.push({
                                ...match,
                                matchType: typeMatch.matchType || '',
                                seriesName: series.seriesName || '',
                                seriesId: series.seriesId || ''
                            });
                        }
                    }
                }
            }
        }
    }
    
    // If no matches found, try other possible structures
    if (allMatches.length === 0) {
        // Try to find matches in other keys
        for (const key of Object.keys(liveData)) {
            if (Array.isArray(liveData[key])) {
                for (const item of liveData[key]) {
                    if (item.matches && Array.isArray(item.matches)) {
                        for (const match of item.matches) {
                            allMatches.push(match);
                        }
                    }
                }
            }
        }
    }
    
    console.log(`🔍 Found ${allMatches.length} matches in live data`);
    return allMatches;
}

// ===============================
// Find Match by ID
// ===============================
function findMatchById(allMatches, selectedMatchId) {
    // Try different ID fields
    return allMatches.find(match => {
        const matchId = match.matchId || match.id || match.match_id || match.matchid;
        return String(matchId) === String(selectedMatchId);
    });
}

// ===============================
// Get Match Info for Display
// ===============================
function getMatchDisplayName(match) {
    const team1 = match.team1?.name || match.team1Name || 'Team 1';
    const team2 = match.team2?.name || match.team2Name || 'Team 2';
    const status = match.status || match.matchStatus || 'Upcoming';
    const matchDesc = match.matchDesc || match.matchDescription || '';
    return `${team1} vs ${team2} | ${matchDesc} | ${status}`;
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
        
        // Extract all matches
        const allMatches = extractAllMatches(liveData);
        
        // Store full live data in Firebase
        await db.collection('scoreboard').doc('matches').set({
            data: liveData,
            matchesList: allMatches,
            totalMatches: allMatches.length,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Live matches stored (${allMatches.length} matches)`);

        // Step 2: Get Selected Match
        console.log('\n📋 Fetching settings...');
        const settingsDoc = await db.collection('scoreboard').doc('settings').get();
        const selectedMatchId = settingsDoc.data()?.selectedMatchId;

        if (!selectedMatchId) {
            console.log('⚠️ No match selected in settings');
            return;
        }
        console.log(`✅ Selected match ID: ${selectedMatchId}`);

        // Step 3: Find the selected match
        const selectedMatch = findMatchById(allMatches, selectedMatchId);
        
        if (!selectedMatch) {
            console.log('❌ Match not found in live data');
            console.log('📋 Available matches:');
            allMatches.slice(0, 5).forEach((match, index) => {
                console.log(`  ${index + 1}. ${getMatchDisplayName(match)}`);
            });
            if (allMatches.length > 5) {
                console.log(`  ... and ${allMatches.length - 5} more matches`);
            }
            return;
        }

        console.log(`✅ Found match: ${getMatchDisplayName(selectedMatch)}`);

        // Step 4: Get the correct match ID
        const matchId = selectedMatch.matchId || selectedMatch.id || selectedMatch.match_id;
        console.log(`🔑 Match ID: ${matchId}`);

        // Step 5: Get Match Details
        console.log('\n🏏 Fetching match details...');
        let matchDetails = null;
        
        // Try different endpoints with different ID formats
        const endpointsToTry = [
            `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/hscard`,
            `https://cricbuzz-cricket.p.rapidapi.com/mcenter/v1/${matchId}/scard`,
            `https://cricbuzz-cricket.p.rapidapi.com/cricket/v1/match/${matchId}/score`
        ];

        for (const endpoint of endpointsToTry) {
            try {
                matchDetails = await apiCall(endpoint);
                console.log(`✅ Success with: ${endpoint}`);
                break;
            } catch (error) {
                console.log(`⚠️ Failed: ${endpoint}`);
            }
        }

        // If all endpoints fail, use the match data from live
        if (!matchDetails) {
            console.log('⚠️ Using match data from live response');
            matchDetails = selectedMatch;
        }

        // Step 6: Process and Store
        console.log('\n💾 Processing match data...');
        const processedData = {
            matchId: matchId,
            matchType: selectedMatch.matchType || '',
            seriesName: selectedMatch.seriesName || '',
            matchDesc: selectedMatch.matchDesc || selectedMatch.matchDescription || '',
            teams: {
                team1: selectedMatch.team1 || { name: 'Team 1' },
                team2: selectedMatch.team2 || { name: 'Team 2' }
            },
            score: {
                team1: matchDetails.score?.team1 || selectedMatch.team1Score || { runs: 0, wickets: 0, overs: '0.0' },
                team2: matchDetails.score?.team2 || selectedMatch.team2Score || { runs: 0, wickets: 0, overs: '0.0' }
            },
            batsmen: matchDetails.batsmen || selectedMatch.batsmen || [],
            bowler: matchDetails.bowler || selectedMatch.bowler || { name: '', figures: '' },
            partnership: matchDetails.partnership || selectedMatch.partnership || { runs: 0, balls: 0 },
            runRate: matchDetails.runRate || matchDetails.crr || selectedMatch.crr || 0,
            requiredRunRate: matchDetails.requiredRunRate || matchDetails.rrr || selectedMatch.rrr || 0,
            matchPhase: matchDetails.matchPhase || matchDetails.status || selectedMatch.status || 'Live',
            matchStatus: selectedMatch.status || '',
            matchResult: matchDetails.result || selectedMatch.result || '',
            venue: matchDetails.venue || selectedMatch.venue || '',
            tossWinner: matchDetails.tossWinner || selectedMatch.tossWinner || '',
            tossDecision: matchDetails.tossDecision || selectedMatch.tossDecision || '',
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
