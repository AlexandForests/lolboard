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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
