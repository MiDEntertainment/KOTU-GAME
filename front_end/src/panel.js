document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ panel.js Loaded"); // 🔍 Debug log to check if script runs

    let twitch = window.Twitch.ext;
    const DEFAULT_TEST_PLAYER = "quietgamergirl"; // ✅ Hardcoded test player CHANGE TO LOGGED IN PLAYER

    function fetchPlayerUsername(twitchUserId) {
        console.log(`🔍 Fetching player username for Twitch ID: ${twitchUserId}`);

        fetch(`https://localhost:8080/api/player/${twitchUserId}`)
            .then(response => {
                console.log("🛠 Player API Response:", response);
                if (!response.ok) {
                    throw new Error('Player not found');
                }
                return response.json();
            })
            .then(playerData => {
                console.log("✅ Player Data:", playerData);
                document.getElementById("player-username").textContent = playerData.twitch_username;
                fetchPlayerStats(playerData.twitch_username);
            })
            .catch(error => {
                console.error("❌ Error fetching player:", error);
                document.getElementById("player-username").textContent = "Player Not Found";
            });
    }

    function fetchPlayerStats(username) {
        console.log(`🔍 Fetching stats for player: ${username}`);

        fetch(`https://localhost:8080/api/player/${username}/stats`)
            .then(response => {
                console.log("🛠 Stats API Response:", response);
                if (!response.ok) {
                    throw new Error('Stats not found');
                }
                return response.json();
            })
            .then(stats => {
                console.log("✅ Stats Data:", stats);
                document.getElementById("health").textContent = stats.health ?? "N/A";
                document.getElementById("energy").textContent = stats.energy ?? "N/A";
                document.getElementById("fighting_skills").textContent = stats.fighting_skills ?? "N/A";
                document.getElementById("life_skills").textContent = stats.life_skills ?? "N/A";
                document.getElementById("fishing_skills").textContent = stats.fishing_skills ?? "N/A";
                document.getElementById("hunting_skills").textContent = stats.hunting_skills ?? "N/A";
                document.getElementById("searching_skills").textContent = stats.searching_skills ?? "N/A";
                document.getElementById("capacity").textContent = stats.capacity ?? "N/A";
                document.getElementById("current_objective").textContent = stats.current_objective ?? "N/A";
                document.getElementById("current_rank").textContent = stats.current_rank ?? "N/A";
            })
            .catch(error => {
                console.error("❌ Error fetching player stats:", error);
            });
    }

    // ✅ Force the script to run immediately
    console.log("🔄 Running Panel.js Script...");
    fetchPlayerUsername(DEFAULT_TEST_PLAYER);
});
