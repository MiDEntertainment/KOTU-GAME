require('dotenv').config();

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;
const twitchOAuthUrl = "https://id.twitch.tv/oauth2/token";

const { Pool } = require('pg');

const pool2 = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});


// ✅ Fetch access token from the database
async function getAccessToken(tokenType) {
    try {
        const result = await pool2.query("SELECT access_token FROM tokens WHERE token_type = $1", [tokenType]);
        return result.rows.length ? result.rows[0].access_token : null;
    } catch (error) {
        console.error(`❌ Error retrieving ${tokenType} access token:`, error);
        return null;
    }
}

// ✅ Save refreshed token to the database
async function saveTokenData(tokenType, newTokenData) {
    try {
        await pool2.query(`
            INSERT INTO tokens (token_type, access_token, expires_at)
            VALUES ($1, $2, NOW() + INTERVAL '4 hours') 
            ON CONFLICT (token_type) DO UPDATE 
            SET access_token = EXCLUDED.access_token,
                expires_at = NOW() + INTERVAL '4 hours'`,
            [tokenType, newTokenData.accessToken]
        );

        console.log(`✅ ${tokenType} token refreshed and stored in DB!`);
    } catch (error) {
        console.error(`❌ Error saving ${tokenType} token to DB:`, error);
    }
}

//Access Token
async function refreshAccessToken() {
    try {
        console.log(`🔄 Refreshing access token...`);

        const bodyParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: process.env.TWITCH_REFRESH_TOKEN,
            redirect_uri: "https://localhost:8080"
        });

        const response = await fetch(twitchOAuthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: bodyParams
        });

        if (!response.ok) {
            throw new Error(`❌ Failed to refresh Access token: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error(`❌ Missing access token in response for Access`);
        }

        await saveTokenData('chat', { accessToken: data.access_token });

        console.log(`✅ Successfully refreshed Access token!`);
    } catch (error) {
        console.error(`❌ Error refreshing Access token:`, error);
    }
}

async function refreshEventSubToken() {
    try {
        console.log(`🔄 Refreshing event sub token...`);

        const bodyParams = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: process.env.TWITCH_EVENTSUB_REFRESH_TOKEN,
            redirect_uri: "https://localhost:8080"
        });

        const response = await fetch(twitchOAuthUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: bodyParams
        });

        if (!response.ok) {
            throw new Error(`❌ Failed to refresh eventSub token: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error(`❌ Missing eventsub token in response for eventSub Token`);
        }

        await saveTokenData('eventsub', { accessToken: data.access_token });

        console.log(`✅ Successfully refreshed eventsub token!`);
    } catch (error) {
        console.error(`❌ Error refreshing eventsubtoken:`, error);
    }
}

// ✅ Check token expiration and refresh if necessary
async function checkTokenExpiration() {
    try {
        const result = await pool2.query("SELECT * FROM tokens");
        const now = new Date();
        let tokenRefreshed = false; // Track if any token was refreshed

        for (const row of result.rows) {
            if (now >= new Date(row.expires_at) || row.expires_at === null) {
                console.log(`🔄 ${row.token_type.toUpperCase()} token expired! Refreshing...`);
                
                if (row.token_type === 'chat') {
                    await refreshAccessToken();
                    tokenRefreshed = true;
                } else if (row.token_type === 'eventsub') {
                    await refreshEventSubToken();
                    tokenRefreshed = true;
                }
            }
        }

        console.log("✅ Tokens valid. Setting up Twitch clients...");
        return !tokenRefreshed; // If any token was refreshed, return false (restart needed)
    } catch (error) {
        console.error("❌ Error checking token expiration:", error);
        return false;
    }
}

module.exports = {getAccessToken, checkTokenExpiration};
