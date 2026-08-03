// ===============================
// Firebase Configuration
// ===============================
import { 
    db,
    doc,
    onSnapshot,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit
} from "./firebase.js";

// ===============================
// DOM Elements
// ===============================
const elements = {
    // Match Info
    matchTitle: document.getElementById('matchTitle'),
    matchStatus: document.getElementById('matchStatus'),
    matchVenue: document.getElementById('matchVenue'),
    
    // Team 1
    team1Name: document.getElementById('team1Name'),
    team1Logo: document.getElementById('team1Logo'),
    team1Score: document.getElementById('team1Score'),
    team1Wickets: document.getElementById('team1Wickets'),
    team1Overs: document.getElementById('team1Overs'),
    team1RunRate: document.getElementById('team1RunRate'),
    
    // Team 2
    team2Name: document.getElementById('team2Name'),
    team2Logo: document.getElementById('team2Logo'),
    team2Score: document.getElementById('team2Score'),
    team2Wickets: document.getElementById('team2Wickets'),
    team2Overs: document.getElementById('team2Overs'),
    team2RunRate: document.getElementById('team2RunRate'),
    
    // Batsmen
    batsman1Name: document.getElementById('batsman1Name'),
    batsman1Runs: document.getElementById('batsman1Runs'),
    batsman1Balls: document.getElementById('batsman1Balls'),
    batsman1Fours: document.getElementById('batsman1Fours'),
    batsman1Sixes: document.getElementById('batsman1Sixes'),
    batsman1StrikeRate: document.getElementById('batsman1StrikeRate'),
    
    batsman2Name: document.getElementById('batsman2Name'),
    batsman2Runs: document.getElementById('batsman2Runs'),
    batsman2Balls: document.getElementById('batsman2Balls'),
    batsman2Fours: document.getElementById('batsman2Fours'),
    batsman2Sixes: document.getElementById('batsman2Sixes'),
    batsman2StrikeRate: document.getElementById('batsman2StrikeRate'),
    
    // Bowler
    bowlerName: document.getElementById('bowlerName'),
    bowlerOvers: document.getElementById('bowlerOvers'),
    bowlerRuns: document.getElementById('bowlerRuns'),
    bowlerWickets: document.getElementById('bowlerWickets'),
    bowlerEconomy: document.getElementById('bowlerEconomy'),
    
    // Partnership
    partnershipRuns: document.getElementById('partnershipRuns'),
    partnershipBalls: document.getElementById('partnershipBalls'),
    
    // Required
    requiredRuns: document.getElementById('requiredRuns'),
    requiredBalls: document.getElementById('requiredBalls'),
    requiredRunRate: document.getElementById('requiredRunRate'),
    
    // Extras
    totalExtras: document.getElementById('totalExtras'),
    totalWides: document.getElementById('totalWides'),
    totalNoBalls: document.getElementById('totalNoBalls'),
    totalByes: document.getElementById('totalByes'),
    totalLegByes: document.getElementById('totalLegByes'),
    
    // Match Phase
    matchPhase: document.getElementById('matchPhase'),
    matchResult: document.getElementById('matchResult'),
    
    // Last Over
    lastOver: document.getElementById('lastOver'),
    
    // Toss Info
    tossWinner: document.getElementById('tossWinner'),
    tossDecision: document.getElementById('tossDecision'),
    
    // Timestamp
    lastUpdated: document.getElementById('lastUpdated')
};

// ===============================
// Utility Functions
// ===============================
function formatTime(date) {
    if (!date) return '--:--:--';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
    });
}

function getMatchStatus(status) {
    const statusMap = {
        'live': '🟢 LIVE',
        'finished': '✅ COMPLETED',
        'upcoming': '⏳ UPCOMING',
        'stumps': '🛑 STUMPS',
        'rain': '☔ RAIN DELAY',
        'lunch': '🍽️ LUNCH BREAK',
        'tea': '☕ TEA BREAK',
        'innings_break': '🔄 INNINGS BREAK'
    };
    return statusMap[status?.toLowerCase()] || status || 'LIVE';
}

function getMatchPhase(phase) {
    const phaseMap = {
        '1st innings': '🏏 1st Innings',
        '2nd innings': '🏏 2nd Innings',
        '3rd innings': '🏏 3rd Innings',
        '4th innings': '🏏 4th Innings',
        '1st innings - break': '⏸️ Break',
        'match ended': '🏁 Match Ended'
    };
    return phaseMap[phase?.toLowerCase()] || phase || '';
}

// ===============================
// Update Functions
// ===============================
function updateScoreboard(data) {
    if (!data) {
        console.log('⚠️ No data received');
        return;
    }

    console.log('📊 Updating scoreboard:', data);

    // Match Info
    if (elements.matchTitle) {
        const team1 = data.teams?.team1?.name || data.team1 || 'Team 1';
        const team2 = data.teams?.team2?.name || data.team2 || 'Team 2';
        elements.matchTitle.textContent = `${team1} vs ${team2}`;
    }
    
    if (elements.matchStatus) {
        elements.matchStatus.textContent = getMatchStatus(data.matchPhase || data.status);
    }
    
    if (elements.matchVenue) {
        elements.matchVenue.textContent = data.venue || '';
    }

    // Team 1
    if (elements.team1Name) {
        elements.team1Name.textContent = data.teams?.team1?.name || data.team1 || 'Team 1';
    }
    
    if (elements.team1Logo) {
        const logo = data.teams?.team1?.logo || data.team1Logo || '';
        if (logo) {
            elements.team1Logo.src = logo;
            elements.team1Logo.style.display = 'inline';
        } else {
            elements.team1Logo.style.display = 'none';
        }
    }
    
    if (elements.team1Score) {
        elements.team1Score.textContent = data.score?.team1?.runs || data.runs || 0;
    }
    
    if (elements.team1Wickets) {
        elements.team1Wickets.textContent = data.score?.team1?.wickets || data.wickets || 0;
    }
    
    if (elements.team1Overs) {
        elements.team1Overs.textContent = data.score?.team1?.overs || data.overs || '0.0';
    }
    
    if (elements.team1RunRate) {
        elements.team1RunRate.textContent = data.runRate || data.crr || '0.00';
    }

    // Team 2
    if (elements.team2Name) {
        elements.team2Name.textContent = data.teams?.team2?.name || data.team2 || 'Team 2';
    }
    
    if (elements.team2Logo) {
        const logo = data.teams?.team2?.logo || data.team2Logo || '';
        if (logo) {
            elements.team2Logo.src = logo;
            elements.team2Logo.style.display = 'inline';
        } else {
            elements.team2Logo.style.display = 'none';
        }
    }
    
    if (elements.team2Score) {
        elements.team2Score.textContent = data.score?.team2?.runs || 0;
    }
    
    if (elements.team2Wickets) {
        elements.team2Wickets.textContent = data.score?.team2?.wickets || 0;
    }
    
    if (elements.team2Overs) {
        elements.team2Overs.textContent = data.score?.team2?.overs || '0.0';
    }
    
    if (elements.team2RunRate) {
        elements.team2RunRate.textContent = data.team2RunRate || '0.00';
    }

    // Batsman 1
    const batsman1 = data.batsmen?.[0] || data.batsman1 || {};
    if (elements.batsman1Name) {
        elements.batsman1Name.textContent = batsman1.name || 'Batsman 1';
    }
    if (elements.batsman1Runs) {
        elements.batsman1Runs.textContent = batsman1.runs || 0;
    }
    if (elements.batsman1Balls) {
        elements.batsman1Balls.textContent = batsman1.balls || 0;
    }
    if (elements.batsman1Fours) {
        elements.batsman1Fours.textContent = batsman1.fours || 0;
    }
    if (elements.batsman1Sixes) {
        elements.batsman1Sixes.textContent = batsman1.sixes || 0;
    }
    if (elements.batsman1StrikeRate) {
        elements.batsman1StrikeRate.textContent = batsman1.strikeRate || '0.00';
    }

    // Batsman 2
    const batsman2 = data.batsmen?.[1] || data.batsman2 || {};
    if (elements.batsman2Name) {
        elements.batsman2Name.textContent = batsman2.name || 'Batsman 2';
    }
    if (elements.batsman2Runs) {
        elements.batsman2Runs.textContent = batsman2.runs || 0;
    }
    if (elements.batsman2Balls) {
        elements.batsman2Balls.textContent = batsman2.balls || 0;
    }
    if (elements.batsman2Fours) {
        elements.batsman2Fours.textContent = batsman2.fours || 0;
    }
    if (elements.batsman2Sixes) {
        elements.batsman2Sixes.textContent = batsman2.sixes || 0;
    }
    if (elements.batsman2StrikeRate) {
        elements.batsman2StrikeRate.textContent = batsman2.strikeRate || '0.00';
    }

    // Bowler
    const bowler = data.bowler || data.bowlers || {};
    if (elements.bowlerName) {
        elements.bowlerName.textContent = bowler.name || 'Bowler';
    }
    if (elements.bowlerOvers) {
        elements.bowlerOvers.textContent = bowler.overs || '0.0';
    }
    if (elements.bowlerRuns) {
        elements.bowlerRuns.textContent = bowler.runs || 0;
    }
    if (elements.bowlerWickets) {
        elements.bowlerWickets.textContent = bowler.wickets || 0;
    }
    if (elements.bowlerEconomy) {
        elements.bowlerEconomy.textContent = bowler.economy || '0.00';
    }

    // Partnership
    const partnership = data.partnership || {};
    if (elements.partnershipRuns) {
        elements.partnershipRuns.textContent = partnership.runs || 0;
    }
    if (elements.partnershipBalls) {
        elements.partnershipBalls.textContent = partnership.balls || 0;
    }

    // Required
    if (elements.requiredRuns) {
        elements.requiredRuns.textContent = data.requiredRuns || data.target || 0;
    }
    if (elements.requiredBalls) {
        elements.requiredBalls.textContent = data.requiredBalls || 0;
    }
    if (elements.requiredRunRate) {
        elements.requiredRunRate.textContent = data.requiredRunRate || data.rrr || '0.00';
    }

    // Extras
    const extras = data.extras || {};
    if (elements.totalExtras) {
        elements.totalExtras.textContent = extras.total || 0;
    }
    if (elements.totalWides) {
        elements.totalWides.textContent = extras.wides || 0;
    }
    if (elements.totalNoBalls) {
        elements.totalNoBalls.textContent = extras.noBalls || 0;
    }
    if (elements.totalByes) {
        elements.totalByes.textContent = extras.byes || 0;
    }
    if (elements.totalLegByes) {
        elements.totalLegByes.textContent = extras.legByes || 0;
    }

    // Match Phase
    if (elements.matchPhase) {
        elements.matchPhase.textContent = getMatchPhase(data.matchPhase || data.status);
    }
    
    if (elements.matchResult) {
        elements.matchResult.textContent = data.matchResult || '';
    }

    // Last Over
    if (elements.lastOver) {
        elements.lastOver.textContent = data.lastOver || '';
    }

    // Toss
    if (elements.tossWinner) {
        elements.tossWinner.textContent = data.tossWinner || '';
    }
    if (elements.tossDecision) {
        elements.tossDecision.textContent = data.tossDecision || '';
    }

    // Last Updated
    if (elements.lastUpdated) {
        elements.lastUpdated.textContent = formatTime(data.lastUpdated || data.updated || new Date());
    }
}

// ===============================
// Loading State
// ===============================
function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

// ===============================
// Error Handling
// ===============================
function showError(message) {
    console.error('❌ Error:', message);
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = `⚠️ ${message}`;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 10000);
    }
}

// ===============================
// Fetch Current Settings
// ===============================
async function getSelectedMatchId() {
    try {
        const settingsDoc = await getDoc(doc(db, 'scoreboard', 'settings'));
        if (settingsDoc.exists()) {
            return settingsDoc.data().selectedMatchId;
        }
        return null;
    } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
    }
}

// ===============================
// Main: Listen to Live Updates
// ===============================
function listenToLiveUpdates() {
    console.log('🔄 Starting live updates listener...');
    showLoading();

    // Listen to settings changes
    const settingsUnsubscribe = onSnapshot(
        doc(db, 'scoreboard', 'settings'),
        async (snapshot) => {
            if (snapshot.exists()) {
                const selectedMatchId = snapshot.data().selectedMatchId;
                if (selectedMatchId) {
                    console.log(`📋 Selected match: ${selectedMatchId}`);
                    
                    // Listen to live data for selected match
                    const liveUnsubscribe = onSnapshot(
                        doc(db, 'scoreboard', 'live'),
                        (liveSnapshot) => {
                            if (liveSnapshot.exists()) {
                                const data = liveSnapshot.data();
                                updateScoreboard(data);
                                hideLoading();
                            } else {
                                console.log('⏳ No live data available');
                                hideLoading();
                            }
                        },
                        (error) => {
                            console.error('❌ Live data listener error:', error);
                            showError('Failed to fetch live data');
                            hideLoading();
                        }
                    );
                    
                    // Store unsubscribe for cleanup
                    window._liveUnsubscribe = liveUnsubscribe;
                }
            }
        },
        (error) => {
            console.error('❌ Settings listener error:', error);
            showError('Failed to fetch settings');
            hideLoading();
        }
    );

    // Store unsubscribe for cleanup
    window._settingsUnsubscribe = settingsUnsubscribe;
}

// ===============================
// Manual Refresh Function
// ===============================
async function refreshData() {
    try {
        console.log('🔄 Manual refresh triggered');
        const liveDoc = await getDoc(doc(db, 'scoreboard', 'live'));
        if (liveDoc.exists()) {
            updateScoreboard(liveDoc.data());
        }
    } catch (error) {
        console.error('❌ Refresh error:', error);
        showError('Failed to refresh data');
    }
}

// ===============================
// Debug Mode
// ===============================
const DEBUG = false; // Set to true for debugging

function logData(data) {
    if (DEBUG) {
        console.log('📊 Scoreboard Data:', JSON.stringify(data, null, 2));
    }
}

// ===============================
// Cleanup on Unload
// ===============================
window.addEventListener('unload', () => {
    if (window._settingsUnsubscribe) {
        window._settingsUnsubscribe();
    }
    if (window._liveUnsubscribe) {
        window._liveUnsubscribe();
    }
});

// ===============================
// OBS Visibility Handling
// ===============================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('👻 Scoreboard hidden (OBS scene inactive)');
    } else {
        console.log('👀 Scoreboard visible (OBS scene active)');
        refreshData(); // Refresh when scene becomes active
    }
});

// ===============================
// Initialize
// ===============================
console.log('🏏 Cricket Scoreboard v1.0');
console.log('📡 Listening for live updates...');

// Start listening
listenToLiveUpdates();

// Also refresh every 10 seconds as backup
setInterval(refreshData, 10000);

// Expose refresh function globally
window.refreshScoreboard = refreshData;

// ===============================
// Keyboard Shortcuts (OBS)
// ===============================
document.addEventListener('keydown', (e) => {
    // Press 'R' to refresh
    if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            refreshData();
        }
    }
    // Press 'D' for debug
    if (e.key === 'd' || e.key === 'D') {
        if (!e.ctrlKey && !e.metaKey) {
            window.DEBUG = !window.DEBUG;
            console.log(`🔍 Debug mode: ${window.DEBUG ? 'ON' : 'OFF'}`);
        }
    }
});

console.log('🎯 Scoreboard ready!');
console.log('⌨️  Press R to refresh, D for debug');
