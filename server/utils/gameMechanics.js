const { getPlayerId, updatePlayerStats, getItemDetails } = require('./dbHelper');
const {updateInventory } = require('./inventoryManager');

// ✅ Probability Calculation
function skillProbability(skillLevel) {
    const thresholds = [35, 50, 75, 99];
    let threshold = skillLevel <= 25 ? thresholds[0] :
                   skillLevel <= 50 ? thresholds[1] :
                   skillLevel <= 75 ? thresholds[2] :
                   thresholds[3];

    return Math.random() * 100 < threshold;
}

// ✅ Attempt a skill-based action
async function skillAttempt(username, skillType, itemType) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Player not found. Use !play to register.`;

        if (!skillProbability(stats[skillType])) return `❌ You failed to capture anything this time.`;

        const item = await getItemDetails(itemType);
        if (!item) return `❌ No valid item found.`;

        await updateInventory(playerId, item.item_name, 1);
        await updatePlayerStats(playerId, { [skillType]: stats[skillType] + 1 });

        return `✅ You successfully obtained ${item.item_name}!`;
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

// ✅ Eat an item
async function eatItem(username, itemName) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Player not found. Use !play to register.`;

        const item = await getItemDetails(itemName);
        if (!item || item.sell_price === 0) return `❌ You cannot eat ${itemName}.`;

        if (stats.health >= stats.health_cap) return `❌ You are already at full health.`;

        await updateInventory(playerId, itemName, -1);
        const newHealth = Math.min(stats.health + 5, stats.health_cap);
        await updatePlayerStats(playerId, { health: newHealth });

        return `✅ You ate ${itemName} and now have ${newHealth} health!`;
    } catch (error) {
        console.error(`❌ Error processing eat command:`, error);
        return `❌ Error processing eat command: ${error.message}`;
    }
}

// ✅ Sell an item
async function sellItem(username, itemName) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Player not found. Use !play to register.`;

        const item = await getItemDetails(itemName);
        if (!item || item.sell_price === 0) return `❌ You cannot sell ${itemName}.`;

        await updateInventory(playerId, itemName, -1);
        await updateInventory(playerId, 'Lumins', item.sell_price);

        return `✅ You sold ${itemName} for ${item.sell_price} Lumins!`;
    } catch (error) {
        console.error(`❌ Error processing sell command:`, error);
        return `❌ Error processing sell command: ${error.message}`;
    }
}


module.exports = { skillAttempt, eatItem, sellItem };