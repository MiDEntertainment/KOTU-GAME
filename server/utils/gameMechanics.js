const { getPlayerId, getPlayerStats, updatePlayerStats, getItemDetailsByName, getItemDetailsByType } = require('./dbHelper');
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

// ✅ Probability Calculation
function fightProbability(fightLevel) {
    const fthresholds = [50, 55, 60, 65, 70, 75, 80, 85, 90, 99];
    let fthreshold = fightLevel <= 10 ? fthresholds[0] :
                   fightLevel <= 20 ? fthresholds[1] :
                   fightLevel <= 30 ? fthresholds[2] :
                   fightLevel <= 40 ? fthresholds[3] :
                   fightLevel <= 50 ? fthresholds[4] :
                   fightLevel <= 60 ? fthresholds[5] :
                   fightLevel <= 70 ? fthresholds[6] :
                   fightLevel <= 80 ? fthresholds[7] :
                   fightLevel <= 90 ? fthresholds[8] :
                   fthresholds[9];

    return Math.random() * 100 < fthreshold;
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
    
        console.log('updating player stats');
        await updatePlayerStats(playerId, { [skillType]: stats[skillType] + 1 });

        // ✅ Check if skillType is 'search' and item is 'enemy'
        console.log('Check if skillType is search and item is enemy');
        if (skillType === "searching_skills" && item.item_name === "enemy") {
            console.log('fighting the enemy');
            return fightEnemy(username, item.item_name);
        }

        console.log('updating inventory');
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
        return `❌ rror processing travel command: ${error.message}`;
    }
}

// ✅ Fight
async function fightEnemy(username, enemyName) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Player not found.`;

        // Fetch player stats
        const stats = await getPlayerStats(playerId);
        if (!stats) return `❌ Player stats not found.`;
        
        // Fetch enemy details from items table
        const enemy = await getItemDetailsByName(enemyName);
        if (!enemy) return `❌ Enemy '${enemyName}' not found.`;
        
        const weaponLevel = stats.weapon_level;
        const enemyDifficulty = enemy.item_limit; // Difficulty is stored as item_limit
        
        // Determine fight outcome
        if (fightProbability(weaponLevel)) {
            // Victory: Award XP equal to difficulty level
            await updateInventory(playerId, 'xp', enemyDifficulty);
            return `✅ You defeated ${enemyName} and earned ${enemyDifficulty} XP!`;
        } else {
            // Defeat: Lose 1 health
            const newHealth = stats.health - 1;
            if (newHealth <= 0) {
                // Player dies: Lose all lumins
                await updatePlayerStats(playerId, { health: 0 });
                await updateInventory(playerId, 'lumins', -99999); // Remove all lumins
                return `💀 You were defeated by ${enemyName} and lost all your lumins! Visit the healer to recover.`;
            } else {
                // Player survives but takes damage
                await updatePlayerStats(playerId, { health: newHealth });
                return `⚠️ You failed to defeat ${enemyName} and lost 1 health! Consider upgrading your weapon at the tavern.`;
            }
        }
    } catch (error) {
        console.error('❌ Error processing fight:', error);
        return `❌ An error occurred.`;
    }
}
module.exports = { skillAttempt, eatItem, sellItem, travelItem, fightEnemy};