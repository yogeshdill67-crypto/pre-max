
// Fetch stock images from Wikimedia Commons
// Fetch stock images from Server (Google Images)
export const fetchStockImages = async (keyword: string, count: number = 8): Promise<string[]> => {
    try {
        const res = await fetch('http://localhost:3000/api/search-images', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: keyword })
        });

        const data = await res.json();

        if (data.success && Array.isArray(data.images)) {
            return data.images.slice(0, count).map((img: any) => img.image);
        }
        return [];
    } catch (e) {
        console.error("Server image search failed", e);
        return [];
    }
};

// Generate AI Images via Server (Bytez/Imagen)
export const generateAIImages = async (keyword: string, prompt?: string, count: number = 2): Promise<string[]> => {
    const p = prompt || `cinematic product shot of ${keyword}, studio lighting, 8k, photorealistic, white background`;

    // We generate images in parallel
    const promises = Array(count).fill(0).map(async () => {
        try {
            const res = await fetch('http://localhost:3000/api/clipdrop/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: p, boost: true })
            });
            const data = await res.json();
            if (data.success && data.image) {
                return data.image; // Base64 data URL
            }
        } catch (e) {
            console.error("AI generation failed for one request", e);
        }
        return null;
    });

    const results = await Promise.all(promises);
    return results.filter(url => url !== null) as string[];
};
