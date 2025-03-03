const { getPlayerId, getPlayerStats, updatePlayerStats, getItemDetailsByName, getItemDetailsByType, winChance, getItemDetailsByID } = require('./dbHelper');
const { updateInventory } = require('./inventoryManager');

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

        const stats = await getPlayerStats(playerId);
        if (!stats) return `❌ Player stats not found.`;

        if (!skillProbability(stats[skillType])) return `❌ You failed to capture anything this time.`;

        // ✅ Fetch an item by type & location
        const item = await getItemDetailsByType(playerId, itemType);
        if (!item) return `❌ No valid item found for ${itemType}.`;
    
        await updatePlayerStats(playerId, { [skillType]: stats[skillType] + 1 });

        // ✅ Check if skillType is 'search' and item is 'enemy'
        if (skillType === "searching_skills" && item.item_name === "enemy") {
            return fightEnemy(username, item.item_id);
        }
        const inventoryResponse = await updateInventory(playerId, item.item_name, 1);
        return inventoryResponse;
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

// ✅ Eat an item
async function eatItem(username, itemName) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ You need to register first. Use !play to join the game.`;

        const stats = await getPlayerStats(playerId);
        if (!stats) return `❌ Player stats not found.`;

        // ✅ Fetch an item by exact name
        const item = await getItemDetailsByName(itemName);
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
        if (!playerId) return `❌ You need to register first. Use !play to join the game.`;

        const item = await getItemDetailsByName(itemName);
        if (!item || item.sell_price === 0) return `❌ You cannot sell ${itemName}.`;

        await updateInventory(playerId, itemName, -1);
        const sellResponse = await updateInventory(playerId, 'lumins', item.sell_price);

        return sellResponse;
    } catch (error) {
        console.error(`❌ Error processing sell command:`, error);
        return `❌ Error processing sell command: ${error.message}`;
    }
}

// ✅ Travel
async function travelItem(username, locationNumber) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ You need to register first. Use !play to join the game.`;

        const stats = await getPlayerStats(playerId);
        if (!stats) return `❌ Player stats not found.`;

        //Validate the input
        if (isNaN(locationNumber) || locationNumber < 1 || locationNumber > 13) {
            return `❌ Invalid location. Please enter a number between 1 and 13.`;
        }

        // Update the player's current location
        await updatePlayerStats(playerId, { current_location: locationNumber })

        return `✅ You have traveled to location ${locationNumber}!`;
    } catch (error) {
        console.error(`❌ Error processing travel command for ${username}:`, error);
        return `❌ Error processing travel command: ${error.message}`;
    }
}

// ✅ Fight
async function fightEnemy(username, enemyID) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Player not found. Use !play to register.`;

        // Fetch player stats
        const stats = await getPlayerStats(playerId);
        if (!stats) return `❌ Player stats not found.`;

        // Fetch enemy details
        const enemy = await getItemDetailsByID(enemyID);
        if (!enemy) return `❌ Enemy '${enemyID}' not found.`;

        const fightLevel = stats.weapon_level;
        const enemyDifficulty = enemy.item_limit; // Using item_limit to represent difficulty

        // Calculate win probability
        const winProbability = winChance(fightLevel, enemyDifficulty);
        const roll = Math.random() * 100;

        if (roll < winProbability) {
            // Victory: Award XP equal to enemy difficulty
            await updateInventory(playerId, 'xp', enemyDifficulty);
            return `ENEMY ATTACK .... ENEMY ATTACK .... ✅ You defeated the enemy and earned ${enemyDifficulty} XP!`;
        } else {
            // Defeat: Lose 1 health
            const newHealth = stats.health - 1;
            if (newHealth <= 0) {
                // Player dies: Lose all lumins
                await updatePlayerStats(playerId, { health: 10 });
                await updateInventory(playerId, 'lumins', -500); // Remove 500 lumins
                return `ENEMY ATTACK .... ENEMY ATTACK .... 💀 You died lost 500 lumins! Check on your health.`;
            } else {
                // Player survives but takes damage
                await updatePlayerStats(playerId, { health: newHealth });
                return `ENEMY ATTACK .... ENEMY ATTACK .... ⚠️ You failed to defeat the enemy and lost 1 health! Consider upgrading your weapon at the tavern.`;
            }
        }
    } catch (error) {
        console.error('❌ Error processing fight:', error);
        return `❌ An error occurred during combat.`;
    }
}

module.exports = { skillAttempt, eatItem, sellItem, travelItem, fightEnemy, skillProbability};