import axios from 'axios';
import { redis } from './redis.js'; // our new redis client

// Create Riot API instance with auth headers
const riot = axios.create({
  headers: {
    'X-Riot-Token': process.env.RIOT_API_KEY,
  },
});

export async function getPlayerStatsFromRiot(name, tag) {
  const base = 'https://americas.api.riotgames.com';

  // STEP 1: Get PUUID from Riot ID
  const { data: account } = await riot.get(
    `${base}/riot/account/v1/accounts/by-riot-id/${name}/${tag}`
  );
  const puuid = account.puuid;

  // STEP 2: Get Summoner Info (name, level, etc.)
  const { data: summoner } = await riot.get(
    `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );

  // STEP 3: Get last 5 match IDs
  const { data: matchIds } = await riot.get(
    `${base}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`
  );

  const stats = [];

  for (const matchId of matchIds) {
    const { data: match } = await riot.get(`${base}/lol/match/v5/matches/${matchId}`);

    const player = match.info.participants.find(p => p.puuid === puuid);

    // === Meme Stat: Did this player die first? ===
    const firstDeath = match.info.participants.reduce((a, b) =>
      a.deaths < b.deaths ? a : b
    );
    if (player.puuid === firstDeath.puuid) {
      // Increment Redis meme stat using Upstash REST
      await redis.incr(`first_death:${puuid}`);
    }

    stats.push({
      matchId,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      role: player.teamPosition,
      win: player.win,
      puuid,
    });
  }

  return {
    summonerName: summoner.name,
    puuid,
    stats,
  };
}
