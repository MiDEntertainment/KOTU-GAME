const { skillAttempt, skillProbability, itemSelection, inventoryUpdate, updateSkillLevel } = require('../server/utils/gameMechanics');

//FISHING TEST / SKILL ATTEMPT / GAME MECHANICS
(async () => {
    try {
        // Test skillAttempt function
        console.log("🎯 Running tests for skillAttempt>> gameMechanics.js\n");
        console.log(await skillAttempt('quietgamergirl', 'fishing_skills', 'Fish'));
    } catch (error) {
        console.error("❌ Error during testing:", error);
    }
})();
