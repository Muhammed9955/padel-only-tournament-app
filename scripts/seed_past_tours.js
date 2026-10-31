const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uguihaegfqnyjjlfgbxl.supabase.co';
const supabaseKey = 'sb_publishable_R0rO8slMc-1_9WokmI_rng_Wx98RbwN';
const supabase = createClient(supabaseUrl, supabaseKey);

const toursData = [
  {
    id: 'tour-arabiano-2026-10-10',
    name: 'Arabiano Tour - Saturday, 10 Oct 2026',
    style: 'arabiano',
    date: '2026-10-10T20:00:00Z',
    standings: [
      { name: 'Ahmed Kadry', points: 24, games: 7, rank: 1 },
      { name: 'Muhamed Khaled', points: 23, games: 7, rank: 2 },
      { name: 'Mohamed Osama', points: 22, games: 8, rank: 3 },
      { name: 'Mohamed Waheed', points: 17, games: 7, rank: 4 },
      { name: 'Moataz Tarek', points: 15, games: 7, rank: 5 },
      { name: 'Habiba', points: 13, games: 7, rank: 6 },
      { name: 'Aya Magdy', points: 10, games: 7, rank: 7 },
      { name: 'Sara', points: 9, games: 7, rank: 8 },
      { name: 'Esraa', points: 9, games: 7, rank: 9 },
      { name: 'Omnia', points: 6, games: 8, rank: 10 },
    ],
  },
  {
    id: 'tour-arabiano-2026-10-17',
    name: 'Arabiano Tour - Saturday, 17 Oct 2026',
    style: 'arabiano',
    date: '2026-10-17T20:00:00Z',
    standings: [
      { name: 'Mohamed Doks', points: 24, games: 8, rank: 1 },
      { name: 'Charles', points: 22, games: 7, rank: 2 },
      { name: 'Muhamed Khaled', points: 19, games: 7, rank: 3 },
      { name: 'Ahmed Kadry', points: 18, games: 7, rank: 4 },
      { name: 'Ibrahim', points: 13, games: 7, rank: 5 },
      { name: 'Habiba', points: 12, games: 8, rank: 6 },
      { name: 'Moataz Tarek', points: 11, games: 7, rank: 7 },
      { name: 'Mahmoud Alyan', points: 11, games: 7, rank: 8 },
      { name: 'Louai', points: 11, games: 7, rank: 9 },
      { name: 'Kholoud', points: 9, games: 7, rank: 10 },
    ],
  },
  {
    id: 'tour-arabiano-2026-10-24',
    name: 'Arabiano Tour - Saturday, 24 Oct 2026',
    style: 'arabiano',
    date: '2026-10-24T20:00:00Z',
    standings: [
      { name: 'Muhamed Khaled', points: 22, games: 7, rank: 1 },
      { name: 'Osama Ali', points: 16, games: 6, rank: 2 },
      { name: 'Fahmy', points: 14, games: 7, rank: 3 },
      { name: 'Mazen', points: 14, games: 6, rank: 4 },
      { name: 'Mohamed Osama', points: 14, games: 7, rank: 5 },
      { name: 'Mahmoud Alyan', points: 13, games: 6, rank: 6 },
      { name: 'Samir', points: 12, games: 6, rank: 7 },
      { name: 'Esraa', points: 11, games: 7, rank: 8 },
      { name: 'Habiba', points: 10, games: 6, rank: 9 },
      { name: 'Fahd', points: 10, games: 6, rank: 10 },
    ],
  },
];

async function seed() {
  console.log('Seeding 3 past tournaments to Supabase...');

  // Clean any old 2024 records
  await supabase.from('tournaments').delete().like('id', '%2024%');
  await supabase.from('tour_finishes').delete().like('tour_id', '%2024%');

  // 1. Insert into tournaments
  for (const tour of toursData) {
    const players = tour.standings.map((s, idx) => ({
      id: idx + 1,
      name: s.name,
      points: s.points,
    }));

    const { error: tourError } = await supabase.from('tournaments').upsert(
      {
        id: tour.id,
        name: tour.name,
        style: tour.style,
        court_count: 2,
        current_round_id: 7,
        is_completed: true,
        players: players,
        rounds: [],
        created_at: tour.date,
        completed_at: tour.date,
      },
      { onConflict: 'id' }
    );

    if (tourError) {
      console.error(`Error saving tournament ${tour.name}:`, tourError.message);
    } else {
      console.log(`Saved tournament: ${tour.name}`);
    }

    // 2. Insert into tour_finishes
    const finishRows = tour.standings.map((s) => ({
      tour_id: tour.id,
      player_name: s.name,
      style: tour.style,
      rank: s.rank,
      total_players: tour.standings.length,
      points: s.points,
      matches_won: Math.round(s.points / 3), // estimated wins
      matches_lost: Math.max(0, s.games - Math.round(s.points / 3)),
      matches_played: s.games,
      completed_at: tour.date,
    }));

    // Clear existing finishes for this tour to prevent duplicates
    await supabase.from('tour_finishes').delete().eq('tour_id', tour.id);
    const { error: finishError } = await supabase.from('tour_finishes').insert(finishRows);
    if (finishError) {
      console.error(`Error saving finishes for ${tour.name}:`, finishError.message);
    } else {
      console.log(`Saved ${finishRows.length} finishes for ${tour.name}`);
    }
  }

  // 3. Compute Career Leaderboard
  const playerMap = new Map();

  for (const tour of toursData) {
    for (const s of tour.standings) {
      const key = s.name.trim().toLowerCase();
      const existing = playerMap.get(key) || {
        name: s.name.trim(),
        normalized_name: key,
        tours_played: 0,
        arabiano_tours: 0,
        mexicano_tours: 0,
        total_points: 0,
        arabiano_points: 0,
        mexicano_points: 0,
        matches_won: 0,
        matches_lost: 0,
        matches_played: 0,
        championships: 0,
        top4_finishes: 0,
        updated_at: new Date().toISOString(),
      };

      existing.tours_played += 1;
      existing.arabiano_tours += 1;
      existing.total_points += s.points;
      existing.arabiano_points += s.points;
      existing.matches_played += s.games;
      const estimatedWon = Math.round(s.points / 3);
      existing.matches_won += estimatedWon;
      existing.matches_lost += Math.max(0, s.games - estimatedWon);

      if (s.rank === 1) existing.championships += 1;
      if (s.rank <= 4) existing.top4_finishes += 1;

      playerMap.set(key, existing);
    }
  }

  const leaderboardRows = Array.from(playerMap.values()).sort(
    (a, b) => b.total_points - a.total_points
  );

  const { error: lbError } = await supabase
    .from('player_career_stats')
    .upsert(leaderboardRows, { onConflict: 'normalized_name' });

  if (lbError) {
    console.error('Error saving career leaderboard:', lbError.message);
  } else {
    console.log(`Saved ${leaderboardRows.length} players to Career Leaderboard!`);
  }

  console.log('\nTop 5 Players in Career Leaderboard:');
  leaderboardRows.slice(0, 5).forEach((p, idx) => {
    console.log(
      `#${idx + 1}: ${p.name} - ${p.total_points} pts (${p.tours_played} tours, ${p.championships} titles, ${p.top4_finishes} Top-4)`
    );
  });
}

seed();
