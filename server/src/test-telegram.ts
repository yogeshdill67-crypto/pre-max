
import dotenv from 'dotenv';
dotenv.config();
import { TelegramDB } from './telegram-db';

async function test() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.error('No TELEGRAM_BOT_TOKEN found in .env');
        return;
    }

    const db = new TelegramDB({ botToken: token, chatId: process.env.TELEGRAM_CHAT_ID });

    try {
        const meResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        const me = await meResponse.json();
        if (me.ok) {
            console.log(`Bot Info: @${me.result.username} (${me.result.first_name})`);
            console.log(`Please send a message to @${me.result.username} if you haven't already.`);
        }
    } catch (e) {
        console.error('Failed to get bot info:', e);
    }

    console.log('Checking for updates to find Chat ID...');
    const chatId = await db.getChatIdFromUpdates();

    if (chatId) {
        console.log(`Found Chat ID: ${chatId}`);
        console.log('Attempting to send a test message...');
        db.setChatId(chatId);
        await db.sendMessage('Hello from PreMax! TelegramDB is connected.');
    } else {
        console.log('No Chat ID found. Please send a message to your bot and run this script again.');
    }
}

test();
