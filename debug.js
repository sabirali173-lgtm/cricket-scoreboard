// debug.js
import fetch from 'node-fetch';

const API_KEY = process.env.API_KEY;

const headers = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'cricbuzz-cricket.p.rapidapi.com',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function debugAPI() {
    try {
        console.log('🔍 Debugging API Response...');
        console.log(`📝 API Key: ${API_KEY?.substring(0, 10)}...`);
        
        const response = await fetch('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', { headers });
        const data = await response.json();
        
        console.log('\n📊 Response Status:', response.status);
        
        console.log('\n📋 Response Structure:');
        console.log('Top Level Keys:', Object.keys(data));
        
        // Show full response (formatted)
        console.log('\n📄 Full Response:');
        console.log(JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugAPI();
