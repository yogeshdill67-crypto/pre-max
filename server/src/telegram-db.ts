
import fs from 'fs';

export interface TelegramConfig {
    botToken: string;
    chatId?: string;
}

export class TelegramDB {
    private botToken: string;
    private chatId: string | undefined;
    private baseUrl: string;

    constructor(config: TelegramConfig) {
        this.botToken = config.botToken;
        this.chatId = config.chatId;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    setChatId(chatId: string) {
        this.chatId = chatId;
        console.log(`TelegramDB: Chat ID set to ${chatId}`);
    }

    async getUpdates() {
        try {
            const response = await fetch(`${this.baseUrl}/getUpdates`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('TelegramDB: Failed to get updates', error);
            return null;
        }
    }

    async getChatIdFromUpdates(): Promise<string | null> {
        const updates = await this.getUpdates();
        if (updates && updates.result && updates.result.length > 0) {
            // content could be in message.chat.id
            const lastUpdate = updates.result[updates.result.length - 1];
            if (lastUpdate.message && lastUpdate.message.chat) {
                return String(lastUpdate.message.chat.id);
            }
        }
        return null;
    }

    async sendMessage(text: string) {
        if (!this.chatId) {
            console.error('TelegramDB: Chat ID not set. Cannot send message.');
            return;
        }
        try {
            const response = await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: text
                })
            });
            return await response.json();
        } catch (error) {
            console.error('TelegramDB: Failed to send message', error);
        }
    }

    async sendDocument(filePath: string, caption?: string) {
        if (!this.chatId) {
            console.error('TelegramDB: Chat ID not set. Cannot send document.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('chat_id', this.chatId);
            if (caption) formData.append('caption', caption);

            const fileBuffer = fs.readFileSync(filePath);
            const blob = new Blob([fileBuffer]);
            formData.append('document', blob, filePath.split(/[\\/]/).pop());

            const response = await fetch(`${this.baseUrl}/sendDocument`, {
                method: 'POST',
                body: formData
            });

            return await response.json();

        } catch (error) {
            console.error('TelegramDB: Failed to send document', error);
        }
    }

    async savePresentation(filePath: string, metadata: any) {
        const caption = `
🆕 New Presentation Generated
📄 Title: ${metadata.title}
📊 Slides: ${metadata.slideCount}
🎨 Style: ${metadata.userStyle}
📅 Date: ${new Date().toLocaleString()}
        `.trim();

        await this.sendMessage(JSON.stringify(metadata, null, 2)); // Save metadata as JSON text
        await this.sendDocument(filePath, caption); // Save file
    }
}
