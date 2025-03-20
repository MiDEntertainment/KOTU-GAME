const { getPlayerId, getPlayerStats, updatePlayerStats, getItemDetailsByName, getItemDetailsByType, addNewPlayer, winChance, getItemDetailsByID } = require('../server/utils/dbHelper');
const { skillProbability, skillAttempt, eatItem, sellItem, buyItem, travelItem, fightEnemy } = require('../server/utils/gameMechanics');
const { getInventory, getItemLimit, updateInventory} = require('../server/utils/inventoryManager');

/*
WORKING LOG
1. Got 'Em = ❌NOT WORKING
2. Play = ✅NOT WORKING
3. Eat = ✅ WOKRING
4. Hunt = ✅ WORKING
5. Talk = ❌NOT WORKING
6. Search = ✅ WORKING
7. Buy = ✅ WORKING
8. Sell = ✅ WORKING
9. Travel = 🎯 WORKING
10. Garden = ❌NOT WORKING
11. Open Chest = ❌NOT WORKING
12. Play Cards = ❌NOT WORKING


*/

// INVENTORY TESTS
// (async () => {

//     console.log('🎯 1. Testing successful getInventory(playerId, itemName)');
//     console.log(await getInventory('1', 'fish') ); // Expected: all current inventory_id of the item

//     console.log('--  2. Test missing item error message)');
//     console.log(await getInventory('1', 'NonExistentItem') ); // Expected: 0

//     console.log('🎯 3. Testing successful getItemLimit(itemName)');
//     console.log(await getItemLimit('fish') ); // Expected: get limit of 100

//     console.log('--  4. Test item limit error message');
//     console.log(await getItemLimit('tacos') ); // Expected: error message

//     console.log('🎯 5. Test successful updateInventory(playerId, itemName, amount)');
//     console.log(await updateInventory('1', 'fish', '1' ) ); // Expected: and +1 fish to inventory

//     console.log('-- 6. Test update inventory error message');
//     console.log(await updateInventory('1', 'fish', '1000' ) ); // Expected: error message
// })();

// GAME MECHANIC TESTS
// (async () => {
//     try {
//         console.log("🎯 7. Testing skillProbability");
//         console.log("Skill Level 10: ", skillProbability(0)); // Should return true ~35% of the time
//         console.log("Skill Level 80: ", skillProbability(100)); // Should return true ~99% of the time

//         console.log("🎯 8. Testing skillAttempt");
//         console.log(await skillAttempt('quietgamergirl', 'searching_skills', 'Item')); //Either recieve an item or an enemy

//         console.log("🎯 9. Testing skillAttempt");
//         console.log(await skillAttempt('quietgamergirl', 'hunting_skills', 'Food')); //Either recieve a fish, rabbit, or nothing
 
//         console.log('🎯 10. Test successful eatItem(username, itemName)');
//         console.log(await eatItem('quietgamergirl', 'fish')); // Expected: Gains health, updates inventory

//         console.log('-- 11. Test eating item not in inventory');
//         console.log(await eatItem('quietgamergirl', 'NonExistentItem')); // Expected: Error message

//         console.log('-- 12. Test eating item with sell price = 0');
//         console.log(await eatItem('quietgamergirl', 'Lumins')); // Expected: Cannot eat this item

//         console.log('🎯 13. Test successful sellItem(username, itemName)');
//         console.log(await sellItem('quietgamergirl', 'rabbit')); // Expected: Gains Lumins, updates inventory

//         console.log('-- 14. Test selling item not in inventory');
//         console.log(await sellItem('quietgamergirl', 'Apple')); // Expected: Error message

//         console.log('🎯 15. Test successful buyItem(username, itemName)');
//         console.log(await buyItem('quietgamergirl', 'weapon oil')); // Expected: updates inventory

//         console.log(' 19. Test successful eatItem(username, itemName)');
//         console.log(await eatItem('quietgamergirl', 'weapon oil')); // Expected: Gains weapon level, updates stats

//         console.log('-- 20. Test buying item you do not have enough money for');
//         console.log(await buyItem('quietgamergirl', 'health oil')); // Expected: Error message

//         console.log('-- 21. Test buying item not in items');
//         console.log(await buyItem('quietgamergirl', 'Apple')); // Expected: Error message

//         console.log('-- 22. Test buying item with sell price = 0');
//         console.log(await buyItem('quietgamergirl', 'XP')); // Expected: Cannot sell this item

//     } catch (error) {
//         console.error("❌ Error during testing:", error);
//     }
// })();


// FIGHT TESTS
// (async () => {

//     console.log('🎯 23. Test successful fighting');
//     console.log(await fightEnemy('quietgamergirl', 11) ); // Expected: minus health, updates inventory with XP

//     console.log('🎯 24. Test successful fighting');
//     console.log(await fightEnemy('quietgamergirl', 53) ); // Expected: minus health, updates inventory with XP

//     console.log('🎯 25. Test successful fighting');
//     console.log(await fightEnemy('quietgamergirl', 31) ); // Expected: minus health, updates inventory with XP
// })();

//TRAVEL TESTS
(async () => {
        // console.log('🎯 16. Test successful travelItem(username, locationNumber)');
        // console.log(await travelItem('quietgamergirl', 1)); //Stats updated

        // console.log('25. Test successful travelItem(username, locationNumber)');
        // console.log(await travelItem('quietgamergirl', 2)); //Stats updated, items checked, boss fight ensues.

        // console.log('--27. Test successful travelItem(username, locationNumber)');
        // console.log(await travelItem('quietgamergirl', 3)); //Cannot move to 3

        // console.log('-- 26. Test going to a place your havent unlocked travelItem(username, locationNumber)');
        // console.log(await travelItem('quietgamergirl', 13)); //Stats updated, items checked, boss fight ensues.

        // console.log('-- 17. Test travel to place that doesnt exist');
        // console.log(await travelItem('quietgamergirl', 500)); // Expected: Error message
})();