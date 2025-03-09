INSERT INTO locations (location_id, location_name, location_type, province, spire, description)
VALUES
    (1, 'MiDNight Chateau', 'Castle', 'Sunset Province', 'Night Spire', 'A rustic yet elegant hub on Solvana.'),
    (2, 'Lysara Castle', 'Castle', 'Lydion Province', 'Draxford Spire', 'Home of the KOTU Council.'),
    (3, 'Draxford Castle', 'Castle', 'Draxford Province', 'Draxford Spire', 'The repair bay for the damaged ferry.'),
    (4, 'Solhaven Castle', 'Castle', 'Umbrel Province', 'Umbrel Spire', 'A serene castle in the snow-covered Umbrel Spire.'),
    (5, 'Torveil Bastion', 'Castle', 'Torveli Province', 'Torveil Spire', 'A fortress guarding the Torveil Spire farmlands.'),
    (6, 'Fenwyn Castle', 'Castle', 'Fenwyn Province', 'Fenwyn Spire', 'A castle in the heart of Solvana’s wine country.'),
    (7, 'Xandral’s Refuge', 'Castle', 'Crystaline Province', 'Crystalline Spire', 'A castle surrounded by quantum crystal deposits.'),
    (8, 'Waycrest Bastion', 'Castle', 'Waycrest Province', 'Waycrest Spire', 'A bastion for trade and transportation.'),
    (9, 'Rivareth Castle', 'Castle', 'Rivareth Province', 'Rivareth Spire', 'A castle surrounded by fishing villages and trade.'),
    (10, 'Iridelle Castle', 'Castle', 'Eldra Province', 'Eldra Spire', 'A coastal castle supporting maritime activities.'),
    (11, 'Veylspire Castle', 'Castle', 'Veylspire Province', 'Veylspire Spire', 'A castle focused on military infrastructure.'),
    (12, 'Aelendel Castle', 'Castle', 'Aelendel Province', 'Aelendel Spire', 'A tranquil castle surrounded by lakes and forests.'),
    (13, 'Jarnwyl Castle', 'Castle', 'Jarnwyl Province', 'Zenith Spire', 'A castle with stunning mountain views in Zenith Spire.');

INSERT INTO ranks (rank_id, rank_name, xp_threshold)
VALUES
    (1, 'Traveler', 0),
    (2, 'Citizen', 160),
    (3, 'Baron', 1000),
    (4, 'Viscount', 3000),
    (5, 'Earl', 9600),
    (6, 'Marquess', 19200),
    (7, 'Duke', 38400);