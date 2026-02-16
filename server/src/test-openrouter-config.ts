
import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testOpenRouterRestored() {
    console.log("Testing Restored OpenRouter Config...");
    console.log("Key length:", OPENROUTER_API_KEY?.length);
    console.log("Key start:", OPENROUTER_API_KEY?.substring(0, 5));

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [{ "role": "user", "content": "Say hello in JSON format: {\"message\": \"hello\"}" }],
                "response_format": { "type": "json_object" }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        console.log("Success! Response:");
        console.log(JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    }
}

testOpenRouterRestored();
