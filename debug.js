// debug.js - GitHub Actions Version
import fetch from 'node-fetch';

// GitHub Actions mein API_KEY environment variable se lega
const API_KEY = process.env.API_KEY;

// Agar local testing ke liye, direct key bhi daal sakte ho
// const API_KEY = "your_rapidapi_key_here";

const headers = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function debugAPI() {
    try {
        console.log('🔍 Debugging API Response...');
        console.log(`📝 API Key exists: ${!!API_KEY}`);
        console.log(`📝 API Key length: ${API_KEY?.length || 0}`);
        
        if (!API_KEY) {
            console.error('❌ API_KEY is not set!');
            console.log('📋 Please add API_KEY to GitHub Secrets');
            return;
        }
        
        console.log('\n📡 Fetching live matches...');
        const response = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', { headers });
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📊 Response Status Text: ${response.statusText}`);
        
        // Show response headers
        console.log('\n📋 Response Headers:');
        for (const [key, value] of response.headers) {
            if (key !== 'x-rapidapi-key') {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        const data = await response.json();
        
        console.log('\n📋 Response Structure:');
        console.log('Top Level Keys:', Object.keys(data));
        
        console.log('\n📄 Full Response:');
        console.log(JSON.stringify(data, null, 2));
        
        // Check if matches exist
        console.log('\n🔍 Searching for matches...');
        let matchCount = 0;
        
        function findMatches(obj, path = '') {
            if (!obj || typeof obj !== 'object') return;
            
            if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    findMatches(obj[i], `${path}[${i}]`);
                }
            } else {
                // Check if this looks like a match
                if ((obj.matchId || obj.match_id || obj.match) && 
                    (obj.team1 || obj.team2 || obj.team1Name || obj.team2Name)) {
                    matchCount++;
                    console.log(`  ✅ Match ${matchCount} found at: ${path}`);
                    console.log(`     ID: ${obj.matchId || obj.match_id || obj.match}`);
                    console.log(`     Teams: ${obj.team1?.name || obj.team1Name || '?'} vs ${obj.team2?.name || obj.team2Name || '?'}`);
                    console.log(`     Status: ${obj.status || obj.matchStatus || '?'}`);
                }
                
                // Recursively search
                for (const key of Object.keys(obj)) {
                    if (key !== 'ad' && key !== 'ads') {
                        findMatches(obj[key], `${path}.${key}`);
                    }
                }
            }
        }
        
        findMatches(data);
        console.log(`\n📊 Total matches found: ${matchCount}`);
        
        if (matchCount === 0) {
            console.log('\n⚠️ No matches found in response');
            console.log('📋 Response structure:', JSON.stringify(data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
    }
}

debugAPI();
