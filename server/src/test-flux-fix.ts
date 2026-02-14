import dotenv from 'dotenv';
dotenv.config();

async function testFluxFix() {
    console.log('Testing FLUX image generation fix...\n');

    try {
        console.log('Sending request to http://localhost:3000/api/clipdrop/generate');
        const response = await fetch('http://localhost:3000/api/clipdrop/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'A futuristic city with flying cars, cyberpunk style' })
        });

        console.log('Response status:', response.status);
        const data = await response.json();

        if (data.success) {
            console.log('\n✅ SUCCESS! Image generated');
            if (data.image.startsWith('data:image/svg+xml')) {
                console.log('Type: SVG Data URI');
            } else {
                console.log('Type: URL');
            }
            console.log('Image Data:', data.image.substring(0, 100) + '...');
        } else {
            console.log('\n❌ FAILED:', data.error);
            if (data.details) {
                console.log('Error details:', JSON.stringify(data.details, null, 2));
            }
        }
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
    }
}

testFluxFix();
