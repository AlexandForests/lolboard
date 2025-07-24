import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { getPlayerStatsFromRiot } from './utils/riot.js';
import { saveToSupabase } from './utils/supabase.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/player/:name/:tag', async (req, res) => {
  const { name, tag } = req.params;

  try {
    const stats = await getPlayerStatsFromRiot(name, tag);
    await saveToSupabase(stats);
    res.json({ success: true, stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
