import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
// @ts-ignore
const gis = require('g-i-s');
import { generatePresentation, aiSearch, extractKeyPoints, generateInfographic, extractKeyPointsAndTypes } from './ai-engine';
import { generateImage, removeBackground } from './clipdrop';
import { generateImageDataUrl } from './bytez';

const app = express();
const PORT = process.env.PORT || 3000;

// Setup uploads and output directory
const UPLOADS_DIR = path.join(__dirname, '../uploads');
const OUTPUT_DIR = path.join(__dirname, '../outputs');

[UPLOADS_DIR, OUTPUT_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
// Serve static files from outputs
app.use('/download', express.static(OUTPUT_DIR));

import { createPptx } from './pptx-generator';
import dotenv from 'dotenv';
dotenv.config();

import { TelegramDB } from './telegram-db';

const telegramDB = new TelegramDB({
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID
});

// Try to auto-detect chat ID
telegramDB.getChatIdFromUpdates().then(chatId => {
    if (chatId) {
        console.log(`Auto-detected Telegram Chat ID: ${chatId}`);
        telegramDB.setChatId(chatId);
    } else {
        console.log('Could not auto-detect Telegram Chat ID. Please send a message to the bot.');
    }
});

const uploadFields = upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'templateRef', maxCount: 1 }
]);

// New: Analyze Doc endpoint
app.post('/api/analyze', (req, res, next) => {
    uploadFields(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, async (req, res) => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const documentFile = files?.document?.[0];

        if (!documentFile) return res.status(400).json({ error: 'No file uploaded' });

        // Analyze content
        console.log(`Analyzing ${documentFile.filename}...`);
        const plan = await extractKeyPointsAndTypes(documentFile.path);

        // Return plan + filename (so we can reference it later without re-upload)
        res.json({
            success: true,
            plan: plan,
            filename: documentFile.filename,
            message: 'Content analyzed successfully'
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});


app.post('/api/upload', (req, res, next) => {
    uploadFields(req, res, (err: any) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ error: `File upload error: ${err.message}` });
        }
        next();
    });
}, async (req, res) => {
    try {
        const mode = req.body.mode || 'office';
        const slideCount = parseInt(req.body.slideCount || '10');
        const contentType = req.body.contentType || 'general';
        const userStyle = req.body.userStyle || 'modern';
        const userGradient = req.body.userGradient || 'auto';

        // Handle custom plan from user selection
        const customPlanStr = req.body.customPlan;
        let customPlan = null;
        if (customPlanStr) {
            try {
                customPlan = JSON.parse(customPlanStr);
                console.log("Received custom plan from client");
            } catch (e) {
                console.error("Failed to parse customPlan JSON", e);
            }
        }

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let documentPath = '';

        // Case 1: New file upload
        if (files?.document?.[0]) {
            documentPath = files.document[0].path;
        }
        // Case 2: Reference existing file (from analyze step)
        else if (req.body.existingFilename) {
            documentPath = path.join(UPLOADS_DIR, req.body.existingFilename);
            if (!fs.existsSync(documentPath)) {
                return res.status(400).json({ error: 'Referenced file not found' });
            }
        }

        if (!documentPath && !customPlan) {
            // Technically we can generate from just a topic if we had one, but strict rule for now
            // Actually, if customPlan exists, we might not strictly need the file if AI uses the plan topics?
            // But valid to require file for context extraction in generatePresentation.
            // Let's assume file is needed.
        }

        console.log(`Processing ${documentPath} for mode: ${mode}, contentType: ${contentType}, style: ${userStyle}, gradient: ${userGradient}`);

        // Call AI Engine — returns presentation data only (no PPTX yet)
        const presentationData = await generatePresentation(
            documentPath,
            mode,
            slideCount,
            contentType,
            userStyle,
            userGradient,
            customPlan
        );

        // Return AI-generated content for image selection step
        res.json({
            success: true,
            message: 'AI content generated. Select images before final PPTX.',
            data: presentationData
        });

    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ─── Generate PPTX (with images) ────────────────────────────────
app.post('/api/generate-pptx', async (req, res) => {
    try {
        const presentationData = req.body;
        if (!presentationData || !presentationData.slides) {
            return res.status(400).json({ error: 'Presentation data is required' });
        }

        console.log(`Generating PPTX: "${presentationData.title}" with ${presentationData.slides.length} slides`);

        // Download images for slides that have imageUrl
        for (const slide of presentationData.slides) {
            if (slide.imageUrl) {
                try {
                    console.log(`Downloading image for slide: ${slide.title}`);
                    const imgResponse = await fetch(slide.imageUrl);
                    if (imgResponse.ok) {
                        const arrayBuffer = await imgResponse.arrayBuffer();
                        const buffer = Buffer.from(arrayBuffer);
                        const base64 = buffer.toString('base64');
                        const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
                        slide.imageData = `data:${contentType};base64,${base64}`;
                    }
                } catch (imgErr) {
                    console.error(`Failed to download image for "${slide.title}":`, imgErr);
                    // Continue without image
                }
            }
        }

        // Generate PPTX with embedded images
        const fileName = await createPptx(presentationData, OUTPUT_DIR, 'general');
        const protocol = req.protocol;
        const host = req.get('host');
        const downloadUrl = `${protocol}://${host}/download/${fileName}`;

        // Save to Telegram
        if (fileName) {
            const filePath = path.join(OUTPUT_DIR, fileName);
            telegramDB.savePresentation(filePath, {
                title: presentationData.title || 'Untitled Presentation',
                slideCount: presentationData.slides.length,
                userStyle: presentationData.userStyle || 'default',
                fileName: fileName
            }).catch(err => console.error('Failed to save to Telegram:', err));
        }

        res.json({
            success: true,
            message: 'PPTX generated with images',
            downloadUrl: downloadUrl,
        });

    } catch (error) {
        console.error('PPTX generation error:', error);
        res.status(500).json({ error: 'PPTX generation failed' });
    }
});

// ─── AI Search Endpoint ─────────────────────────────────────────
app.post('/api/ai-search', async (req, res) => {
    try {
        const { query, mode } = req.body;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const result = await aiSearch(query, mode || 'quick');
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('AI Search error:', error);
        res.status(500).json({ error: 'AI Search failed' });
    }
});

// ─── Extract Key Points Endpoint ────────────────────────────────
app.post('/api/extract-keypoints', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        const result = await extractKeyPoints(text);
        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Key points extraction error:', error);
        res.status(500).json({ error: 'Key point extraction failed' });
    }
});



// ─── Clipdrop Endpoints ─────────────────────────────────────────

// Generate Image using OpenRouter (Gemini 2.0 Flash - SVG Fallback)
// Generate Image using Bytez (Imagen 4.0)
app.post('/api/clipdrop/generate', async (req, res) => {
    try {
        const { prompt, boost = true } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        let finalPrompt = prompt;
        if (boost) {
            finalPrompt = `
                ULTRA-HD VERTICAL VISUAL: "${prompt}".
                Composition: Full-screen portrait mode, edge-to-edge layout, vertical alignment, no borders.
                Style: 9:16 aspect ratio cinematic composition, clean professional design, high-end technical clarity.
                Quality: 8K resolution details, sharp professional edges, cinematic lighting, vibrant contrast.
                Perspective: Full-body or full-scene vertical view, optimized for high-resolution mobile/poster screens.
                No empty space at top/bottom, fill the entire frame perfectly.
            `.trim();
        }

        console.log('Generating image with Bytez (Imagen 4.0):', finalPrompt.substring(0, 100) + '...');

        const dataUri = await generateImageDataUrl(finalPrompt, boost);

        res.json({ success: true, image: dataUri });
    } catch (error: any) {
        console.error('Image generation error:', error);
        res.status(500).json({ error: 'Image generation failed: ' + error.message });
    }
});

app.post('/api/clipdrop/remove-bg', upload.single('image_file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'Image file is required' });

        console.log(`Clipdrop Remove BG: ${file.originalname}`);
        const imageBuffer = fs.readFileSync(file.path);

        const resultBuffer = await removeBackground(imageBuffer, file.originalname);
        const base64 = resultBuffer.toString('base64');
        const dataUrl = `data:image/png;base64,${base64}`;

        // Clean up
        fs.unlinkSync(file.path);

        res.json({ success: true, image: dataUrl });
    } catch (error: any) {
        if (req.file) fs.unlinkSync(req.file.path); // Clean up on error
        console.error('Clipdrop remove-bg error:', error);
        res.status(500).json({ error: error.message || 'Background removal failed' });
    }
});

// ─── Web Image Search Endpoint ──────────────────────────────────
app.post('/api/search-images', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: 'Query is required' });

        console.log(`Web image search: "${query}"`);

        let images: any[] = [];

        // Strategy 1: Try Google Image Search (g-i-s)
        try {
            console.log('Attempting Strategy 1: Google Image Search (g-i-s)...');
            const googleResults = await new Promise<any[]>((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timeout')), 5000);
                gis(query, (error: any, results: any[]) => {
                    clearTimeout(timeout);
                    if (error) reject(error);
                    else resolve(results);
                });
            });

            if (googleResults && googleResults.length > 0) {
                console.log(`Startegy 1 Success: Found ${googleResults.length} images.`);
                images = googleResults.slice(0, 100).map((r: any) => ({
                    title: query,
                    image: r.url,
                    thumbnail: r.url,
                    url: r.url,
                    source: 'Google'
                }));
            }
        } catch (err) {
            console.log('Strategy 1 Failed:', err);
        }

        // Strategy 2: If Google fails/empty, try DuckDuckGo
        if (images.length === 0) {
            try {
                console.log('Attempting Strategy 2: DuckDuckGo...');
                // @ts-ignore
                const { searchImages } = require('duck-duck-scrape');
                const ddgResults = await searchImages(query);

                if (ddgResults && ddgResults.results && ddgResults.results.length > 0) {
                    console.log(`Strategy 2 Success: Found ${ddgResults.results.length} images.`);
                    images = ddgResults.results.map((r: any) => ({
                        title: r.title || query,
                        image: r.image,
                        thumbnail: r.thumbnail,
                        url: r.url,
                        source: 'DuckDuckGo'
                    }));
                }
            } catch (err) {
                console.log('Strategy 2 Failed:', err);
            }
        }

        // Strategy 3: If all else fails, use Wikimedia (Classic Fallback)
        if (images.length === 0) {
            try {
                console.log('Attempting Strategy 3: Wikimedia Fallback (Strict)...');
                const k = encodeURIComponent(query + ' filetype:jpg -historical -drawing -chart');
                const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${k}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*&gsrlimit=20`;

                const wikiRes = await fetch(url);
                const wikiData = await wikiRes.json();

                if (wikiData.query && wikiData.query.pages) {
                    const wikiImages = Object.values(wikiData.query.pages)
                        .map((p: any) => ({
                            title: p.title || query,
                            image: p.imageinfo?.[0]?.url,
                            thumbnail: p.imageinfo?.[0]?.thumburl,
                            url: p.imageinfo?.[0]?.url,
                            source: 'Wikimedia'
                        }))
                        .filter((img: any) => img.image);

                    if (wikiImages.length > 0) {
                        console.log(`Strategy 3 Success: Found ${wikiImages.length} images.`);
                        images = wikiImages;
                    }
                }
            } catch (err) {
                console.log('Strategy 3 Failed:', err);
            }
        }

        // Strategy 4: Relaxed Fallback (Fuzzy Search for typos)
        if (images.length === 0) {
            try {
                console.log('Attempting Strategy 4: Wikimedia Fallback (Fuzzy)...');
                // Add ~ to each word for fuzzy matching
                const fuzzyQuery = query.split(' ').map((w: string) => w + '~').join(' ');
                const k = encodeURIComponent(fuzzyQuery);
                const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${k}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*&gsrlimit=20`;

                const wikiRes = await fetch(url);
                const wikiData = await wikiRes.json();

                if (wikiData.query && wikiData.query.pages) {
                    const wikiImages = Object.values(wikiData.query.pages)
                        .map((p: any) => ({
                            title: p.title || query,
                            image: p.imageinfo?.[0]?.url,
                            thumbnail: p.imageinfo?.[0]?.thumburl,
                            url: p.imageinfo?.[0]?.url,
                            source: 'Wikimedia (Fuzzy)'
                        }))
                        .filter((img: any) => img.image);

                    if (wikiImages.length > 0) {
                        console.log(`Strategy 4 Success: Found ${wikiImages.length} images.`);
                        images = wikiImages;
                    }
                }
            } catch (err) {
                console.log('Strategy 4 Failed:', err);
            }
        }

        if (images.length === 0) {
            // Final Hail Mary: Search for individual words if the full phrase fails
            const words = query.split(' ');
            if (words.length > 1) {
                try {
                    console.log('Attempting Strategy 5: Single Word Fallback...');
                    const mainWord = words.sort((a: string, b: string) => b.length - a.length)[0]; // Longest word
                    const k = encodeURIComponent(mainWord + '~'); // Fuzzy match the word
                    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${k}&gsrnamespace=6&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*&gsrlimit=20`;

                    const wikiRes = await fetch(url);
                    const wikiData = await wikiRes.json();

                    if (wikiData.query && wikiData.query.pages) {
                        const wikiImages = Object.values(wikiData.query.pages)
                            .map((p: any) => ({
                                title: p.title || query,
                                image: p.imageinfo?.[0]?.url,
                                thumbnail: p.imageinfo?.[0]?.thumburl,
                                url: p.imageinfo?.[0]?.url,
                                source: 'Wikimedia (Word)'
                            }))
                            .filter((img: any) => img.image);

                        if (wikiImages.length > 0) {
                            console.log(`Strategy 5 Success: Found ${wikiImages.length} images.`);
                            images = wikiImages;
                        }
                    }
                } catch (e) { }
            }
        }

        if (images.length === 0) {
            return res.status(404).json({ error: 'No images found from any provider' });
        }

        res.json({ success: true, images });
    } catch (error: any) {
        console.error('Web image search error:', error);
        res.status(500).json({ error: 'Failed to search images' });
    }
});

// ─── File Convert Endpoint ──────────────────────────────────────
app.post('/api/convert', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'File is required' });
        }
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        let text = '';

        if (ext === 'pdf') {
            // @ts-ignore
            const pdfParse = require('pdf-parse');
            const dataBuffer = fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (ext === 'docx') {
            // @ts-ignore
            const mammoth = require('mammoth');
            const result = await mammoth.extractRawText({ path: file.path });
            text = result.value;
        } else if (ext === 'txt' || ext === 'md') {
            text = fs.readFileSync(file.path, 'utf-8');
        } else {
            return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, TXT, or MD.' });
        }

        // Clean up uploaded file
        fs.unlinkSync(file.path);

        res.json({
            success: true,
            data: {
                text,
                filename: file.originalname,
                charCount: text.length,
                wordCount: text.split(/\s+/).filter(Boolean).length
            }
        });
    } catch (error) {
        console.error('File conversion error:', error);
        res.status(500).json({ error: 'File conversion failed' });
    }
});

// ─── Generate Infographic Image Endpoint ────────────────────────
app.post('/api/generate-infographic', async (req, res) => {
    try {
        const { prompt, topic, style } = req.body;
        const finalPrompt = prompt || topic;

        if (!finalPrompt) {
            return res.status(400).json({ error: 'Prompt or Topic is required' });
        }

        console.log(`Generating infographic for: "${finalPrompt}"...`);

        // 1. Generate structured content data
        const infographicData = await generateInfographic(finalPrompt, style || 'corporate');

        // 2. Generate the visual poster using enriched professional keywords
        let imageUrl = '';
        try {
            const visualStylePrompt = `
                Vertical professional infographic poster about: "${finalPrompt}".
                Layout: Split layout, clear visual hierarchy, symmetrical balance, grid-based alignment.
                Visual Style: Flat vector illustration, semi-realistic scientific icons, clean modern design, minimal but detailed graphics, textbook-style visuals.
                Colors: Contrast dual-theme (warm vs cool), smooth gradients, soft glow effects, high contrast for readability.
                Quality: High resolution, 4K quality, 300 DPI, print-ready, sharp vector graphics.
                Lighting: Soft glow effects, subtle shadows, highlighted focal points, clean edges.
                No generic text, use symbols and professional diagrams.
            `.trim();

            imageUrl = await generateImageDataUrl(visualStylePrompt, true);
        } catch (imgErr) {
            console.error('Infographic image generation failed, continuing with data only:', imgErr);
        }

        res.json({
            success: true,
            data: infographicData,
            imageUrl: imageUrl
        });
    } catch (error: any) {
        console.error('Infographic generation error:', error);
        res.status(500).json({ error: 'Failed to generate infographic: ' + error.message });
    }
});

app.get('/', (req, res) => {
    res.send('Pre Max API is running');
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Network: http://0.0.0.0:${PORT}`);
    // Get the local IP for convenience
    const nets = require('os').networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`  ➜  LAN: http://${net.address}:${PORT}`);
            }
        }
    }
});

