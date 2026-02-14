import dotenv from 'dotenv';
dotenv.config();

async function listAllModels() {
    console.log('Fetching OpenRouter models...\n');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            }
        });

        const data = await response.json();

        if (data.data) {
            // Filter for likely image models or just print first 50
            const imageModels = data.data.filter((m: any) =>
                m.id.includes('image') ||
                m.id.includes('diffusion') ||
                m.id.includes('stability') ||
                m.id.includes('flux') ||
                m.id.includes('dall-e')
            );

            console.log(`Found ${imageModels.length} potential image models:`);
            imageModels.forEach((m: any) => console.log(`- ${m.id}`));

        } else {
            console.log('Failed to fetch models:', data);
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

listAllModels();
