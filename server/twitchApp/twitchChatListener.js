const { StaticAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { skillAttempt, eatItem, sellItem, travelItem } = require('../utils/gameMechanics');
const { addNewPlayer } = require('../utils/dbHelper');
const { getAccessToken, checkTokenExpiration } = require('../twitchApp/refreshTokens');

require('dotenv').config();
const channelName = process.env.TWITCH_CHANNEL_NAME;
const clientId = process.env.TWITCH_CLIENT_ID;

let chatClient, eventSubApiClient, botApiClient, listener;

/**
 * ✅ Set up the Twitch API clients
 */
async function setupTwitchClients() {
    try {
        const chatAccessToken = await getAccessToken('chat');
        const eventSubAccessToken = await getAccessToken('eventsub');

        if (!chatAccessToken || !eventSubAccessToken) throw new Error("❌ Missing access tokens.");

        // ✅ Correct way to create an AuthProvider
        const chatAuthProvider = new StaticAuthProvider(clientId, chatAccessToken);
        const eventSubAuthProvider = new StaticAuthProvider(clientId, eventSubAccessToken);

        // ✅ Pass the correct AuthProvider
        botApiClient = new ApiClient({ authProvider: chatAuthProvider });
        eventSubApiClient = new ApiClient({ authProvider: eventSubAuthProvider });

        // ✅ Get the Twitch user ID properly
        const user = await eventSubApiClient.users.getUserByName(channelName);
        if (!user) throw new Error(`❌ Failed to fetch Twitch User ID for ${channelName}`);

        chatClient = new ChatClient({ authProvider: chatAuthProvider, channels: [channelName] });
        chatClient.connect();

        listener = new EventSubWsListener({ apiClient: eventSubApiClient });
        listener.start();

        return { userId: user.id };
    } catch (error) {
        console.error('❌ Error setting up Twitch clients:', error);
        return null;
    }
}

async function startTwitchChatListener() {
    try {
        const validTokens = await checkTokenExpiration();
        if (!validTokens) return;

        const clients = await setupTwitchClients();
        if (!clients) return;

        chatClient.onMessage(async (channel, user, message) => {
            if (message.startsWith('!')) {
                if (message.toLowerCase() === '!play') {
                    try {
                        const twitchUser = await eventSubApiClient.users.getUserByName(user);
                        if (twitchUser) await addNewPlayer(user, twitchUser.id);
                    } catch (error) {
                        console.log(`❌ Error adding new player: ${error.message}`);
                    }
                }
            }
        });

        listener.onChannelRedemptionAdd(clients.userId, async (e) => {
            const rewardTitle = e.rewardTitle.toLowerCase();
            const userInput = e.input?.trim();

            const resultMessage = 'capturing';
            

            if (rewardTitle === 'hunt') {
                resultMessage = await skillAttempt(e.userName, 'hunting_skills', 'Animal');
            } else if (rewardTitle === 'search') {
                resultMessage = await skillAttempt(e.userName, 'searching_skills', 'iQuest');
            } else if (['eat', 'sell', 'travel'].includes(rewardTitle) && userInput) {
                switch (rewardTitle) {
                    case 'eat':
                        resultMessage = await eatItem(userName, userInput);
                        break;
                    case 'sell':
                        resultMessage = await sellItem(userName, userInput);
                        break;
                    case 'travel':
                        resultMessage = await travelItem(userName, userInput);
                        break;
                    default:
                        resultMessage = `❌ Invalid command: ${commandType}`;
                        break;
                }
        
            } else {
                chatClient.say(`#${channelName}`, `@${e.userName} Invalid or missing input for redemption.`);
            }

            chatClient.say(`#${channelName}`, `@${userName}, ${resultMessage}`);
        });

        console.log(`🎉 Twitch Chat Listener & EventSub Ready!`);
    } catch (error) {
        console.error('❌ Error starting Twitch chat listener:', error);
    }
}

module.exports = { startTwitchChatListener };