import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

async function dumpModels() {
    console.log('Fetching OpenRouter models...\n');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            }
        });

        const data = await response.json();

        if (data.data) {
            const allIds = data.data.map((m: any) => m.id).sort();
            fs.writeFileSync('openrouter_models.txt', allIds.join('\n'));
            console.log(`Dumped ${allIds.length} models to openrouter_models.txt`);
        } else {
            console.log('Failed to fetch models:', data);
        }
    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

dumpModels();
