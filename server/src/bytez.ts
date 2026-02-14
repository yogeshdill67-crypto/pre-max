// @ts-ignore
import Bytez from "bytez.js";

// Hardcoded key as requested by user
const BYTEZ_API_KEY = "9718b611777769a4dd8243d868d8d410";

/**
 * Generate an image using Bytez SDK with Imagen 4.0 model
 * @param prompt - Text description of the image to generate
 * @returns Promise<Buffer> - Image data as Buffer
 */
export const generateImageWithBytez = async (prompt: string): Promise<Buffer> => {
    try {
        console.log(`Bytez: Generating image for prompt: "${prompt}" using Imagen 4.0`);

        const sdk = new Bytez(BYTEZ_API_KEY);
        // Using google/imagen-4.0-generate-001 as requested
        const model = sdk.model("google/imagen-4.0-generate-001");

        const { error, output } = await model.run(prompt);

        if (error) {
            throw new Error(`Bytez SDK Error: ${error}`);
        }

        if (output) {
            if (output.startsWith('http')) {
                const response = await fetch(output);
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            } else {
                const base64Data = output.replace(/^data:image\/\w+;base64,/, '');
                return Buffer.from(base64Data, 'base64');
            }
        }

        throw new Error('No output received from Bytez SDK');

    } catch (error: any) {
        console.error('Bytez image generation failed:', error.message);
        throw error;
    }
};

/**
 * Generate an infographic image using Bytez SDK with Imagen 4.0 model
 * @param prompt - Text description of the image to generate
 * @returns Promise<Buffer> - Image data as Buffer
 */
export const generateInfographicImageWithBytez = async (prompt: string): Promise<Buffer> => {
    try {
        console.log(`Bytez: Generating infographic for prompt: "${prompt}" using Imagen 4.0`);

        const sdk = new Bytez(BYTEZ_API_KEY);
        // Using google/imagen-4.0-generate-001 as requested
        const model = sdk.model("google/imagen-4.0-generate-001");

        const { error, output } = await model.run(prompt);

        if (error) {
            throw new Error(`Bytez SDK Error: ${error}`);
        }

        if (output) {
            if (output.startsWith('http')) {
                const response = await fetch(output);
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            } else {
                const base64Data = output.replace(/^data:image\/\w+;base64,/, '');
                return Buffer.from(base64Data, 'base64');
            }
        }

        throw new Error('No output received from Bytez SDK');

    } catch (error: any) {
        console.error('Bytez infographic generation failed:', error.message);
        throw error;
    }
};

/**
 * Call a chat model using Bytez SDK
 * @param messages - Array of message objects with role and content
 * @returns Promise<string> - Model output text
 */
export const callChatModelWithBytez = async (messages: any[]): Promise<string> => {
    try {
        console.log(`Bytez: Calling chat model with ${messages.length} messages...`);
        const sdk = new Bytez(BYTEZ_API_KEY);
        const model = sdk.model("meta-llama/Llama-2-7b-chat-hf");

        // Many Bytez chat models expect the first message if it's a simple run, or the whole array if it's chat-tuned.
        // We'll pass the array but also prepare a fallback if it returns no output.
        const response = await model.run(messages);

        if (response.error) {
            throw new Error(`Bytez AI Error: ${response.error}`);
        }

        const output = response.output;
        if (output) {
            if (typeof output === 'string') return output;
            if (Array.isArray(output) && output[0]?.content) return output[0].content;
            if (Array.isArray(output) && typeof output[0] === 'string') return output[0];
            if (output.content) return output.content;
            return typeof output === 'object' ? JSON.stringify(output) : String(output);
        }

        throw new Error('Model produced no output text.');

    } catch (error: any) {
        console.error('Bytez AI Error:', error.message);
        throw error;
    }
};

/**
 * Generate an image and return as base64 data URL
 * @param prompt - Text description of the image to generate
 * @param isInfographic - Whether to use the infographic model (Imagen 4.0) or standard (Imagen 4.0)
 * @returns Promise<string> - Base64 data URL
 */
export const generateImageDataUrl = async (prompt: string, isInfographic: boolean = false): Promise<string> => {
    try {
        const imageBuffer = isInfographic
            ? await generateInfographicImageWithBytez(prompt)
            : await generateImageWithBytez(prompt);

        const base64 = imageBuffer.toString('base64');
        return `data:image/png;base64,${base64}`;
    } catch (e) {
        console.error("Failed to generate image URL:", e);
        throw e;
    }
};
