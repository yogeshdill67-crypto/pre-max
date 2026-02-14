import fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse';
// @ts-ignore
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import { callChatModelWithBytez } from './bytez';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const extractTextFromFile = async (filePath: string): Promise<string> => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } else if (ext === 'docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } else if (ext === 'txt' || ext === 'md') {
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
};

// New: Analyze content to find infographic opportunities
export const extractKeyPointsAndTypes = async (filePath: string): Promise<any> => {
    const text = await extractTextFromFile(filePath);
    const truncated = text.length > 50000 ? text.substring(0, 50000) + '...' : text;

    const prompt = `
    Analyze this text and identify 5-8 key topics that would benefit from specific visualizations.
    Map each topic to one of these VISUAL TYPES:
    - "exploded_view" (for parts inside, structure, components)
    - "cutaway" (for internal mechanisms, how fuel/data moves, hidden layers)
    - "dashboard" (for performance stats, speed, KPIs, metrics)
    - "flowchart" (for assembly usage, processes, step-by-step guides)
    - "timeline" (for history, evolution, roadmap)
    - "comparison" (for A vs B, pros/cons)
    - "standard" (for general info, bullet points)

    OUTPUT JSON:
    {
        "topics": [
            {
                "title": "Topic Title",
                "description": "Brief description of content",
                "visualType": "exploded_view", 
                "reason": "Shows internal parts"
            }
        ]
    }
    
    Text: ${truncated}
    `;

    const raw = await callAI(prompt);
    return JSON.parse(raw);
};

export const generatePresentation = async (
    filePath: string,
    mode: string,
    count: number,
    contentType: string = 'general',
    userStyle: string = 'modern',
    userGradient: string = 'auto',
    customPlan?: any
) => {
    console.log(`Generating presentation... Custom Plan: ${!!customPlan}`);
    let contextText = "";

    if (!customPlan) {
        try {
            contextText = await extractTextFromFile(filePath);
            console.log(`Extracted ${contextText.length} characters.`);
        } catch (e) {
            console.error("Error extracting text:", e);
            contextText = "Topic: General Presentation";
        }
        if (contextText.length > 100000) {
            contextText = contextText.substring(0, 100000) + "...[truncated]";
        }
    }

    // Map user gradient choice to color guidance
    const gradientMap: Record<string, string> = {
        'ocean': 'Use ocean blues (#0EA5E9, #0284C7) with deep navy backgrounds (0B1120). Cool, flowing, calming.',
        'sunset': 'Use sunset warm tones (#F97316, #EF4444, #EC4899) with dark warm backgrounds (1A0A0E). Fiery, passionate, energetic.',
        'forest': 'Use forest greens (#059669, #10B981, #22C55E) with deep green backgrounds (0C1B0F). Natural, organic, fresh.',
        'royal': 'Use royal purple + gold (#7C3AED, #D4A636) with dark backgrounds (0D0521). Luxurious, prestigious, elegant.',
        'neon': 'Use neon cyan + magenta (#06B6D4, #EC4899) with pure dark background (0A0A0F). Futuristic, tech, electric.',
        'aurora': 'Use aurora green + purple (#34D399, #A78BFA) with night sky background (0F172A). Mystical, dreamy, creative.',
        'monochrome': 'Use elegant grays and whites (#E5E7EB, #9CA3AF) with pure dark background (111111). Clean, minimal, professional.',
        'auto': 'Automatically choose colors that best match the content topic (see THEME DESIGN section below).',
    };
    const gradientInstruction = gradientMap[userGradient] || gradientMap['auto'];

    // Map user style choice
    const styleMap: Record<string, string> = {
        'modern': 'Modern: Clean lines, sans-serif fonts, generous spacing, glassmorphism, gradient accents. fontStyle = "modern".',
        'classic': 'Classic: Serif fonts, traditional layout, refined borders, muted elegance. fontStyle = "classic".',
        'bold': 'Bold: Large headlines, high contrast, strong colors, impactful statements. fontStyle = "modern".',
        'minimal': 'Minimal: Lots of whitespace, understated, one key point per slide, functional zen. fontStyle = "modern".',
        'creative': 'Creative: Artistic, playful typography, unexpected layouts, vibrant energy. fontStyle = "playful".',
    };
    const styleInstruction = styleMap[userStyle] || styleMap['modern'];

    let contentInstructions = "";
    if (customPlan) {
        contentInstructions = `
        USER CUSTOM PLAN (FOLLOW STRICTLY):
        The user has selected the following topics and visualization types. You MUST generate 1 slide for each topic in this order.
        
        PLAN:
        ${JSON.stringify(customPlan.topics, null, 2)}
        
        INSTRUCTION:
        - For "exploded_view", generate a slide with a detailed technical diagram description in "imagePrompt". Focus on internal components.
        - For "cutaway", generate a "standard" slide but with a "cross-section" visual description in "imagePrompt".
        - For "dashboard" or "performance_dashboard", generate "stats" slide type with multiple metrics and indicators.
        - For "flowchart" or "step-by-step", generate "timeline" slide type to represent the process steps.
        - For "comparison", use "comparison" slide type.
        
        Generate the content to match these visual types exactly.
        IGNORE the default "contextText" for structure.
        `;
    } else {
        contentInstructions = `
        Create a ${count}-slide presentation.
        Content Type: ${contentType}.
        Input Text:
        ${contextText}
        `;
    }

    const prompt = `
    You are a WORLD-CLASS AI presentation designer producing Google/Apple/TED-quality slides.
    Your goal: produce content so good it could be presented at a professional conference.

    CONTENT QUALITY RULES:
    - Write REAL, INSIGHTFUL, DETAILED content. Never generic filler.
    - Every bullet point must be a FULL SENTENCE (15-25 words) that teaches something specific.
    - DO NOT use any emojis or special Unicode symbols anywhere in the output. Use plain text only.
    - Stats must use REALISTIC numbers derived from the source material (or reasonable estimates).
    - Section titles: ENGAGING and CREATIVE, not just "Introduction" or "Overview".
    - Quotes: REAL (from the content) or INSIGHTFUL expert quotes about the topic.
    - For technical slides like 'Exploded View' or 'Cutaway', make the descriptions extremely precise.

    VISUAL MAPPING:
    - dashboard -> stats slide
    - flowchart -> timeline slide
    - exploded_view -> exploded_view slide type (Technical detailed view)
    - cutaway -> cutaway slide type (Cross-section view)
    - standard -> bullets slide type
    - comparison -> comparison slide type
    - quote -> quote slide type
    
    EXTRA AI INSIGHTS (IMPORTANT):
    - Do NOT just repeat what the user wrote. Go BEYOND the input text.
    - Add 2-3 extra insights, facts, or analysis points PER SLIDE that the user did not provide.
    - If the user gives basic bullet points, expand each into a detailed, evidence-based explanation.
    - Add relevant statistics, real-world examples, expert opinions, and practical applications.
    - Think like a subject matter expert who enriches the original content.

    IMAGE KEYWORDS (REQUIRED):
    - Every slide MUST include an "imageKeyword" field.
    - This should be a 1-3 word VISUAL PRODUCT or EQUIPMENT search term.
    - Think: "What would I buy in a store?" or "What object represents this?"
    - Examples: "drone", "microchip", "tractor", "tablet", "solar panel", "sprinkler".
    - AVOID abstract concepts totally. NO "technology", "future", "growth".
    - Focus on the PHYSICAL OBJECT.

    AI IMAGE PROMPT (REQUIRED):
    - "imagePrompt" must be a detailed description for an AI image generator (Flux).
    - Style: "Award winning professional photography, 8k, highly detailed, realistic, cinematic lighting, depth of field".
    - NO TEXT, NO CARTOONS, NO ILLUSTRATIONS. Pure realism.
    - Example: "close up shot of a futuristic robotic arm assembling a circuit board, dramatic lighting, highly detailed, 8k, photorealistic"

    USER'S CHOSEN STYLE: ${styleInstruction}
    USER'S CHOSEN COLOR GRADIENT: ${gradientInstruction}

    THEME DESIGN (background MUST match the content topic):
    - If user chose "auto" gradient, pick colors that match the subject:
      Nature = greens, Technology = blues, Finance = navy+gold, Health = teal, Education = indigo+amber
    - If user chose a specific gradient, USE THOSE COLORS but still make the bg match content feel.

    ${contentInstructions}
    Mode: ${mode}.

    OUTPUT FORMAT - valid JSON only, no markdown, no emojis:
    {
        "title": "An Engaging Specific Title",
        "mode": "${mode}",
        "theme": {
            "name": "Creative Theme Name",
            "bg": "HEX bg without # (e.g. 0F172A)",
            "accent1": "HEX primary accent",
            "accent2": "HEX secondary accent",
            "textColor": "HEX text color",
            "cardBg": "HEX card background",
            "isDark": true or false,
            "fontStyle": "modern" or "classic" or "playful"
        },
            "slides": [
            {
                "slideType": "section",
                "title": "Engaging Section Title",
                "content": ["A compelling subtitle"],
                "imageKeyword": "search term (e.g. 'smart farm')",
                "imagePrompt": "cinematic shot of futuristic smart farm at sunset, detailed, photorealistic"
            },
            {
                "slideType": "bullets",
                "title": "Descriptive Title",
                "content": [
                    "First insightful point with specific details (15-25 words)",
                    "Second point diving deeper with concrete examples",
                    "Third point: an AI-added insight the user did not provide",
                    "Fourth point with practical application or real-world example",
                    "Fifth point connecting to the broader picture"
                ],
                "imageKeyword": "search term (e.g. 'VR headset')",
                "imagePrompt": "students using VR headsets in a modern bright classroom, high quality, 4k"
            },
            {
                "slideType": "stats",
                "title": "Key Metrics Title",
                "content": ["Context paragraph explaining these numbers"],
                "stats": [
                    {"value": "95%", "label": "Specific Metric"},
                    {"value": "$2.4B", "label": "Relevant Number"},
                    {"value": "150+", "label": "Meaningful Count"},
                    {"value": "3.2x", "label": "Growth Metric"}
                ],
                "imageKeyword": "search term (e.g. 'data analytics')",
                "imagePrompt": "abstract data visualization with glowing nodes and connections, cybernetic style"
            },
            {
                "slideType": "quote",
                "title": "Key Insight",
                "content": ["A powerful quote about this topic.", "-- Expert Name"],
                "imageKeyword": "inspiration leadership"
            },
            {
                "slideType": "comparison",
                "title": "X vs Y",
                "content": ["Why this comparison matters"],
                "columns": [
                    {"title": "Option A", "points": ["Detailed advantage one", "Specific benefit two", "Technical strength"]},
                    {"title": "Option B", "points": ["Alternative advantage", "Different strength", "Practical benefit"]}
                ],
                "imageKeyword": "comparison choice"
            },
            {
                "slideType": "timeline",
                "title": "Evolution / Roadmap",
                "content": ["Timeline context"],
                "timeline": [
                    {"year": "Phase 1", "event": "Milestone with context"},
                    {"year": "Phase 2", "event": "Key development"},
                    {"year": "Phase 3", "event": "Current state"}
                ],
                "imageKeyword": "progress roadmap"
            }
        ]
    }

    STRICT RULES:
    1. NO emojis or special symbols anywhere. Plain ASCII text only.
    2. Every bullet = complete informative sentence. NO generic text.
    3. Every slide MUST have: slideType, visualType, title, content, imageKeyword.
    4. Use AT LEAST 4 different slideType values.
    5. Theme colors = 6-char HEX WITHOUT # prefix.
    6. MUST generate EXACTLY ${count} slides.
    7. First slide = "section" type intro. Add "section" dividers between major topics.
    8. Stats: 3-4 items. Comparison: 2 columns with 3-5 points. Timeline: 3-6 items.
    9. Title must be SPECIFIC to the content.
    10. Add 2-3 AI-generated extra insights per content slide that enrich the user's material.
    11. Pass the user's selected "visualType" (from the plan) into the slide JSON as "visualType".
    `;

    console.log("Calling OpenRouter (Gemini Flash)...");
    let rawContent = '';
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-001",
                "messages": [{ "role": "user", "content": prompt }],
                "response_format": { "type": "json_object" }
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
        }
        const data = await response.json();
        rawContent = data.choices[0].message.content;
        console.log("AI Response received.");

        // Robust JSON parsing with multiple fallback strategies
        const parseAIJson = (raw: string) => {
            // Strategy 1: Direct parse
            try { return JSON.parse(raw); } catch { }

            // Strategy 2: Strip markdown fencing
            let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            try { return JSON.parse(cleaned); } catch { }

            // Strategy 3: Extract JSON object between first { and last }
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace > firstBrace) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
                try { return JSON.parse(cleaned); } catch { }
            }

            // Strategy 4: Fix common issues — control chars, trailing commas
            cleaned = cleaned
                .replace(/[\x00-\x1F\x7F]/g, ' ')
                .replace(/,\s*([}\]])/g, '$1')
                .replace(/\n/g, ' ');
            try { return JSON.parse(cleaned); } catch { }

            // Strategy 5: Fix unescaped quotes inside string values
            cleaned = cleaned.replace(/\"([^\"]*?)(?<!\\)\"(?=[^:,\\]\\}\\s])/g, '\"$1\\\"');
            // Fix truncated JSON — close any open arrays/objects
            let openBraces = 0, openBrackets = 0;
            for (const ch of cleaned) {
                if (ch === '{') openBraces++;
                else if (ch === '}') openBraces--;
                else if (ch === '[') openBrackets++;
                else if (ch === ']') openBrackets--;
            }
            // Remove trailing comma before we close
            cleaned = cleaned.replace(/,\s*$/, '');
            // Close any unfinished strings
            const quoteCount = (cleaned.match(/(?<!\\)\"/g) || []).length;
            if (quoteCount % 2 !== 0) cleaned += '"';
            while (openBrackets > 0) { cleaned += ']'; openBrackets--; }
            while (openBraces > 0) { cleaned += '}'; openBraces--; }
            try { return JSON.parse(cleaned); } catch { }

            // Strategy 6: Try to find a valid JSON substring
            // Sometimes the AI adds commentary after the JSON
            for (let end = cleaned.length; end > 100; end--) {
                if (cleaned[end - 1] === '}') {
                    try { return JSON.parse(cleaned.substring(0, end)); } catch { }
                }
            }

            console.error("All JSON parse strategies failed for content length:", raw.length);
            throw new Error("Failed to parse AI response as JSON");
        };

        return parseAIJson(rawContent);
    } catch (error: any) {
        // If JSON parse failed, retry with a simpler prompt
        if (error.message?.includes('JSON') || error.message?.includes('parse')) {
            console.log("Retrying with repair prompt...");
            try {
                const retryResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        "model": "google/gemini-2.0-flash-001",
                        "messages": [{ "role": "user", "content": prompt }, { "role": "assistant", "content": rawContent }, { "role": "user", "content": "Your previous response had invalid JSON. Please respond with ONLY valid JSON, no markdown, no extra text. Fix any syntax errors and return the complete JSON object." }],
                        "response_format": { "type": "json_object" }
                    })
                });
                if (retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    const retryContent = retryData.choices[0].message.content;
                    console.log("Retry response received.");
                    let retryClean = retryContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                    const fb = retryClean.indexOf('{');
                    const lb = retryClean.lastIndexOf('}');
                    if (fb !== -1 && lb > fb) retryClean = retryClean.substring(fb, lb + 1);
                    return JSON.parse(retryClean);
                }
            } catch (retryErr) {
                console.error("Retry also failed:", retryErr);
            }
        }
        console.error("AI Generation failed:", error);
        throw error;
    }
};

// ─── AI Helper (Llama-2 via Bytez) ───────────────────
const repairJSON = (str: string): string => {
    try {
        JSON.parse(str);
        return str;
    } catch (e) {
        let repaired = str.trim();
        if ((repaired.match(/"/g) || []).length % 2 !== 0) repaired += '"';
        const stack: string[] = [];
        for (let char of repaired) {
            if (char === '{') stack.push('}');
            if (char === '[') stack.push(']');
            if (char === '}') stack.pop();
            if (char === ']') stack.pop();
        }
        while (stack.length > 0) repaired += stack.pop();
        return repaired;
    }
};

const callAI = async (prompt: string, retries = 2): Promise<string> => {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            const raw = await callChatModelWithBytez([{ role: "user", content: prompt }]);
            const firstBracket = raw.indexOf('{');
            if (firstBracket === -1) throw new Error("No JSON object found");

            const lastBracket = raw.lastIndexOf('}');
            let clean = lastBracket > firstBracket
                ? raw.substring(firstBracket, lastBracket + 1)
                : raw.substring(firstBracket);

            const repaired = repairJSON(clean);
            try {
                JSON.parse(repaired);
                return repaired;
            } catch (e) {
                console.warn(`JSON repair failed on attempt ${i + 1}.`);
                lastError = e;
                continue;
            }
        } catch (e: any) {
            lastError = e;
            console.error(`Attempt ${i + 1} failed:`, e.message);
        }
    }
    throw new Error(`AI Search failed after ${retries} attempts: ${lastError.message}`);
};

// ─── AI Search ──────────────────────────────────────────────────
export const aiSearch = async (query: string, mode: 'quick' | 'research' = 'quick') => {
    const depth = mode === 'research'
        ? 'Provide a thorough research report with 3-4 professional sections. Each section should have one high-quality paragraph. Be concise.'
        : 'Provide a short overview with 2 bulleted sections.';

    const prompt = `
    TASK: Research the topic and provide a structured JSON response.
    TOPIC: "${query}"
    DEPTH: ${depth}

    CRITICAL: YOUR ENTIRE RESPONSE MUST BE A SINGLE VALID JSON OBJECT.
    DO NOT INCLUDE ANY INTRODUCTORY TEXT, CONVERSATION, OR MARKDOWN BACKTICKS.
    START WITH { AND END WITH }.

    OUTPUT FORMAT:
    {
        "title": "Title of the research topic",
        "summary": "A 2-3 sentence executive summary",
        "sections": [
            { "heading": "Section Title", "content": "Detailed paragraph(s) of content..." }
        ],
        "keyPoints": [
            { "text": "Key takeaway point", "category": "concept|data|insight|action|warning", "importance": "high|medium|low" }
        ],
        "suggestedTopics": ["Related topic 1", "Related topic 2", "Related topic 3"],
        "links": [
            { "title": "Source Title", "url": "https://example.com/source", "snippet": "Brief description of the source content" }
        ],
        "images": [
            { "prompt": "Detailed image generation prompt", "caption": "Caption describing the image" }
        ]
    }
    `;

    console.log(`AI Search (${mode}): "${query}"`);
    try {
        const raw = await callAI(prompt);
        return JSON.parse(raw);
    } catch (error: any) {
        console.error("AI Search failed - Query:", query);
        console.error("AI Search failed - Error:", error.message);
        throw error;
    }
};

// ─── Extract Key Points ─────────────────────────────────────────
export const extractKeyPoints = async (text: string) => {
    const truncated = text.length > 50000 ? text.substring(0, 50000) + '...[truncated]' : text;

    const prompt = `
    Analyze the following text and extract the most important key points.

    OUTPUT FORMAT — valid JSON:
    {
        "keyPoints": [
            { "text": "The key point in one clear sentence", "category": "concept|data|insight|action|warning", "importance": "high|medium|low" }
        ],
        "summary": "A 2-3 sentence overall summary of the content"
    }

    RULES:
    - OUTPUT ONLY VALID JSON. 
    - NO PREAMBLE. NO Post-text.
    - Start directly with { and end with }.
    - Extract 5-15 key points depending on content length
    - Order by importance (high first)
    - Categories: concept (ideas/theories), data (numbers/stats), insight (analysis), action (recommendations), warning (risks/caveats)

    Text to analyze:
    ${truncated}
    `;

    console.log("Extracting key points...");
    try {
        const raw = await callAI(prompt);
        return JSON.parse(raw);
    } catch (error) {
        console.error("Key point extraction failed:", error);
        throw error;
    }
};

// ─── Generate Infographic Data ──────────────────────────────────
export const generateInfographic = async (topic: string, style: string = 'corporate') => {
    const prompt = `
    Generate high-end structured data for a professional infographic poster about: "${topic}"

    DESIGN PRINCIPLES TO FOLLOW:
    1. Layout: Vertical poster format, split layout with clear visual hierarchy (Title -> Subtitle -> Sections -> Visuals). Balanced grid-based alignment.
    2. Visual Style: Flat vector illustration style, semi-realistic scientific icons, textbook-style visuals (clean, modern, minimal but detailed).
    3. Colors: ${style === 'corporate' ? 'Cool dual-theme (Navy/Cyan contrast)' : style === 'vibrant' ? 'Contrast dual-theme (Orange/Purple contrast)' : 'Soft professional gradients'}. Limited palette of 4-6 colors.
    4. Typography: Bold headings, clean sans-serif bodies, consistent sizing for high readability.

    OUTPUT FORMAT — valid JSON:
    {
        "title": "Main Clear Title",
        "subtitle": "Short compelling subtitle",
        "style": "${style}",
        "sections": [
            {
                "heading": "Section Heading",
                "content": "Professional informative sentence (15-25 words)",
                "icon": "relevant scientific/professional emoji",
                "stat": { "value": "Number/Metric", "label": "Context" }
            }
        ],
        "colors": {
            "primary": "#hex (Warm/Cool contrast)",
            "secondary": "#hex (Contrast pair)",
            "accent": "#hex (Glow highlight)",
            "bg": "#hex (Smooth gradient start or dark base)"
        },
        "footer": "Technical Source / Print-ready Metadata",
        "layout": "split_grid"
    }

    RULES:
    - OUTPUT ONLY VALID JSON. 
    - NO INTRODUCTORY TEXT. NO EXPLANATIONS.
    - Start with { and end with }.
    - Generate 5-6 highly informative sections.
    - Each section MUST have a distinct icon and heading.
    - At least 3 sections should include compelling data stats.
    - Colors MUST be high-contrast for readability with soft glow effects indicated by the accent color.
    `;

    if (style === 'scientific') {
        const sciPrompt = `
        Act as a high-end Science Illustrator and Technical Writer. Generate a detailed, complex infographic poster data structure about: "${topic}"

        DESIGN PRINCIPLES (MUST FOLLOW):
        1. Layout: Vertical split-screen layout, symmetrical balance, grid-based alignment. Clear visual hierarchy (Title -> Mechanisms -> Data -> Footer).
        2. Visual Style: Flat vector illustration, textbook-style scientific diagrams, minimal but technical graphics.
        3. Color Contrast: Warm vs Cool dual themes (e.g. Amber/Teal or Orange/Blue contrast). Soft glow highlight effects.
        4. Composition: Symmetrical balance with even margins and good white space usage.

        OUTPUT FORMAT — valid JSON:
        {
            "title": "Main Scientific Title",
            "subtitle": "Technical sub-header",
            "style": "scientific",
            "sections": [
                {
                    "heading": "Technical Section (e.g. Structural Analysis)",
                    "content": "Dense technical description with professional data (15-25 words).",
                    "icon": "relevant scientific emoji (🧬, ⚛️, 🧪)",
                    "stat": { "value": "Metric (e.g. 9.8m/s²)", "label": "Key Factor" }
                }
            ],
            "colors": {
                "primary": "#F59E0B",
                "secondary": "#0D9488",
                "accent": "#F472B6",
                "bg": "#0B1120"
            },
            "footer": "Research Source / 300 DPI Technical Metadata",
            "layout": "split_technical"
        }

        REQUIRED CONTENT SECTIONS:
        - "The Core Mechanism/Constraint": Theoretical problem definition.
        - "Technical Specifications": Precise metrics and stats.
        - "Comparative Analysis": Compare this topic to a baseline.
        - "Advanced Insights": Technical future-looking analysis.

        CRITICAL RULES:
        - OUTPUT ONLY VALID JSON. 
        - NO CONVERSATIONAL TEXT. NO "HERE IS YOUR JSON".
        - Start directly with { and end with }.
        `;

        console.log(`Generating SCIENTIFIC infographic for: "${topic}"`);
        try {
            const raw = await callAI(sciPrompt);
            return JSON.parse(raw);
        } catch (error) {
            console.error("Scientific Infographic generation failed:", error);
            throw error;
        }
    }

    console.log(`Generating infographic for: "${topic}" (${style})`);
    try {
        const raw = await callAI(prompt);
        return JSON.parse(raw);
    } catch (error) {
        console.error("Infographic generation failed:", error);
        throw error;
    }
};
