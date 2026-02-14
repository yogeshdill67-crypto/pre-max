import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    console.log('Fetching OpenRouter models...\n');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            }
        });

        const data = await response.json();

        if (data.data) {
            const fluxModels = data.data.filter((m: any) => m.id.includes('flux'));
            console.log('Found FLUX models:');
            fluxModels.forEach((m: any) => console.log(`- ${m.id}`));

            if (fluxModels.length === 0) {
                console.log('No models found with "flux" in the ID.');
            }
        } else {
            console.log('Failed to fetch models:', data);
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

listModels();
