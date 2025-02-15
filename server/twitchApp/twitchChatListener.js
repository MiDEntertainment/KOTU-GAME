const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { StaticAuthProvider } = require('@twurple/auth');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
require('dotenv').config();

// Twitch API credentials from .env
const clientId = process.env.TWITCH_CLIENT_ID;
const accessToken = process.env.TWITCH_ACCESS_TOKEN;
const botUsername = process.env.TWITCH_BOT_USERNAME;
const channelName = process.env.TWITCH_CHANNEL_NAME;


async function startTwitchChatListener() {
    try {
        // Authentication
        const authProvider = new StaticAuthProvider(clientId, accessToken);
        const apiClient = new ApiClient({ authProvider });

        // ✅ Convert Twitch Username to User ID
        const user = await apiClient.users.getUserByName(channelName);
        if (!user) {
            throw new Error(`❌ Failed to fetch Twitch User ID for ${channelName}`);
        }
        const userId = user.id;  // ✅ User ID needed for EventSub

        console.log(`✅ Twitch User ID for ${channelName}: ${userId}`);

        // Chat client setup
        const chatClient = new ChatClient({ authProvider, channels: [channelName] });
        await chatClient.connect();
        console.log(`✅ Twitch Chat Bot connected as ${botUsername}`);
        
        // **EventSub WebSocket Listener for Channel Point Redemptions**
        const listener = new EventSubWsListener({ apiClient });
        listener.onChannelRedemptionAdd(userId, async (e) => {
            try {
                if (e.rewardTitle.toLowerCase() === 'fish') {                  
                    // Call skillAttempt and wait for the result
                    const resultMessage = await skillAttempt(e.userName, 'fishing_skills', 'Fish');
                    
                    // Send result to chat
                    chatClient.say(`#${channelName}`, `@${e.userName}, ${resultMessage}`);
                }
            } catch (error) {
                console.error(`❌ Error handling redemption:`, error);
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