import fs from 'fs';
import path from 'path';
import https from 'https';

const CLIPDROP_API_KEY = process.env.CLIPDROP_API_KEY;

// Helper to fetch a placeholder image buffer
const getPlaceholderImage = (): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        // Using a reliable placeholder service
        const url = 'https://placehold.co/600x400/png?text=AI+Generated+Image';
        https.get(url, (res) => {
            const data: any[] = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
            res.on('error', (err) => reject(err));
        }).on('error', (err) => reject(err));
    });
};

export const generateImage = async (prompt: string): Promise<Buffer> => {
    // FALLBACK: If key is missing or default, return placeholder
    if (!CLIPDROP_API_KEY || CLIPDROP_API_KEY.includes('your_clipdrop_api_key')) {
        console.warn('⚠️ Clipdrop API Key missing. Returning placeholder image.');
        return await getPlaceholderImage();
    }

    try {
        const form = new FormData();
        form.append('prompt', prompt);

        const response = await fetch('https://clipdrop-api.co/text-to-image/v1', {
            method: 'POST',
            headers: {
                'x-api-key': CLIPDROP_API_KEY,
            },
            body: form,
        });

        if (!response.ok) {
            const text = await response.text();
            // If error is 402 (credits) or 403 (key), fall back
            if (response.status === 402 || response.status === 403) {
                console.warn(`Clipdrop Error (${response.status}): ${text}. Returning placeholder.`);
                return await getPlaceholderImage();
            }
            throw new Error(`Clipdrop API Error: ${text}`);
        }

        const imageArrayBuffer = await response.arrayBuffer();
        return Buffer.from(imageArrayBuffer);
    } catch (error) {
        console.warn('Clipdrop generation failed, using fallback:', error);
        return await getPlaceholderImage();
    }
};

export const removeBackground = async (imageBuffer: Buffer, originalName: string): Promise<Buffer> => {
    // FALLBACK: If key is missing, return original image
    if (!CLIPDROP_API_KEY || CLIPDROP_API_KEY.includes('your_clipdrop_api_key')) {
        console.warn('⚠️ Clipdrop API Key missing. Returning original image (background removal skipped).');
        return imageBuffer;
    }

    try {
        // Convert Buffer to Uint8Array for Blob constructor
        const uint8Array = new Uint8Array(imageBuffer);
        const blob = new Blob([uint8Array]);
        const form = new FormData();
        form.append('image_file', blob, originalName);

        const response = await fetch('https://clipdrop-api.co/remove-background/v1', {
            method: 'POST',
            headers: {
                'x-api-key': CLIPDROP_API_KEY,
            },
            body: form,
        });

        if (!response.ok) {
            const text = await response.text();
            if (response.status === 402 || response.status === 403) {
                console.warn(`Clipdrop Error (${response.status}): ${text}. Returning original.`);
                return imageBuffer;
            }
            throw new Error(`Clipdrop API Error: ${text}`);
        }

        const resultArrayBuffer = await response.arrayBuffer();
        return Buffer.from(resultArrayBuffer);
    } catch (error) {
        console.warn('Clipdrop remove-bg failed, returning original:', error);
        return imageBuffer;
    }
};
