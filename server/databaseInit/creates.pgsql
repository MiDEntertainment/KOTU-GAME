CREATE TABLE IF NOT EXISTS player (
    player_id SERIAL PRIMARY KEY,              -- Unique player identifier
    twitch_username VARCHAR(50) NOT NULL UNIQUE, -- Twitch username, max 50 characters
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Auto-stamped join date
    twitch_id INTEGER NOT NULL,                -- Twitch id
);

CREATE TABLE IF NOT EXISTS player_stats (
    stat_id SERIAL PRIMARY KEY,                -- Unique identifier for each stats record
    player_id INTEGER NOT NULL,                -- Foreign key linking to Players table
    health INTEGER DEFAULT 10,                -- Player's health (default 10)
    hidden_skills INTEGER DEFAULT 0,           -- Talking and mini game skill level
    hunting_skills INTEGER DEFAULT 0,          -- Hunting skill level
    searching_skills INTEGER DEFAULT 0,        -- Searching skill level
    current_location INTEGER DEFAULT 1,       -- Current objective the player is on
    current_rank INTEGER DEFAULT 1,            -- Default to the lowest rank
    health_cap INTEGER DEFAULT 10,             -- Default to the lowest rank health cap
    xp_level INTEGER DEFAULT 10,             -- Default to the lowest rank health cap
    FOREIGN KEY (player_id) REFERENCES player(player_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ranks (
    rank_id SERIAL PRIMARY KEY,           -- Unique identifier for the rank
    rank_name TEXT NOT NULL,              -- Name of the rank (e.g., Novice, Warrior, etc.)
    xp_threshold INTEGER NOT NULL,        -- Minimum XP required to attain this rank
    rank_description TEXT                 -- Optional description of the rank
);

CREATE TABLE IF NOT EXISTS inventory (
    inventory_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    UNIQUE (player_id, item_name), -- ✅ Ensures each player can only have one row per item
    FOREIGN KEY (player_id) REFERENCES player(player_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS locations (
    location_id SERIAL PRIMARY KEY,                           -- Unique identifier for the location
    location_name TEXT NOT NULL,                              -- Name of the location
    location_type TEXT NOT NULL CHECK (location_type IN ('Castle', 'Fort')), -- Type of location (Castle or Fort)
    spire TEXT NOT NULL,                                      -- Spire the location belongs to
    description TEXT                                         -- Description of the location
);

CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,               -- Unique identifier for each item
    item_name TEXT NOT NULL,                  -- Name of the item
    item_location INTEGER NOT NULL CHECK (item_location BETWEEN 0 AND 13), -- Location ID (0 = everywhere, 1-13 = specific locations)
    limit_type TEXT NOT NULL CHECK (limit_type IN ('global', 'individual')), -- Type of limit
    item_type TEXT,                            -- Type of item
    sell_price INTEGER,                         -- amount of lumins this items sells for (0 = cannot be sold)
    item_limit INTEGER DEFAULT 100              -- Maximum quantity
);

CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    token_type TEXT NOT NULL UNIQUE CHECK (token_type IN ('chat', 'eventsub')),
    access_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL
);