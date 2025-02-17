require('dotenv').config();
const { Pool } = require('pg');
const { ApiClient } = require('@twurple/api');

// PostgreSQL Database Connection
const db= new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
});

//HELPER METHODS

//search the db for the player or add new
async function addNewPlayer(username) {
    try {
        // Check if the player already exists
        const existingPlayer = await db.query('SELECT player_id FROM player WHERE LOWER(twitch_username) = $1', [username]);

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


//Probability of a Succsess
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

// Pull a Valid item from availiable items
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

//Update user Inventory deafult is +1
async function inventoryUpdate(playerId, itemName, amount) {
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


//Get player ID by username
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

//Increase player skills by 1
async function updateSkillLevel(playerId, skillType) {
    await db.query(`UPDATE player_stats SET ${skillType} = ${skillType} + 1 WHERE player_id = $1`, [playerId]);
}

//Upadate player stats
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

//MAIN METHOD SKILLATTEMP
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
        
        return await inventoryUpdate(player_id, item.item_name, 1);
    } catch (error) {
        console.error('❌ Error in skillAttempt:', error);
        return `❌ An error occurred.`;
    }
}

//MAIN METHOD EAT
//double check this tomorrow
async function eatItem(username, itemName) {
    try {
        // ✅ Check for player
        const result = await db.query(
            `SELECT iv.player_id 
             FROM inventory iv 
             JOIN player p ON iv.player_id = p.player_id 
             WHERE p.twitch_username = $1`, [username]
        );

        if (result.rows.length === 0) return `❌ Player not found. To register your player enter !play in chat`;

        // ✅ Get player's current health and max health
        const statsResult = await db.query(
            `SELECT health, health_cap FROM player_stats WHERE player_id = $1`,
            [playerId]
        );

        let currentHealth = statsResult.rows[0].health;
        let maxHealth = statsResult.rows[0].health_cap;

        // ✅ Prevent over-healing
        if (currentHealth >= maxHealth) {
            return `❌ Error: You are already at full health!`;
        }
                
        // ✅ Fetch the item details from the `items` table
         const itemResult = await db.query(
            `SELECT sell_price FROM items WHERE item_name = $1`,
            [itemName]
        );

        // ✅ If the item does not exist or has a sell price of 0, it's not consumable
        if (itemResult.rows.length === 0 || itemResult.rows[0].sell_price === 0) {
            return `❌ Error: You cannot eat ${itemName}.`;
        }

        // ✅ Determine how many items to consume
        let newHealth = Math.min(currentHealth + 5, maxHealth);

        const playerId = getPlayerId(username) 

        // ✅ Update inventory and player stats
        await inventoryUpdate(playerId, itemName, -1);
        await updatePlayerStats(playerId, { health: newHealth });

        return `✅ You ate ${itemsConsumed} ${itemName} and now have ${newHealth} health!`;
    } catch (error) {
        console.error(`❌ Error processing eat command:`, error);
        return `❌ Error processing eat command: ${error.message}`;
    }
}

//MAIN METHOD SELL
//double check this tomorrow
async function sellItem(username, itemName) {
    try {
        // ✅ Check for player
        const result = await db.query(
            `SELECT iv.player_id 
             FROM inventory iv 
             JOIN player p ON iv.player_id = p.player_id 
             WHERE p.twitch_username = $1`, [username]
        );

        if (result.rows.length === 0) return `❌ Player not found. To register your player enter !play in chat`;

        // ✅ Fetch the item's sell price from the `items` table
        const sellPrice = await db.query(
            `SELECT sell_price FROM items WHERE item_name = $1`,
            [itemName]
        );

        if (sellPrice.rows.length === 0) {
            return `❌ Error: ${itemName} does not exist your inventory.`;
        }

        // ✅ If `sell_price` is 0, prevent selling
        if (sellPrice === 0) {
            return `❌ Error: You cannot sell ${itemName}.`;
        }

        const playerId = await getPlayerId(username);

        // ✅ Update inventory (remove sold items)
        await inventoryUpdate(playerId, itemName, -1);

        // ✅ Update inventory (add Lumins)
         return await inventoryUpdate(playerId, 'Lumins', sellPrice);
    } catch (error) {
        console.error(`❌ Error processing sell command:`, error);
        return `❌ Error processing sell command: ${error.message}`;
    }
}


module.exports = { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel, addNewPlayer, eatItem, sellItem};