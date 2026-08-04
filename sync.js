// sync.js - Production Ready
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
// Extract All Matches from Cricbuzz Response
// ===============================
function extractAllMatches(liveData) {
    const allMatches = [];
    
    if (!liveData.typeMatches || !Array.isArray(liveData.typeMatches)) {
        console.log('⚠️ No typeMatches found in response');
        return allMatches;
    }
    
    for (const typeMatch of liveData.typeMatches) {
        const matchType = typeMatch.matchType || 'Unknown';
        
        if (!typeMatch.seriesMatches || !Array.isArray(typeMatch.seriesMatches)) {
            continue;
        }
        
        for (const series of typeMatch.seriesMatches) {
            const seriesAdWrapper = series.seriesAdWrapper;
            if (!seriesAdWrapper || !seriesAdWrapper.matches) {
                continue;
            }
            
            const seriesName = seriesAdWrapper.seriesName || 'Unknown Series';
            const seriesId = seriesAdWrapper.seriesId || '';
            
            for (const match of seriesAdWrapper.matches) {
                const matchInfo = match.matchInfo;
                const matchScore = match.matchScore;
                
                if (matchInfo) {
                    allMatches.push({
                        matchInfo: matchInfo,
                        matchScore: matchScore,
                        matchType: matchType,
                        seriesName: seriesName,
                        seriesId: seriesId
                    });
                }
            }
        }
    }
    
    console.log(`🔍 Found ${allMatches.length} matches in live data`);
    return allMatches;
}

// ===============================
// Get Match ID
// ===============================
function getMatchId(match) {
    return match.matchInfo?.matchId || match.matchId || null;
}

// ===============================
// Get Team Name
// ===============================
function getTeamName(team) {
    if (!team) return 'Team';
    return team.teamName || team.name || 'Team';
}

// ===============================
// Get Team Short Name
// ===============================
function getTeamShortName(team) {
    if (!team) return '';
    return team.teamSName || team.shortName || '';
}

// ===============================
// Get Team Logo
// ===============================
function getTeamLogo(team) {
    if (!team || !team.imageId) return '';
    return `https://www.cricbuzz.com/a/img/v1/${team.imageId}/i1.jpg`;
}

// ===============================
// Process Match Score
// ===============================
function processScore(score) {
    if (!score) return { runs: 0, wickets: 0, overs: '0.0' };
    
    // Get the latest innings
    const inngs = score.inngs1 || score.inngs2 || score.inngs || {};
    return {
        runs: inngs.runs || 0,
        wickets: inngs.wickets || 0,
        overs: inngs.overs ? inngs.overs.toString() : '0.0'
    };
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
            console.log('📋 Available matches:');
            allMatches.forEach((match, index) => {
                const id = getMatchId(match);
                const team1 = getTeamName(match.matchInfo?.team1);
                const team2 = getTeamName(match.matchInfo?.team2);
                const status = match.matchInfo?.status || 'Unknown';
                console.log(`  ${index + 1}. ID: ${id} | ${team1} vs ${team2} | ${status}`);
            });
            return;
        }
        console.log(`✅ Selected match ID: ${selectedMatchId}`);

        // Step 3: Find the selected match
        const selectedMatch = allMatches.find(match => {
            const id = getMatchId(match);
            return String(id) === String(selectedMatchId);
        });
        
        if (!selectedMatch) {
            console.log('❌ Match not found in live data');
            console.log(`📋 Available match IDs:`);
            allMatches.forEach((match) => {
                console.log(`  ${getMatchId(match)}`);
            });
            return;
        }

        const matchInfo = selectedMatch.matchInfo;
        const matchScore = selectedMatch.matchScore;
        const team1 = matchInfo.team1;
        const team2 = matchInfo.team2;
        
        console.log(`✅ Found match: ${getTeamName(team1)} vs ${getTeamName(team2)}`);
        console.log(`📊 Status: ${matchInfo.status}`);
        console.log(`🏏 Format: ${matchInfo.matchFormat}`);

        // Step 4: Process Match Data
        console.log('\n💾 Processing match data...');
        
        // Get scores
        const team1Score = matchScore?.team1Score ? processScore(matchScore.team1Score) : { runs: 0, wickets: 0, overs: '0.0' };
        const team2Score = matchScore?.team2Score ? processScore(matchScore.team2Score) : { runs: 0, wickets: 0, overs: '0.0' };
        
        // Determine batting team
        const battingTeamId = matchInfo.currBatTeamId || '';
        const isTeam1Batting = battingTeamId === team1?.teamId;
        
        const processedData = {
            matchId: matchInfo.matchId,
            matchType: selectedMatch.matchType || '',
            seriesName: matchInfo.seriesName || selectedMatch.seriesName || '',
            matchDesc: matchInfo.matchDesc || '',
            matchFormat: matchInfo.matchFormat || '',
            state: matchInfo.state || '',
            status: matchInfo.status || '',
            stateTitle: matchInfo.stateTitle || '',
            
            teams: {
                team1: {
                    id: team1?.teamId || '',
                    name: getTeamName(team1),
                    shortName: getTeamShortName(team1),
                    logo: getTeamLogo(team1)
                },
                team2: {
                    id: team2?.teamId || '',
                    name: getTeamName(team2),
                    shortName: getTeamShortName(team2),
                    logo: getTeamLogo(team2)
                }
            },
            
            score: {
                team1: team1Score,
                team2: team2Score
            },
            
            batting: {
                teamId: battingTeamId,
                teamName: battingTeamId === team1?.teamId ? getTeamName(team1) : 
                          battingTeamId === team2?.teamId ? getTeamName(team2) : '',
                isTeam1Batting: isTeam1Batting
            },
            
            venue: {
                id: matchInfo.venueInfo?.id || '',
                ground: matchInfo.venueInfo?.ground || '',
                city: matchInfo.venueInfo?.city || '',
                timezone: matchInfo.venueInfo?.timezone || ''
            },
            
            isLiveStreamEnabled: matchInfo.livestreamEnabled || false,
            
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
