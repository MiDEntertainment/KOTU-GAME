const { getPlayerId, getPlayerStats, updatePlayerStats, getItemDetailsByName, getItemDetailsByType, winChance, getItemDetailsByID, getLocationDetailsByID, hasCollectedAllItems } = require('./dbHelper');
const { updateInventory, getInventory } = require('./inventoryManager');

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

        if (!skillProbability(stats[skillType])) return `❌ You failed to find anything this time.`;

        // ✅ Fetch an item by type & location
        const item = await getItemDetailsByType(playerId, itemType);
        if (!item) return `❌ No valid item found for ${itemType}.`;
    
        await updatePlayerStats(playerId, { [skillType]: stats[skillType] + 1 });

        // ✅ Check if skillType is 'search' and item is 'enemy'
        if (skillType === "searching_skills" && item.sub_type === "enemy") {
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
        if(!item) return `❌ You cannot eat ${itemName}`;
        
        await updateInventory(playerId, itemName, -1);

        // what to do with that item
        if (item.sub_type==='food' && stats.health >= stats.health_cap) {
            return `❌ You are already at full health.`;
        } else if (item.sub_type=='food') {
            const newHealth = Math.min(stats.health + item.sell_price, stats.health_cap);
            await updatePlayerStats(playerId, { health: newHealth });
            return `✅ You ate ${itemName} and now have ${newHealth} health!`;
        } else if (item.item_name ==='health oil') {
            const newHealthMax= stats.health_cap + 1;
            await updatePlayerStats(playerId, { health_cap: newHealthMax});
            return `✅ You used ${itemName} and now have ${newHealthMax} heath max!`;
        } else if (item.item_name ==='weapon oil'){
            const newWeapon= stats.weapon_level + 1;
            await updatePlayerStats(playerId, { weapon_level: newWeapon});
            return `✅ You used ${itemName} and now have ${newWeapon} weapon level!`;
        } else {
            return `❌ You cannot eat ${itemName}.`;
        }

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

// ✅ Buy an item
async function buyItem(username, itemName) {
    try {
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ You need to register first. Use !play to join the game.`;

        const item = await getItemDetailsByName(itemName);
        if (!item || item.item_Type === 'Buy') return `❌ You cannot buy ${itemName}.`;

        //check if there is enough money
        const buyPrice = await getInventory(playerId, 'lumins');
        if ( buyPrice < item.sell_price) return `❌ You do not have enough lumins to buy this item.`;

        //remove lumins from inventory
        await updateInventory(playerId, 'lumins', -item.sell_price);
        //add product to inventory
        await updateInventory(playerId, itemName, 1);

        //add item to inventory
        const sellResponse = `✅ when your ready use the EAT reward to consume your new item: ${itemName}`;

        return sellResponse;
    } catch (error) {
        console.error(`❌ Error processing buy command:`, error);
        return `❌ Error processing buy command: ${error.message}`;
    }
}

// ✅ Travel
async function travelItem(username, locationNumber) {
    try {
        console.log('Basic Checks');
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ You need to register first. Use !play to join the game.`;

        //Validate the input
        if (isNaN(locationNumber) || locationNumber < 1 || locationNumber > 13) {
            return `❌ Invalid location. Please enter a number between 1 and 13.`;
        }
        
        const stats = await getPlayerStats(playerId);
        if (!stats) return `❌ Player stats not found.`;

        const location = await getLocationDetailsByID(locationNumber);
        if (!location) return `❌ Invalid location.`;

        const highest = stats.highest_location;
        const current = stats.current_location;

        // Case 1: If the new location is <= highest_location, allow travel without restrictions
        if (locationNumber <= highest) {
            console.log('New Location is less than highest location of', highest);
            await updatePlayerStats(playerId, { current_location: locationNumber });
            return `✅ You have traveled to [ ${location.location_id} ] ${location.location_name}.`;
        }
        

        // Case 2: If the new location is greater than highest_location by 2 or more, block travel
        if (locationNumber > highest + 1) {
            return `❌ You must unlock locations in order.`;
        }

        // Case 3: If traveling to the next location (current_location +1), enforce item collection and XP checks
        if (locationNumber === current + 1) {
            const collectedAll = await hasCollectedAllItems(playerId, current);
            if (!collectedAll) return `❌ You haven't found all items in this location yet. Keep searching!`;

            if (stats.xp_level < location.xp_threshold) {
                return `❌ You need at least ${location.xp_threshold} XP to travel here.`;
            }
        }

        // ✅ Travel successful - Update location and possibly update highest_location
        await updatePlayerStats(playerId, { current_location: locationNumber });

        if (locationNumber > stats.highest_location) {
            await updatePlayerStats(playerId, { highest_location: locationNumber });
        }

        // ✅ Placeholder for boss fight trigger
        return `✅ You have traveled to [ ${location.location_id} ] ${location.location_name}. ⚔️ A boss battle awaits... (Feature coming soon!)`;

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
            const newXP = (stats.xp_level + enemyDifficulty);
            await updatePlayerStats(playerId, { xp_level: newXP });
            return `ENEMY ATTACK .... ENEMY ATTACK .... ✅ You defeated the ${enemy.item_name} and earned ${enemyDifficulty} XP!`;
        } else {
            // Defeat: Lose 1 health
            const newHealth = stats.health - 1;
            if (newHealth <= 0) {
                // Player dies: Lose all lumins
                await updatePlayerStats(playerId, { health: 10 });
                await updateInventory(playerId, 'lumins', -500); // Remove 500 lumins
                return `ENEMY ATTACK .... ENEMY ATTACK .... 💀 You died from the ${enemy.item_name} lost 500 lumins! Check on your health.`;
            } else {
                // Player survives but takes damage
                await updatePlayerStats(playerId, { health: newHealth });
                return `ENEMY ATTACK .... ENEMY ATTACK .... ⚠️ You failed to defeat the ${enemy.item_name} and lost 1 health! Consider buying oils to upgrading your weapon`;
            }
        }
    } catch (error) {
        console.error('❌ Error processing fight:', error);
        return `❌ An error occurred during combat.`;
    }
}

module.exports = { skillAttempt, eatItem, sellItem, buyItem, travelItem, fightEnemy, skillProbability};