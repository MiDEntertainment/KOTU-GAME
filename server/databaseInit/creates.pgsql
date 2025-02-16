CREATE TABLE IF NOT EXISTS player (
    player_id SERIAL PRIMARY KEY,              -- Unique player identifier
    twitch_username VARCHAR(50) NOT NULL UNIQUE, -- Twitch username, max 50 characters
    join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Auto-stamped join date
);

CREATE TABLE IF NOT EXISTS player_stats (
    stat_id SERIAL PRIMARY KEY,                -- Unique identifier for each stats record
    player_id INTEGER NOT NULL,                -- Foreign key linking to Players table
    health INTEGER DEFAULT 100,                -- Player's health (default 100)
    energy INTEGER DEFAULT 100,                -- Player's energy level (default 100)
    fighting_skills INTEGER DEFAULT 0,         -- Fighting skill level
    life_skills INTEGER DEFAULT 0,             -- Crafting skill level
    fishing_skills INTEGER DEFAULT 0,          -- Fishing skill level
    hunting_skills INTEGER DEFAULT 0,          -- Hunting skill level
    searching_skills INTEGER DEFAULT 0,        -- Scouting skill level
    current_location INTEGER DEFAULT 1,       -- Current objective the player is on
    current_rank INTEGER DEFAULT 1,            -- Default to the lowest rank
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
    province TEXT NOT NULL,                                   -- Province the location belongs to
    spire TEXT NOT NULL,                                      -- Spire the location belongs to
    description TEXT                                         -- Description of the location
);

CREATE TABLE IF NOT EXISTS objectives (
    objective_id SERIAL PRIMARY KEY,              -- Unique identifier for the objective
    objective_name TEXT NOT NULL,                 -- Name of the objective
    objective_location INTEGER NOT NULL,          -- Foreign key referencing locations table
    FOREIGN KEY (objective_location) REFERENCES locations(location_id) ON DELETE CASCADE -- Cascade delete
);

CREATE TABLE IF NOT EXISTS tasks (
    task_id SERIAL PRIMARY KEY,                  -- Unique identifier for each task
    objective_id INTEGER NOT NULL,               -- Foreign key referencing the objectives table
    task_name TEXT NOT NULL,                     -- Name of the task
    task_description TEXT NOT NULL,              -- Detailed description of the task
    required_command TEXT DEFAULT NULL,          -- Tracks what command this task applies to   
    FOREIGN KEY (objective_id) REFERENCES objectives(objective_id) ON DELETE CASCADE -- Cascade delete
);

CREATE TABLE IF NOT EXISTS task_rewards (
    reward_id SERIAL PRIMARY KEY,               -- Unique identifier for each reward
    task_id INTEGER NOT NULL,                   -- Foreign key referencing the tasks table
    item_name TEXT DEFAULT NULL,                -- Name of the item rewarded (nullable if no item)
    quantity INTEGER DEFAULT 1,                 -- Quantity of the item rewarded (default is 1)
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE -- Cascade delete
);

CREATE TABLE IF NOT EXISTS player_progress (
    progress_id SERIAL PRIMARY KEY,                  -- Unique identifier for progress entries
    player_id INTEGER NOT NULL,                      -- Foreign key linking to players table
    task_id INTEGER NOT NULL,                        -- Foreign key linking to tasks table
    completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for task completion
    FOREIGN KEY (player_id) REFERENCES player(player_id) ON DELETE CASCADE, -- Cascade delete
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE         -- Cascade delete
);


CREATE TABLE IF NOT EXISTS items (
    item_id SERIAL PRIMARY KEY,               -- Unique identifier for each item
    item_name TEXT NOT NULL,                  -- Name of the item
    item_location INTEGER NOT NULL CHECK (item_location BETWEEN 0 AND 13), -- Location ID (0 = everywhere, 1-13 = specific locations)
    limit_type TEXT NOT NULL CHECK (limit_type IN ('global', 'individual')), -- Type of limit
    item_type TEXT, -- Type of item
    item_limit INTEGER DEFAULT 100            -- Maximum quantity (100 = unlimited)
);

CREATE TABLE IF NOT EXISTS task_requirements (
    requirement_id SERIAL PRIMARY KEY,  -- Unique requirement ID
    task_id INTEGER NOT NULL,           -- Task this requirement belongs to
    item_name TEXT NOT NULL,            -- Required item name
    quantity_required INTEGER DEFAULT 1,-- How many of this item are needed
    FOREIGN KEY (task_id) REFERENCES tasks(task_id) ON DELETE CASCADE
);
