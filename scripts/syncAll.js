const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;
if (!supabaseUrl || !supabaseAnonKey || !tmdbApiKey) {
  console.error('Missing env vars');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);
async function syncMissingReleaseDates() {
  const { data: items, error } = await supabase.from('watchlist_items').select('*').is('release_date', null);
  if (error) { console.error('Fetch error', error); return; }
  if (!items || items.length === 0) { console.log('No items missing release_date'); return; }
  console.log(`Found ${items.length} items missing release_date`);
  const batchSize = 4;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(async (item) => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${tmdbApiKey}`);
        if (!res.ok) return;
        const data = await res.json();
        const releaseDate = data.release_date || data.first_air_date || null;
        if (!releaseDate) return;
        await supabase.from('watchlist_items').update({ release_date: releaseDate }).eq('id', item.id);
        console.log(`✓ ${item.title} → ${releaseDate}`);
      } catch (e) { console.warn('Item sync error', e); }
    }));
    console.log(`Progress: ${Math.min(i + batchSize, items.length)} / ${items.length}`);
  }
  console.log('✓ Sync complete');
}
syncMissingReleaseDates().then(() => process.exit());