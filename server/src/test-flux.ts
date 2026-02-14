
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function testGeminiImage() {
    const logFile = path.join(__dirname, 'flux-result.txt');
    const log = (msg: string) => {
        console.log(msg);
        try {
            fs.appendFileSync(logFile, msg + '\n');
        } catch (e) {
            console.error("Failed to write to log file:", e);
        }
    };

    if (fs.existsSync(logFile)) {
        try {
            fs.unlinkSync(logFile);
        } catch (e) { }
    }

    const modelParams = "google/gemini-2.5-flash-image";
    log(`Testing ${modelParams} via OpenRouter (chat/completions)...`);
    const prompt = "Generate an image of a futuristic sci-fi poster about anti-gravity propulsion, high resolution, 8k, detailed, glowing neon lines, deep space background";

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "PreMax"
            },
            body: JSON.stringify({
                model: modelParams,
                messages: [
                    { role: "user", content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            log(`Gen Error: ${response.status} ${err}`);
            return;
        }

        const data = await response.json();
        log("Generation Success!");
        log(`Full Response: ${JSON.stringify(data, null, 2)}`);

        // Check for image URL in content or typical OpenRouter image location
        const content = data.choices[0].message.content;
        log(`Content: ${content}`);

    } catch (e: any) {
        log(`Test failed: ${e.message}`);
    }
}

testGeminiImage();
