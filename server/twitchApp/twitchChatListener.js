const { StaticAuthProvider } = require('@twurple/auth');
const { ChatClient } = require('@twurple/chat');
const { ApiClient } = require('@twurple/api');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { skillAttempt, eatItem, sellItem, travelItem, buyItem } = require('../utils/gameMechanics');
const { addNewPlayer } = require('../utils/dbHelper');
const { getAccessToken, checkTokenExpiration } = require('../twitchApp/refreshTokens');

require('dotenv').config();
const channelName = process.env.TWITCH_CHANNEL_NAME;
const clientId = process.env.TWITCH_CLIENT_ID;

let chatClient, eventSubApiClient, botApiClient, listener, clients;
let chatCooldowns = new Set();  // ✅ Prevents spam of `!commands`

// ✅ Set up Twitch API Clients
async function setupTwitchClients() {
    try {
        let chatAccessToken = await getAccessToken('chat');
        let eventSubAccessToken = await getAccessToken('eventsub');

        if (!chatAccessToken || !eventSubAccessToken) throw new Error("❌ Missing access tokens.");

        let chatAuthProvider = new StaticAuthProvider(clientId, chatAccessToken);
        let eventSubAuthProvider = new StaticAuthProvider(clientId, eventSubAccessToken);

        botApiClient = new ApiClient({ authProvider: chatAuthProvider });
        eventSubApiClient = new ApiClient({ authProvider: eventSubAuthProvider });

        let user = await eventSubApiClient.users.getUserByName(channelName);
        if (!user) throw new Error(`❌ Failed to fetch Twitch User ID for ${channelName}`);

        chatClient = new ChatClient({ authProvider: chatAuthProvider, channels: [channelName] });
        chatClient.connect();

        listener = new EventSubWsListener({ apiClient: eventSubApiClient });
        listener.start();

        console.log(`✅ Twitch clients set up. UserID: ${clients.userId}`);

        return { userId: user.id };
    } catch (error) {
        console.error('❌ Error setting up Twitch clients:', error);
        return null;
    }
}

// ✅ Initialize Twitch Services
async function initializeTwitchServices() {
    try {
        await checkTokenExpiration();

        await setupTwitchClients();

        await startTwitchChatListener();  // Ensure it starts after setup

    } catch (error) {
        console.error("❌ Error initializing Twitch services:", error);
    }
}

// ✅ Start Twitch Chat Listener (Prevents Duplicate Start)
async function startTwitchChatListener() {
    try {
        console.log(`🎉 Twitch Chat Listener Starting...`);
        
        chatClient.onMessage(async (channel, user, message) => {
            if (!message.startsWith('!')) return; // Ignore non-command messages

            const command = message.toLowerCase().trim();
            
            // ✅ Prevent spamming (Cooldown: 3s per user)
            if (chatCooldowns.has(user)) return;
            chatCooldowns.add(user);
            setTimeout(() => chatCooldowns.delete(user), 3000);

            switch (command) {
                case '!play':
                    try {
                        const twitchUser = await eventSubApiClient.users.getUserByName(user);
                        if (!twitchUser) {
                            chatClient.say(`#${channelName}`, `@${user}, I couldn't retrieve your Twitch ID. Try again later.`);
                            return;
                        }
                        let resultMessage2 = await addNewPlayer(user, twitchUser.id);
                        chatClient.say(`#${channelName}`, `@${user}, ${resultMessage2}`);
                    } catch (error) {
                        console.error(`❌ Error in !play command:`, error);
                        chatClient.say(`#${channelName}`, `@${user}, an error occurred while adding you.`);
                    }
                    break;

                default:
                    chatClient.say(`#${channelName}`, `@${user}, unknown command. Try !play`);
                    break;
            }
        });

        listener.onChannelRedemptionAdd(clients.userId, async (e) => {
            try {
                const rewardTitle = e.rewardTitle.toLowerCase();
                const userInput = e.input?.trim();

                let resultMessage = 'capturing';  // Use `let` instead of `const`
        
                if (rewardTitle === 'hunt') {
                    resultMessage = await skillAttempt(e.userName, 'hunting_skills', 'Food');
                } else if (rewardTitle === 'search') {
                    resultMessage = await skillAttempt(e.userName, 'searching_skills', 'Item');
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
                    chatClient.say(`#${channelName}`, `@${e.userName}, invalid or missing input for redemption.`);
                    return;
                }
        
                chatClient.say(`#${channelName}`, `@${e.userName}, ${resultMessage}`);
            } catch (error) {
                console.error('❌ Error in redemption handler:', error);
                chatClient.say(`#${channelName}`, `@${e.userName} An error occurred while processing your request.`);
            }
        });

        console.log(`🎉 Twitch Chat Listener Ready!`);
    } catch (error) {
        console.error('❌ Error starting Twitch chat listener:', error);
    }
}

module.exports = { initializeTwitchServices };
