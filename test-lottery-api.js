const fetch = require('node-fetch');

async function testLotteryAPI() {
    try {
        console.log('Testing Lottery API endpoint...');
        
        // Test the current-round endpoint
        const response = await fetch('http://localhost:3000/api/games/lottery_0_99/current-round');
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('Response text:', text);
        
        if (text) {
            try {
                const json = JSON.parse(text);
                console.log('Parsed JSON:', JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Failed to parse JSON:', e.message);
            }
        }
        
    } catch (error) {
        console.error('Error testing API:', error.message);
    }
}

testLotteryAPI();




