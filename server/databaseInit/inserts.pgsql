INSERT INTO locations (location_id, location_name, location_type, province, spire, description)
VALUES
    (1, 'MiDNight Chateau', 'Castle', 'Sunset Province', 'Night Spire', 'A rustic yet elegant hub on Solvana.'),
    (2, 'Lysara Castle', 'Castle', 'Lydion Province', 'Draxford Spire', 'Home of the KOTU Council.'),
    (3, 'Draxford Castle', 'Castle', 'Draxford Province', 'Draxford Spire', 'The repair bay for the damaged ferry.'),
    (4, 'Solhaven Castle', 'Castle', 'Umbrel Province', 'Umbrel Spire', 'A serene castle in the snow-covered Umbrel Spire.'),
    (5, 'Torveil Bastion', 'Castle', 'Torveli Province', 'Torveil Spire', 'A fortress guarding the Torveil Spire farmlands.'),
    (6, 'Xandral’s Refuge', 'Castle', 'Crystaline Province', 'Crystalline Spire', 'A castle surrounded by quantum crystal deposits.'),
    (7, 'Fenwyn Castle', 'Castle', 'Fenwyn Province', 'Fenwyn Spire', 'A castle in the heart of Solvana’s wine country.'),
    (8, 'Waycrest Bastion', 'Castle', 'Waycrest Province', 'Waycrest Spire', 'A bastion for trade and transportation.'),
    (9, 'Rivareth Castle', 'Castle', 'Rivareth Province', 'Rivareth Spire', 'A castle surrounded by fishing villages and trade.'),
    (10, 'Iridelle Castle', 'Castle', 'Eldra Province', 'Eldra Spire', 'A coastal castle supporting maritime activities.'),
    (11, 'Veylspire Castle', 'Castle', 'Veylspire Province', 'Veylspire Spire', 'A castle focused on military infrastructure.'),
    (12, 'Aelendel Castle', 'Castle', 'Aelendel Province', 'Aelendel Spire', 'A tranquil castle surrounded by lakes and forests.'),
    (13, 'Jarnwyl Castle', 'Castle', 'Jarnwyl Province', 'Zenith Spire', 'A castle with stunning mountain views in Zenith Spire.');

INSERT INTO objectives (objective_id, objective_name, objective_location)
VALUES
    (1, 'Gather supplies for your travels', 1),
    (2, 'Demand Answers', 2),
    (3, 'Investigate the Gravaton Arc', 3),
    (4, 'Investigate the military at Solhaven', 4),
    (5, 'Meet up with Vendor for upgrades', 5),
    (6, 'Find resources for the Gravaton Arc', 6),
    (7, 'Find the engineer and give her the supplies', 7),
    (8, 'Take urain to Rivert Spire', 8),
    (9, 'Look for Velia', 9),
    (10, 'Look for Velia again', 10),
    (11, 'Defend the castle', 11),
    (12, 'Save Velia', 12),
    (13, 'Final Battle', 13);

INSERT INTO tasks (task_id, objective_id, task_name, task_description)
VALUES
    (1, 1, 'Talk to the guard', 'Use the Channel reward "Talk" to talk to the KOTU Guard.'),
    (2, 1, 'Catch 10 fish with a quantum lure', 'Use the Channel reward "Fish" to try and catch a fish. The more you catch the better you will get at fishing.'),
    (3, 1, 'Hunt 5 animals with a bio bow and arrows', 'Use the Channel reward "Hunt" to try and catch an animal. The more you catch the better you will get at hunting.'),
    (4, 1, 'Win 1 game of Spires', 'Play the card games Spires against Silas for your chance to win Lumins.');

INSERT INTO items (item_name, item_location, item_type, limit_type, item_limit)
VALUES
    ('fish', 0, 'Fish', 'individual', 100),
    ('rabbit', 0, 'Animal', 'individual', 100),
    ('inim', 0, 'Relationship', 'individual', 100),
    ('lumins', 0, 'Currency', 'individual', 100);

INSERT INTO task_rewards (reward_id, task_id, item_name, quantity)
VALUES
    (1, 1, 'xp', 5),
    (3, 2, 'xp', 5),
    (5, 3, 'xp', 5),
    (7, 4, 'xp', 5),
    (8, 4, 'lumins', 10);

INSERT INTO ranks (rank_id, rank_name, xp_threshold)
VALUES
    (1, 'Traveler', 0),
    (2, 'Citizen', 160),
    (3, 'Baron', 1000),
    (4, 'Viscount', 3000),
    (5, 'Earl', 9600),
    (6, 'Marquess', 19200),
    (7, 'Duke', 38400);