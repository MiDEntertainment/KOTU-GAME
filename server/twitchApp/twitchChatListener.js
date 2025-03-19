const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { StaticAuthProvider } = require('@twurple/auth');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { skillAttempt, eatItem, sellItem, travelItem, buyItem } = require('../utils/gameMechanics');
const { addNewPlayer } = require('../utils/dbHelper');
const { getAccessToken, checkTokenExpiration } = require('../twitchApp/refreshTokens');

require('dotenv').config();
const channelName = process.env.TWITCH_CHANNEL_NAME;
const clientId = process.env.TWITCH_CLIENT_ID;

let chatClient, eventSubApiClient, listener, chatAccessToken, clients;

/**
 * ✅ Set up the Twitch API clients
 */
async function setupTwitchClients() {
    if (chatAccessToken != await getAccessToken('chat')) {
        try {
            chatAccessToken = await getAccessToken('chat');
            const eventSubAccessToken = await getAccessToken('eventsub');
    
            if (!chatAccessToken || !eventSubAccessToken) throw new Error("❌ Missing access tokens.");
    
            // ✅ Correct way to create an AuthProvider
            const chatAuthProvider = new StaticAuthProvider(clientId, chatAccessToken);
            const eventSubAuthProvider = new StaticAuthProvider(clientId, eventSubAccessToken);
    
            // ✅ Pass the correct AuthProvider
            eventSubApiClient = new ApiClient({ authProvider: eventSubAuthProvider });
    
            // ✅ Get the Twitch user ID properly
            const user = await eventSubApiClient.users.getUserByName(channelName);
            if (!user) throw new Error(`❌ Failed to fetch Twitch User ID for ${channelName}`);
    
            chatClient = new ChatClient({ authProvider: chatAuthProvider, channels: [channelName] });
            chatClient.connect();
    
            listener = new EventSubWsListener({ apiClient: eventSubApiClient });
            listener.start();
    
            console.log(`✅ Twitch clients set up.`);
    
            return { userId: user.id };
        } catch (error) {
            console.error('❌ Error setting up Twitch clients:', error);
            return null;
        }
    }

    return { userId: user.id };
    
}

async function startTwitchChatListener() {
    try {
        const validTokens = await checkTokenExpiration();
        if (validTokens != "Valid") return;

        clients = await setupTwitchClients();
        if (!clients) return;

        //make sure this is working. Security = Add a cooldown for the Play Command
        chatClient.onMessage(async (channel, user, message) => {
            if (message.startsWith('!')) {
                if (message.toLowerCase() === '!play') {
                    try {
                        const twitchUser = await eventSubApiClient.users.getUserByName(user);
                        await addNewPlayer(user, twitchUser.id);
                    } catch (error) {
                        console.log(`❌ Error adding new player: ${error.message}`);
                    }
                }
            }
        });

        listener.onChannelRedemptionAdd(clients.userId, async (e) => {
            try {
                const rewardTitle = e.rewardTitle.toLowerCase();
                const userInput = e.input?.trim();
        
                let resultMessage = 'capturing';  // ✅ Use `let` instead of `const`
        
                if (rewardTitle === 'hunt') {
                    resultMessage = await skillAttempt(e.userName, 'hunting_skills', 'Food');
                } else if (rewardTitle === 'search') {
                    resultMessage = await skillAttempt(e.userName, 'searching_skills', 'Item');
                } else if (rewardTitle === 'play') {
                    const twitchUser = await eventSubApiClient.users.getUserByName(user);
                    resultMessage = await skillAttempt(e.userName, twitchUser.id);
                } else if (['eat', 'sell', 'travel', 'buy'].includes(rewardTitle) && userInput) {
                    switch (rewardTitle) {
                        case 'eat':
                            resultMessage = await eatItem(e.userName, userInput.toLowerCase().trim());
                            break;
                        case 'sell':
                            resultMessage = await sellItem(e.userName, userInput.toLowerCase().trim());
                            break;
                        case 'travel':
                            resultMessage = await travelItem(e.userName, userInput.toLowerCase().trim());
                            break;
                        case 'buy':
                            resultMessage = await buyItem(e.userName, userInput.toLowerCase().trim());
                            break;
                        default:
                            resultMessage = `❌ Invalid command: ${rewardTitle}`;
                            break;
                    }
                } else {
                    //need to make sure other redemptions work
                    chatClient.say(`#${channelName}`, `@${e.userName} Invalid or missing input for redemption.`);
                    return;
                }
        
                chatClient.say(`#${channelName}`, `@${e.userName}, ${resultMessage}`);
            } catch (error) {
                console.error('❌ Error in redemption handler:', error);
                chatClient.say(`#${channelName}`, `@${e.userName} An error occurred while processing your request.`);
            }
        });

        console.log(`🎉 Twitch Chat Listener & EventSub Ready!`);
    } catch (error) {
        console.error('❌ Error starting Twitch chat listener:', error);
    }
}

module.exports = { startTwitchChatListener, setupTwitchClients};