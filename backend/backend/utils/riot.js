import axios from 'axios';
import Redis from 'ioredis';

const redis = new Redis(process.env.UPSTASH_REDIS_REST_URL, {
  password: process.env.UPSTASH_REDIS_REST_TOKEN,
  tls: {},
});

const riot = axios.create({
  headers: {
    'X-Riot-Token': process.env.RIOT_API_KEY,
  },
});

export async function getPlayerStatsFromRiot(name, tag) {
  const base = 'https://americas.api.riotgames.com';

  const { data: account } = await riot.get(
    `${base}/riot/account/v1/accounts/by-riot-id/${name}/${tag}`
  );
  const puuid = account.puuid;

  const { data: summoner } = await riot.get(
    `https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
  );

  const { data: matches } = await riot.get(
    `${base}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`
  );

  const stats = [];

  for (const matchId of matches) {
    const { data: match } = await riot.get(`${base}/lol/match/v5/matches/${matchId}`);
    const player = match.info.participants.find(p => p.puuid === puuid);

    // Meme stat: died first?
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

  return { summonerName: summoner.name, puuid, stats };
}
