import axios from 'axios';
import { redis } from './redis.js';

const riot = axios.create({
  headers: {
    'X-Riot-Token': process.env.RIOT_API_KEY,
  },
});

export async function getPlayerStatsFromRiot(gameName, tagLine) {
  const base = 'https://americas.api.riotgames.com';

  // Step 1: Get PUUID from Riot ID
  const { data: account } = await riot.get(
    `${base}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`
  );
  const puuid = account.puuid;

  // Step 2: Get summoner info
  const { data: summoner } = await riot.get(
    `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );

  // Step 3: Get recent match IDs
  const { data: matchIds } = await riot.get(
    `${base}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`
  );

  const stats = [];

  for (const matchId of matchIds) {
    const { data: match } = await riot.get(`${base}/lol/match/v5/matches/${matchId}`);
    const player = match.info.participants.find(p => p.puuid === puuid);

    // Meme stat: Died first?
    const firstDeath = match.info.participants.reduce((a, b) =>
      a.deaths < b.deaths ? a : b
    );
    if (player.puuid === firstDeath.puuid) {
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
