const { getPlayerId, getPlayerStats, updatePlayerStats, getItemDetailsByName, getItemDetailsByType, addNewPlayer, winChance, getItemDetailsByID } = require('../server/utils/dbHelper');
const { skillProbability, skillAttempt, eatItem, sellItem, travelItem, fightEnemy } = require('../server/utils/gameMechanics');
const { getInventory, getItemLimit, updateInventory} = require('../server/utils/inventoryManager');

// INVENTORY TESTS
// (async () => {

//     console.log('🎯 Testing successful getInventory(playerId, itemName)');
//     console.log(await getInventory('1', 'fish') ); // Expected: all current inventory_id of the item

//     console.log('--  Test missing item error message)');
//     console.log(await getInventory('1', 'NonExistentItem') ); // Expected: 0

//     console.log('🎯 Testing successful getItemLimit(itemName)');
//     console.log(await getItemLimit('fish') ); // Expected: get limit of 100

//     console.log('--   Test item limit error message');
//     console.log(await getItemLimit('tacos') ); // Expected: error message

//     console.log('🎯 Test successful updateInventory(playerId, itemName, amount)');
//     console.log(await updateInventory('1', 'fish', '1' ) ); // Expected: and +1 fish to inventory

//     console.log('-- Test update inventory error message');
//     console.log(await updateInventory('1', 'fish', '1000' ) ); // Expected: error message
// })();

// GAME MECHANIC TESTS
// (async () => {
//     try {
//         console.log("🎯 Testing skillProbability");
//         console.log("Skill Level 10: ", skillProbability(0)); // Should return true ~35% of the time
//         console.log("Skill Level 35: ", skillProbability(40)); // Should return true ~50% of the time
//         console.log("Skill Level 40: ", skillProbability(60)); // Should return true ~75% of the time
//         console.log("Skill Level 80: ", skillProbability(75)); // Should return true ~75% of the time
//         console.log("Skill Level 80: ", skillProbability(100)); // Should return true ~99% of the time

//         console.log("🎯 Testing skillAttempt");
//         console.log(await skillAttempt('quietgamergirl', 'searching_skills', 'iQuest')); //Either recieve an item or an enemy

//         console.log("🎯 Testing skillAttempt");
//         console.log(await skillAttempt('quietgamergirl', 'hunting_skills', 'Animal')); //Either recieve a fish, rabbit, or nothing
 
//         console.log('🎯 1. Test successful eatItem(username, itemName)');
//         console.log(await eatItem('quietgamergirl', 'fish')); // Expected: Gains health, updates inventory

//         console.log('--  2. Test eating item not in inventory');
//         console.log(await eatItem('quietgamergirl', 'NonExistentItem')); // Expected: Error message

//         console.log('--  4. Test eating item with sell price = 0');
//         console.log(await eatItem('quietgamergirl', 'Lumins')); // Expected: Cannot eat this item

//         console.log('🎯 5. Test successful sellItem(username, itemName)');
//         console.log(await sellItem('quietgamergirl', 'rabbit')); // Expected: Gains Lumins, updates inventory

//         console.log('--  7. Test selling item not in inventory');
//         console.log(await sellItem('quietgamergirl', 'Apple')); // Expected: Error message

//         console.log('--  9. Test selling item with sell price = 0');
//         console.log(await sellItem('quietgamergirl', 'XP')); // Expected: Cannot sell this item

//         console.log('🎯 5. Test successful travelItem(username, locationNumber)');
//         console.log(await travelItem('quietgamergirl', '1')); //Stats updated

//         console.log('--  7. Test travel to place that doesnt exist');
//         console.log(await travelItem('quietgamergirl', '500')); // Expected: Error message

//     } catch (error) {
//         console.error("❌ Error during testing:", error);
//     }
// })();


// FIGHT TESTS

// (async () => {

//     console.log('🎯 1. Test successful fighting');
//     console.log(await fightEnemy('quietgamergirl', '11') ); // Expected: minus health, updates inventory with XP

//      console.log('🎯 1. Test successful fighting');
//      console.log(await fightEnemy('quietgamergirl', '12') ); // Expected: minus health, updates inventory with XP

//      console.log('🎯 1. Test successful fighting');
//      console.log(await fightEnemy('quietgamergirl', '13') ); // Expected: minus health, updates inventory with XP
// })();