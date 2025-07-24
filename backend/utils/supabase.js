import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export async function saveToSupabase({ summonerName, puuid, stats }) {
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .upsert([{ summonerName, puuid }])
    .select();

  if (playerErr) throw playerErr;

  const playerId = player[0].id;

  const matches = stats.map(stat => ({
    matchId: stat.matchId,
    kills: stat.kills,
    deaths: stat.deaths,
    assists: stat.assists,
    role: stat.role,
    won: stat.win,
    playerId,
  }));

  const { error: matchErr } = await supabase.from('matches').upsert(matches);
  if (matchErr) throw matchErr;
}
