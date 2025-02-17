const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { StaticAuthProvider } = require('@twurple/auth');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { skillAttempt,addNewPlayer, eatItem, sellItem} = require('../utils/gameMechanics');
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

/**
 * Handles the !eat command, allowing players to consume food items.
 * @param {string} channelName - The Twitch channel name.
 * @param {string} userName - The Twitch username.
 * @param {string} itemName - The name of the item to eat.
 * @param {number} amount - The quantity to consume.
 */
async function handleEatCommand(chatClient, userName, itemName, amount = 1) {
    try {
        const resultMessage = await eatItem(userName, itemName, amount);
        chatClient.say(`#${channelName}`, `@${userName} ${resultMessage}`);
    } catch (error) {
        console.error(`❌ Error processing eat command for ${userName}:`, error);
    }
}

/**
 * Handles the !sell command, allowing players to sell inventory items.
 * @param {string} channelName - The Twitch channel name.
 * @param {string} userName - The Twitch username.
 * @param {string} itemName - The name of the item to sell.
 * @param {number} amount - The quantity to sell.
 */
async function handleSellCommand(chatClient, userName, itemName, amount = 1) {
    try {
        const resultMessage = await sellItem(userName, itemName, amount);
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
        const listener = new EventSubWsListener({ apiClient: eventSubApiClient });
        listener.onChannelRedemptionAdd(userId, async (e) => {
            const rewardTitle = e.rewardTitle.toLowerCase();
            if (rewardTitle === 'fish') {
                handleSkillRedemption(chatClient, e.userName, 'fishing_skills', 'Fish');
            } else if (rewardTitle === 'hunt') {
                handleSkillRedemption(chatClient, e.userName, 'hunting_skills', 'Animal');
            } else if (rewardTitle === 'search') {
                handleSkillRedemption(chatClient, e.userName, 'searching_skills', 'iQuest');
            }
        });

        /**
         * Listens for Twitch chat messages and processes commands.
         */
        chatClient.onMessage(async (channel, user, message) => {
            console.log(`💬 ${user}: ${message}`);
            
            if (message.startsWith('!')) {
                console.log(`🔹 Detected command: ${message}`);
        
                const args = message.split(' ');
                const command = args[0].toLowerCase();
        
                if (!userName) {
                    console.error("❌ Error: Twitch username is undefined.");
                    return;
                }
        
                switch (command) {
                    case "!play":
                        const responseMessage = await addNewPlayer(user);
                        chatClient.say(channel, responseMessage);
                        break;
                    
                    case "!eat":
                        if (args.length < 2) return;
                        await handleEatCommand(channel, user, args[1], args.length > 2 ? parseInt(args[2]) : 1);
                        break;
                        
                    case "!sell":
                        if (args.length < 2) return;
                        await handleSellCommand(channel, user, args[1], args.length > 2 ? parseInt(args[2]) : 1);
                        break;
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