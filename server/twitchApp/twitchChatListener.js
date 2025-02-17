const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { StaticAuthProvider } = require('@twurple/auth');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { skillAttempt, eatItem, sellItem} = require('../utils/gameMechanics');
const { addNewPlayer} = require('../utils/dbHelper');
require('dotenv').config();

// Twitch API credentials from .env
const clientId = process.env.TWITCH_CLIENT_ID;
const botUsername = process.env.TWITCH_BOT_USERNAME;
const botAccessToken = process.env.TWITCH_ACCESS_TOKEN; // KotuGuard Token
const eventSubAccessToken = process.env.TWITCH_EVENTSUB_ACCESS_TOKEN; // QuietGamerGirl Token
const channelName = process.env.TWITCH_CHANNEL_NAME;


async function handleSkillRedemption(chatClient, userName, skillType, itemType) {
    try {
        const resultMessage = await skillAttempt(userName, skillType, itemType);
        chatClient.say(`#${channelName}`, `@${userName}, ${resultMessage}`);
    } catch (error) {
        console.error(`❌ Error processing skill attempt for ${userName}:`, error);
    }
}

async function handleEatCommand(chatClient, userName, itemName) {
    try {
        const resultMessage = await eatItem(userName, itemName);
        chatClient.say(`#${channelName}`, `@${userName} ${resultMessage}`);
    } catch (error) {
        console.error(`❌ Error processing eat command for ${userName}:`, error);
    }
}

async function handleSellCommand(chatClient, userName, itemName) {
    try {
        const resultMessage = await sellItem(userName, itemName);
        chatClient.say(`#${channelName}`, `@${userName} ${resultMessage}`);
    } catch (error) {
        console.error(`❌ Error processing sell command for ${userName}:`, error);
    }
}

async function startTwitchChatListener() {
    try {
        // ✅ Auth for Chat (KotuGuard)
        const botAuthProvider = new StaticAuthProvider(clientId, botAccessToken);
        const botApiClient = new ApiClient({ authProvider: botAuthProvider });

        // ✅ Auth for EventSub (QuietGamerGirl)
        const eventSubAuthProvider = new StaticAuthProvider(clientId, eventSubAccessToken);
        const eventSubApiClient = new ApiClient({ authProvider: eventSubAuthProvider });

        // ✅ Convert Twitch Username to User ID (for EventSub)
        const user = await eventSubApiClient.users.getUserByName(channelName);
        if (!user) throw new Error(`❌ Failed to fetch Twitch User ID for ${channelName}`);
        const userId = user.id;
        console.log(`✅ Twitch User ID for ${channelName}: ${userId}`);

         // **Twitch Chat Client (KotuGuard)**
         //may need to change to just botAuthProvider and remove the :
        const chatClient = new ChatClient({ authProvider: botAuthProvider, channels: [channelName] });
        await chatClient.connect();
        console.log(`✅ Twitch Chat Bot connected as ${botUsername}`);

        // **EventSub WebSocket Listener for Channel Point Redemptions**
        //need to fix this so that eat and sell replace the item with what is type in chat
        const listener = new EventSubWsListener({ apiClient: eventSubApiClient });
        listener.onChannelRedemptionAdd(userId, async (e) => {
            const rewardTitle = e.rewardTitle.toLowerCase();
            if (rewardTitle === 'hunt') {
                handleSkillRedemption(chatClient, e.userName, 'hunting_skills', 'Animal');
            } else if (rewardTitle === 'search') {
                handleSkillRedemption(chatClient, e.userName, 'searching_skills', 'iQuest');
            } else if (rewardTitle === 'eat') {
                handleEatCommand(chatClient, e.userName, 'fish');
            } else if (rewardTitle === 'sell') {
                handleSellCommand(chatClient, e.userName, 'fish');
            }
        });

        // Listen for chat messages
        chatClient.onMessage(async (channel, user, message) => {
            console.log(`💬 ${user}: ${message}`);
            if (message.startsWith('!')) {
                console.log(`🔹 Detected command: ${message}`);
                
                if (message.toLowerCase() === '!play') {
                    console.log(`🎮 ${user} used !play command. Attempting to add player...`);
                    const responseMessage = await addNewPlayer(user);
                    chatClient.say(channel, responseMessage);
                }
            }
        });

        await listener.start();
        console.log(`✅ EventSub Listener started`);

    } catch (error) {
        console.error('❌ Error starting Twitch chat listener:', error);
    }
}

module.exports = { startTwitchChatListener, eventSubApiClient };