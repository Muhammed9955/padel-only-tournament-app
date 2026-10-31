-- ==============================================================================
-- 1. CLEANLY WIPE ALL EXISTING DATA (Keeps the tables & structure intact)
-- ==============================================================================
TRUNCATE TABLE tour_finishes, player_career_stats, tournaments CASCADE;

-- ==============================================================================
-- 2. INSERT THE 3 PAST TOURNAMENTS (Saturday 10 Oct, 17 Oct, 24 Oct 2026)
-- ==============================================================================
INSERT INTO tournaments (id, name, style, court_count, current_round_id, is_completed, players, rounds, created_at, completed_at)
VALUES
  (
    'tour-arabiano-2026-10-10',
    'Arabiano Tour - Saturday, 10 Oct 2026',
    'arabiano',
    2,
    7,
    true,
    '[
      {"id": 1, "name": "Ahmed Kadry", "points": 24},
      {"id": 2, "name": "Muhamed Khaled", "points": 23},
      {"id": 3, "name": "Mohamed Osama", "points": 22},
      {"id": 4, "name": "Mohamed Waheed", "points": 17},
      {"id": 5, "name": "Moataz Tarek", "points": 15},
      {"id": 6, "name": "Habiba", "points": 13},
      {"id": 7, "name": "Aya Magdy", "points": 10},
      {"id": 8, "name": "Sara", "points": 9},
      {"id": 9, "name": "Esraa", "points": 9},
      {"id": 10, "name": "Omnia", "points": 6}
    ]'::jsonb,
    '[]'::jsonb,
    '2026-10-10 20:00:00+00',
    '2026-10-10 22:30:00+00'
  ),
  (
    'tour-arabiano-2026-10-17',
    'Arabiano Tour - Saturday, 17 Oct 2026',
    'arabiano',
    2,
    7,
    true,
    '[
      {"id": 1, "name": "Mohamed Doks", "points": 24},
      {"id": 2, "name": "Charles", "points": 22},
      {"id": 3, "name": "Muhamed Khaled", "points": 19},
      {"id": 4, "name": "Ahmed Kadry", "points": 18},
      {"id": 5, "name": "Ibrahim", "points": 13},
      {"id": 6, "name": "Habiba", "points": 12},
      {"id": 7, "name": "Moataz Tarek", "points": 11},
      {"id": 8, "name": "Mahmoud Alyan", "points": 11},
      {"id": 9, "name": "Louai", "points": 11},
      {"id": 10, "name": "Kholoud", "points": 9}
    ]'::jsonb,
    '[]'::jsonb,
    '2026-10-17 20:00:00+00',
    '2026-10-17 22:30:00+00'
  ),
  (
    'tour-arabiano-2026-10-24',
    'Arabiano Tour - Saturday, 24 Oct 2026',
    'arabiano',
    2,
    7,
    true,
    '[
      {"id": 1, "name": "Muhamed Khaled", "points": 22},
      {"id": 2, "name": "Osama Ali", "points": 16},
      {"id": 3, "name": "Fahmy", "points": 14},
      {"id": 4, "name": "Mazen", "points": 14},
      {"id": 5, "name": "Mohamed Osama", "points": 14},
      {"id": 6, "name": "Mahmoud Alyan", "points": 13},
      {"id": 7, "name": "Samir", "points": 12},
      {"id": 8, "name": "Esraa", "points": 11},
      {"id": 9, "name": "Habiba", "points": 10},
      {"id": 10, "name": "Fahd", "points": 10}
    ]'::jsonb,
    '[]'::jsonb,
    '2026-10-24 20:00:00+00',
    '2026-10-24 22:30:00+00'
  );

-- ==============================================================================
-- 3. INSERT FINISHES FOR EACH TOUR
-- ==============================================================================
INSERT INTO tour_finishes (tour_id, player_name, style, rank, total_players, points, matches_won, matches_lost, matches_played, completed_at)
VALUES
  -- Tour Saturday, 10 Oct 2026
  ('tour-arabiano-2026-10-10', 'Ahmed Kadry', 'arabiano', 1, 10, 24, 7, 0, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Muhamed Khaled', 'arabiano', 2, 10, 23, 6, 1, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Mohamed Osama', 'arabiano', 3, 10, 22, 6, 2, 8, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Mohamed Waheed', 'arabiano', 4, 10, 17, 5, 2, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Moataz Tarek', 'arabiano', 5, 10, 15, 4, 3, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Habiba', 'arabiano', 6, 10, 13, 3, 4, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Aya Magdy', 'arabiano', 7, 10, 10, 2, 5, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Sara', 'arabiano', 8, 10, 9, 2, 5, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Esraa', 'arabiano', 9, 10, 9, 2, 5, 7, '2026-10-10 22:30:00+00'),
  ('tour-arabiano-2026-10-10', 'Omnia', 'arabiano', 10, 10, 6, 1, 7, 8, '2026-10-10 22:30:00+00'),

  -- Tour Saturday, 17 Oct 2026
  ('tour-arabiano-2026-10-17', 'Mohamed Doks', 'arabiano', 1, 10, 24, 7, 1, 8, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Charles', 'arabiano', 2, 10, 22, 6, 1, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Muhamed Khaled', 'arabiano', 3, 10, 19, 5, 2, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Ahmed Kadry', 'arabiano', 4, 10, 18, 5, 2, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Ibrahim', 'arabiano', 5, 10, 13, 3, 4, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Habiba', 'arabiano', 6, 10, 12, 3, 5, 8, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Moataz Tarek', 'arabiano', 7, 10, 11, 3, 4, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Mahmoud Alyan', 'arabiano', 8, 10, 11, 3, 4, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Louai', 'arabiano', 9, 10, 11, 2, 5, 7, '2026-10-17 22:30:00+00'),
  ('tour-arabiano-2026-10-17', 'Kholoud', 'arabiano', 10, 10, 9, 2, 5, 7, '2026-10-17 22:30:00+00'),

  -- Tour Saturday, 24 Oct 2026
  ('tour-arabiano-2026-10-24', 'Muhamed Khaled', 'arabiano', 1, 10, 22, 6, 1, 7, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Osama Ali', 'arabiano', 2, 10, 16, 5, 1, 6, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Fahmy', 'arabiano', 3, 10, 14, 4, 3, 7, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Mazen', 'arabiano', 4, 10, 14, 4, 2, 6, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Mohamed Osama', 'arabiano', 5, 10, 14, 4, 3, 7, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Mahmoud Alyan', 'arabiano', 6, 10, 13, 3, 3, 6, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Samir', 'arabiano', 7, 10, 12, 3, 3, 6, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Esraa', 'arabiano', 8, 10, 11, 3, 4, 7, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Habiba', 'arabiano', 9, 10, 10, 2, 4, 6, '2026-10-24 22:30:00+00'),
  ('tour-arabiano-2026-10-24', 'Fahd', 'arabiano', 10, 10, 10, 2, 4, 6, '2026-10-24 22:30:00+00');

-- ==============================================================================
-- 4. INSERT CUMULATIVE CAREER STATS (21 unique players)
-- ==============================================================================
INSERT INTO player_career_stats (
  name,
  normalized_name,
  tours_played,
  arabiano_tours,
  mexicano_tours,
  total_points,
  arabiano_points,
  mexicano_points,
  matches_won,
  matches_lost,
  matches_played,
  championships,
  top4_finishes,
  updated_at
)
VALUES
  ('Muhamed Khaled', 'muhamed khaled', 3, 3, 0, 64, 64, 0, 17, 4, 21, 1, 3, now()),
  ('Ahmed Kadry',    'ahmed kadry',    2, 2, 0, 42, 42, 0, 12, 2, 14, 1, 2, now()),
  ('Mohamed Osama',  'mohamed osama',  2, 2, 0, 36, 36, 0, 10, 5, 15, 0, 1, now()),
  ('Habiba',         'habiba',         3, 3, 0, 35, 35, 0, 8, 13, 21, 0, 0, now()),
  ('Moataz Tarek',   'moataz tarek',   2, 2, 0, 26, 26, 0, 7, 7, 14,  0, 0, now()),
  ('Mohamed Doks',   'mohamed doks',   1, 1, 0, 24, 24, 0, 7, 1, 8,   1, 1, now()),
  ('Mahmoud Alyan',  'mahmoud alyan',  2, 2, 0, 24, 24, 0, 6, 7, 13,  0, 0, now()),
  ('Charles',        'charles',        1, 1, 0, 22, 22, 0, 6, 1, 7,   0, 1, now()),
  ('Esraa',          'esraa',          2, 2, 0, 20, 20, 0, 5, 9, 14,  0, 0, now()),
  ('Mohamed Waheed', 'mohamed waheed', 1, 1, 0, 17, 17, 0, 5, 2, 7,   0, 1, now()),
  ('Osama Ali',      'osama ali',      1, 1, 0, 16, 16, 0, 5, 1, 6,   0, 1, now()),
  ('Fahmy',          'fahmy',          1, 1, 0, 14, 14, 0, 4, 3, 7,   0, 1, now()),
  ('Mazen',          'mazen',          1, 1, 0, 14, 14, 0, 4, 2, 6,   0, 1, now()),
  ('Ibrahim',        'ibrahim',        1, 1, 0, 13, 13, 0, 3, 4, 7,   0, 0, now()),
  ('Samir',          'samir',          1, 1, 0, 12, 12, 0, 3, 3, 6,   0, 0, now()),
  ('Louai',          'louai',          1, 1, 0, 11, 11, 0, 2, 5, 7,   0, 0, now()),
  ('Aya Magdy',      'aya magdy',      1, 1, 0, 10, 10, 0, 2, 5, 7,   0, 0, now()),
  ('Fahd',           'fahd',           1, 1, 0, 10, 10, 0, 2, 4, 6,   0, 0, now()),
  ('Sara',           'sara',           1, 1, 0, 9,  9,  0, 2, 5, 7,   0, 0, now()),
  ('Kholoud',        'kholoud',        1, 1, 0, 9,  9,  0, 2, 5, 7,   0, 0, now()),
  ('Omnia',          'omnia',          1, 1, 0, 6,  6,  0, 1, 7, 8,   0, 0, now());
