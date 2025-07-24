import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { getPlayerStatsFromRiot } from './utils/riot.js';
import { saveToSupabase } from './utils/supabase.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/player/:gameName/:tagLine', async (req, res) => {
  const { gameName, tagLine } = req.params;

  try {
    console.log(`[REQUEST] /api/player/${gameName}/${tagLine}`);
    const stats = await getPlayerStatsFromRiot(gameName, tagLine);
    console.log(`[SUCCESS] Riot stats fetched`, stats);

    await saveToSupabase(stats);
    res.json({ success: true, stats });
  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({ error: error.message || 'Something went wrong!' });
  }
});

// === NEW BULK ROUTE ===
app.post('/api/bulk-load', async (req, res) => {
  const players = req.body; // Expecting array of { gameName, tagLine }
  const results = [];

  for (const player of players) {
    const { gameName, tagLine } = player;
    try {
      console.log(`[BULK] Fetching: ${gameName}#${tagLine}`);
      const stats = await getPlayerStatsFromRiot(gameName, tagLine);
      await saveToSupabase(stats);
      results.push({ gameName, tagLine, success: true });
    } catch (error) {
      console.error(`[BULK ERROR] ${gameName}#${tagLine}`, error);
      results.push({ gameName, tagLine, success: false, error: error.message });
    }
  }

  res.json({ results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
