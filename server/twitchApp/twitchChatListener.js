const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { StaticAuthProvider } = require('@twurple/auth');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { skillAttempt } = require('../utils/gameMechanics');
require('dotenv').config();

// Twitch API credentials from .env
const clientId = process.env.TWITCH_CLIENT_ID;
const accessToken = process.env.TWITCH_ACCESS_TOKEN;
const botUsername = process.env.TWITCH_BOT_USERNAME;
const channelName = process.env.TWITCH_CHANNEL_NAME;

async function handleSkillRedemption(chatClient, userName, skillType, itemType) {
    try {
        const resultMessage = await skillAttempt(userName, skillType, itemType);
        chatClient.say(`#${channelName}`, `@${userName}, ${resultMessage}`);
    } catch (error) {
        console.error(`❌ Error processing skill attempt for ${userName}:`, error);
    }
}

async function startTwitchChatListener() {
    try {
        // Authentication
        const authProvider = new StaticAuthProvider(clientId, accessToken);
        const apiClient = new ApiClient({ authProvider });

        // ✅ Convert Twitch Username to User ID
        const user = await apiClient.users.getUserByName(botUsername);
        if (!user) {
            throw new Error(`❌ Failed to fetch Twitch User ID for ${botUsername}`);
        }
        const userId = user.id;  // ✅ User ID needed for EventSub

        console.log(`✅ Twitch User ID for ${botUsername}: ${userId}`);

        // Chat client setup
        const chatClient = new ChatClient({ authProvider, channels: [channelName] });
        await chatClient.connect();
        console.log(`✅ Twitch Chat Bot connected as ${botUsername}`);
        
        // **EventSub WebSocket Listener for Channel Point Redemptions**
        const listener = new EventSubWsListener({ apiClient });
        listener.onChannelRedemptionAdd(userId, async (e) => {
            const rewardTitle = e.rewardTitle.toLowerCase();
            if (rewardTitle === 'fish') {
                handleSkillRedemption(chatClient, e.userName, 'fishing_skills', 'Fish');
            } else if (rewardTitle === 'hunt') {
                handleSkillRedemption(chatClient, e.userName, 'hunting_skills', 'Animal');
            }
        });

        // Listen for chat messages
        chatClient.onMessage((channel, user, message) => {
            console.log(`💬 ${user}: ${message}`);
            if (message.startsWith('!')) {
                console.log(`🔹 Detected command: ${message}`);
                
                if (message.toLowerCase() === '!play') {
                    console.log(`🎮 ${user} used !play command. Sending welcome message...`);
                    chatClient.say(channel, `Welcome to the game, @${user}!`);
                }
            }
        });

        await listener.start();
        console.log(`✅ EventSub Listener started`);

    } catch (error) {
        console.error('❌ Error starting Twitch chat listener:', error);
    }
}

module.exports = { startTwitchChatListener };
