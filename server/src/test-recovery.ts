
import dotenv from 'dotenv';
// dotenv.config();

// Hardcoded old key for testing recovery
const OLD_KEY = "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";

async function testOldOpenRouter() {
    console.log("Testing Original OpenRouter Key...");

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OLD_KEY}`,
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

testOldOpenRouter();
