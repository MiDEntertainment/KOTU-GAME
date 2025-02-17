require('dotenv').config();
const { Pool } = require('pg');
const { ApiClient } = require('@twurple/api');

// PostgreSQL Database Connection
const db= new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

//search the db for the player or add new
async function addNewPlayer(username) {
    try {
        // Normalize username to lowercase for consistent checking
        const lowerUsername = username.toLowerCase();

        // Check if the player already exists
        const existingPlayer = await db.query('SELECT player_id FROM player WHERE LOWER(twitch_username) = $1', [lowerUsername]);

        if (existingPlayer.rows.length > 0) {
            return `@${username}, you are already on your journey. Use the channel rewards to play the game and download the Twitch extension to see your stats.`;
        }

        // Fetch Twitch user ID
        const user = await eventSubApiClient.users.getUserByName(username);
        if (!user) {
            return `❌ Error: Unable to fetch Twitch ID for @${username}.`;
        }
        const twitchId = user.id;

        // Insert new player into the player table
        const newPlayer = await db.query(
            `INSERT INTO player (twitch_username, join_date, twitch_id) 
             VALUES ($1, NOW(), $2) RETURNING player_id`,
            [username, twitchId]
        );

        const playerId = newPlayer.rows[0].player_id;

        // Initialize player stats
        await db.query(
            `INSERT INTO player_stats (player_id, health, fighting_skills, life_skills, fishing_skills, hunting_skills, searching_skills, current_location, current_rank, health_cap)
             VALUES ($1, 10, 0, 0, 0, 0, 0, 1, 1, 10)`,
            [playerId]
        );

        // Initialize inventory with XP
        await db.query(
            `INSERT INTO inventory (player_id, item_name, quantity) 
             VALUES ($1, 'XP', 10)`,
            [playerId]
        );

        return `@${username}, Welcome traveler! Use channel rewards to play the game. Start by using the "Talk" button to chat with Inim. Need Help? YouTube`;
    } catch (error) {
        console.error('❌ Error adding new player:', error);
        return `❌ An error occurred while adding you to the game, @${username}. Please try again later.`;
    }
}

//METHOD SKILLATTEMPT AND ITS HELPERS
/**
 * Determines the probability of success based on the player's skill level.
 * @param {number} skillLevel - The player's skill level.
 * @returns {boolean} - True if successful, false if failed.
 */
function skillProbability(skillLevel) {
    const probabilities = [35, 50, 75, 99];
    let threshold;
    
    if (skillLevel <= 25) threshold = probabilities[0];
    else if (skillLevel <= 50) threshold = probabilities[1];
    else if (skillLevel <= 75) threshold = probabilities[2];
    else threshold = probabilities[3];
    
    const roll = Math.random() * 100;
    const success = roll < threshold;
    
    console.log(`🎲 Rolled: ${roll.toFixed(2)} | Threshold: ${threshold}% | Success: ${success}`);
    return success;
}

/**
 * Selects a valid item based on type and location.
 * @param {string} itemType - The type of item (e.g., 'Fish').
 * @param {number} location - The player's current location.
 * @returns {Promise<object|null>} - Selected item or null if none found.
 */
async function itemSelection(itemType, location) {
    const result = await db.query(
        `SELECT * FROM items 
         WHERE item_type = $1 
         AND (item_location = 0 OR item_location = $2) 
         ORDER BY RANDOM() LIMIT 1`, [itemType, location]
    );
    
    const selectedItem = result.rows[0] || null;
    return selectedItem;
}

/**
 * Updates the player's inventory, ensuring the item quantity does not exceed the item's limit.
 * @param {number} playerId - The player's ID.
 * @param {string} itemName - The name of the item.
 * @param {number} [amount=1] - The amount to add or remove (defaults to 1 if not specified).
 */
async function inventoryUpdate(playerId, itemName, amount = 1) {
    try {
        // ✅ Step 1: Get the item limit from the 'items' table
        const itemResult = await db.query(
            `SELECT item_limit FROM items WHERE item_name = $1`,
            [itemName]
        );

        if (itemResult.rows.length === 0) {
            return `❌ Item '${itemName}' not found in the items table.`;
        }

        const itemLimit = itemResult.rows[0].item_limit;

        // ✅ Step 2: Get the current quantity from the 'inventory' table
        const inventoryResult = await db.query(
            `SELECT quantity FROM inventory WHERE player_id = $1 AND item_name = $2`,
            [playerId, itemName]
        );

        let currentQuantity = 0;

        if (inventoryResult.rows.length > 0) {
            currentQuantity = inventoryResult.rows[0].quantity;
        }

        // ✅ Step 3: Check if the new quantity exceeds the item limit
        if (currentQuantity + amount > itemLimit) {
            return `⚠️ Player ${playerId} cannot carry more '${itemName}' (limit: ${itemLimit}).`;
        }

        // ✅ Step 4: Insert new item if not exists or update quantity
        await db.query(
            `INSERT INTO inventory (player_id, item_name, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (player_id, item_name) 
             DO UPDATE SET quantity = inventory.quantity + $3`,
            [playerId, itemName, amount]
        );
    } catch (error) {
        console.error(`❌ Error updating inventory for player ${playerId}:`, error);
    }
}

/**
 * Increases the player's skill level by 1.
 * @param {number} playerId - The player's ID.
 * @param {string} skillType - The skill column to update.
 */
async function updateSkillLevel(playerId, skillType) {
    await db.query(`UPDATE player_stats SET ${skillType} = ${skillType} + 1 WHERE player_id = $1`, [playerId]);
}

/**
 * Attempts a skill-based action (e.g., fishing, hunting, searching).
 * @param {string} username - The player's Twitch username.
 * @param {string} skillType - The skill type being attempted (e.g., 'fishing_skills').
 * @param {string} itemType - The type of item to retrieve (e.g., 'Fish').
 * @returns {Promise<string>} - Success or failure message.
 */
async function skillAttempt(username, skillType, itemType) {
    try {
        const result = await db.query(
            `SELECT ps.${skillType}, ps.current_location, p.player_id 
             FROM player_stats ps 
             JOIN player p ON ps.player_id = p.player_id 
             WHERE p.twitch_username = $1`, [username]
        );

        if (result.rows.length === 0) return `❌ Player not found. To register your player enter !play in chat`;
        
        const { player_id, current_location } = result.rows[0];
        const skillLevel = result.rows[0][skillType];
        
        if (!skillProbability(skillLevel)) {
            return `❌ You failed to catch anything this time.`;
        }
        
        const item = await itemSelection(itemType, current_location);
        if (!item) return `❌ No valid items found.`;
        
        
        await updateSkillLevel(player_id, skillType);
        await inventoryUpdate(player_id, item.item_name);
        
        return await inventoryUpdate(player_id, item.item_name);
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

//EAT AND SELL ITEMS AND ITS HELPERS
// Helper function to get player ID by username
async function getPlayerId(username) {
    try {
        // Normalize username to lowercase for consistent checking
        const lowerUsername = username.toLowerCase();

        const result = await db.query('SELECT player_id FROM player WHERE twitch_username = $1', [lowerUsername]);
        if (result.rows.length === 0) return null;
        return result.rows[0].player_id;
    } catch (error) {
        console.error('❌ Error fetching player ID:', error);
        return null;
    }
}

/**
 * Updates the player's stats with new values.
 * @param {number} playerId - The player's ID.
 * @param {object} updates - An object containing stat keys and new values.
 */
async function updatePlayerStats(playerId, updates) {
    try {
        const updateQueries = Object.entries(updates)
            .map(([key, value], index) => `${key} = $${index + 2}`)
            .join(', ');

        const values = [playerId, ...Object.values(updates)];

        await db.query(`UPDATE player_stats SET ${updateQueries} WHERE player_id = $1`, values);
    } catch (error) {
        console.error(`❌ Error updating player stats for player ${playerId}:`, error);
    }
}

//MAIN METHOD EAT
async function eatItem(username, itemName, amount) {
    try {
        // ✅ Get the player's ID
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Error: Player not found.`;

         // ✅ Fetch the item details from the `items` table
         const itemResult = await db.query(
            `SELECT sell_price FROM items WHERE item_name = $1`,
            [itemName]
        );

        // ✅ If the item does not exist or has a sell price of 0, it's not consumable
        if (itemResult.rows.length === 0 || itemResult.rows[0].sell_price === 0) {
            return `❌ Error: You cannot eat ${itemName}.`;
        }

        // ✅ Fetch the player's inventory for the specific item
        const inventoryResult = await db.query(
            `SELECT quantity FROM inventory WHERE player_id = $1 AND item_name = $2`,
            [playerId, itemName]
        );

        // ✅ Check if the item exists in inventory
        if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < amount) {
            return `❌ Error: Not enough ${itemName} in inventory.`;
        }

        // ✅ Get player's current health and max health
        const statsResult = await db.query(
            `SELECT health, health_cap FROM player_stats WHERE player_id = $1`,
            [playerId]
        );

        if (statsResult.rows.length === 0) {
            return `❌ Error: Player stats not found.`;
        }

        let currentHealth = statsResult.rows[0].health;
        let maxHealth = statsResult.rows[0].health_cap;

        // ✅ Prevent over-healing
        if (currentHealth >= maxHealth) {
            return `❌ Error: You are already at full health!`;
        }

        // ✅ Determine how many items to consume
        let healthRestored = amount * 5; // Assume each item restores 5 health
        let newHealth = Math.min(currentHealth + healthRestored, maxHealth);
        let itemsConsumed = Math.ceil((newHealth - currentHealth) / 5);

        // ✅ Update inventory and player stats
        await inventoryUpdate(playerId, itemName, -itemsConsumed);
        await updatePlayerStats(playerId, { health: newHealth });

        return `✅ You ate ${itemsConsumed} ${itemName} and recovered ${newHealth - currentHealth} health!`;
    } catch (error) {
        console.error(`❌ Error processing eat command:`, error);
        return `❌ Error processing eat command: ${error.message}`;
    }
}

//MAIN METHOD SELL
async function sellItem(username, itemName, amount) {
    try {
        // ✅ Get the player's ID
        const playerId = await getPlayerId(username);
        if (!playerId) return `❌ Error: Player not found.`;

        // ✅ Fetch the item's sell price from the `items` table
        const itemResult = await db.query(
            `SELECT sell_price FROM items WHERE item_name = $1`,
            [itemName]
        );

        if (itemResult.rows.length === 0) {
            return `❌ Error: ${itemName} does not exist your inventory.`;
        }

        const sellPrice = itemResult.rows[0].sell_price;

        // ✅ If `sell_price` is 0, prevent selling
        if (sellPrice === 0) {
            return `❌ Error: You cannot sell ${itemName}.`;
        }

        // ✅ Fetch the player's inventory for the specific item
        const inventoryResult = await db.query(
            `SELECT quantity FROM inventory WHERE player_id = $1 AND item_name = $2`,
            [playerId, itemName]
        );

        // ✅ Check if the player has enough of the item
        if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].quantity < amount) {
            return `❌ Error: Not enough ${itemName} in inventory to sell.`;
        }

        // ✅ Calculate the earnings
        const saleValue = amount * sellPrice;

        // ✅ Update inventory (remove sold items)
        await inventoryUpdate(playerId, itemName, -amount);

        // ✅ Update inventory (add Lumins)
        await inventoryUpdate(playerId, 'Lumins', saleValue);

        return await inventoryUpdate(playerId, 'Lumins', saleValue);
    } catch (error) {
        console.error(`❌ Error processing sell command:`, error);
        return `❌ Error processing sell command: ${error.message}`;
    }
}


module.exports = { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel, addNewPlayer, eatItem, sellItem};