import dotenv from 'dotenv';
dotenv.config();

async function testImageGeneration() {
    console.log('Testing image generation endpoint...\n');

    try {
        const response = await fetch('http://localhost:3000/api/clipdrop/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'A cute cat wearing a wizard hat' })
        });

        console.log('Response status:', response.status);
        const data = await response.json();

        console.log('\nResponse data:');
        console.log(JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('\n✅ SUCCESS! Image generated');
            console.log('Image URL/Data:', data.image.substring(0, 100) + '...');
        } else {
            console.log('\n❌ FAILED:', data.error);
        }
    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
    }
}

testImageGeneration();
