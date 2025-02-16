require('dotenv').config();
const { Pool } = require('pg');

// PostgreSQL Database Connection
const db= new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

//METHOD ADDNEWPLAYER
async function addNewPlayer(username) {
    try {
        // Check if the player already exists
        const existingPlayer = await db.query('SELECT player_id FROM player WHERE twitch_username = $1', [username]);
        
        if (existingPlayer.rows.length > 0) {
            return `@${username}, you are already on your journey. Use the channel rewards to play the game and download the Twitch extension to see your stats.`;
        }

        // Insert new player into the player table
        const newPlayer = await db.query(
            'INSERT INTO player (twitch_username) VALUES ($1) RETURNING player_id',
            [username]
        );
        
        const playerId = newPlayer.rows[0].player_id;

        // Initialize player stats
        await db.query(
            `INSERT INTO player_stats (player_id) VALUES ($1)`,
            [playerId]
        );

        return `@${username}, welcome to your new adventure! Use the channel rewards to play the game and download the Twitch extension to see your stats.`;
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
 */
async function inventoryUpdate(playerId, itemName) {
    try {
        // Get the item's limit and current quantity in player's inventory
        const result = await db.query(
            `SELECT 
                i.item_limit, 
                COALESCE(inv.quantity, 0) AS current_quantity
             FROM items i
             LEFT JOIN inventory inv ON i.item_name = inv.item_name AND inv.player_id = $1
             WHERE i.item_name = $2`,
            [playerId, itemName]
        );

        if (result.rows.length === 0) {
            console.error(`❌ Item '${itemName}' not found in the items table.`);
            return;
        }

        const { item_limit, current_quantity } = result.rows[0];

        // Ensure adding another item doesn't exceed the item_limit
        if (current_quantity >= item_limit) {
            console.log(`⚠️ Player ${playerId} cannot carry more '${itemName}' (limit: ${item_limit}).`);
            return;
        }

        // Update inventory with new quantity
        await db.query(
            `UPDATE inventory 
             SET quantity = quantity + 1 
             WHERE player_id = $1 AND item_name = $2`,
            [playerId, itemName]
        );

        console.log(`✅ Added ${itemName} to player ${playerId}'s inventory.`);
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
        
        await inventoryUpdate(player_id, item.item_name);
        await updateSkillLevel(player_id, skillType);
        
        return `✅ Success! You obtained a ${item.item_name}.`;
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

module.exports = { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel, addNewPlayer};