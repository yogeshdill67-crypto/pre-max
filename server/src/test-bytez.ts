import dotenv from 'dotenv';
dotenv.config();

const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY || '9718b611777769a4dd8243d868d8d410';

async function testBytezAPI() {
    console.log('Testing Bytez API with Qwen-Image model...');
    console.log('API Key:', BYTEZ_API_KEY.substring(0, 10) + '...');

    try {
        const prompt = 'A cat in a wizard hat';
        console.log(`\nPrompt: "${prompt}"`);
        console.log('Making API request...\n');

        const response = await fetch('https://api.bytez.com/v1/models/run', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BYTEZ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'Qwen/Qwen-Image',
                input: prompt
            })
        });

        console.log('Response Status:', response.status, response.statusText);
        console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('\nResponse Data:');
        console.log(JSON.stringify(data, null, 2));

        if (data.error) {
            console.error('\n❌ ERROR:', data.error);
            return false;
        }

        if (data.output) {
            console.log('\n✅ SUCCESS! Image generated');
            console.log('Output type:', typeof data.output);
            if (typeof data.output === 'string') {
                if (data.output.startsWith('http')) {
                    console.log('Image URL:', data.output);
                } else {
                    console.log('Image data length:', data.output.length, 'characters');
                }
            }
            return true;
        }

        console.log('\n⚠️ No output received');
        return false;

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}

testBytezAPI().then(success => {
    console.log('\n' + '='.repeat(50));
    console.log(success ? '✅ Bytez API test PASSED' : '❌ Bytez API test FAILED');
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
});
