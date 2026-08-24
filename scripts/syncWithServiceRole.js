const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'D:/Projects/wathis/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tmdbApiKey = process.env.TMDB_API_KEY;

if (!supabaseUrl || !supabaseKey || !tmdbApiKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncAllReleaseDates() {
  const { data: items, error } = await supabase.from('watchlist_items').select('*').is('release_date', null);
  if (error) { console.error('Fetch error', error); return; }
  if (!items || items.length === 0) { console.log('All items have release_date'); return; }
  
  console.log(`Syncing ${items.length} items...`);
  const batchSize = 4;
  let synced = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(async (item) => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/${item.media_type}/${item.tmdb_id}?api_key=${tmdbApiKey}`);
        if (!res.ok) return;
        const data = await res.json();
        const releaseDate = data.release_date || data.first_air_date || null;
        if (!releaseDate) return;
        
        const { error: updError } = await supabase.from('watchlist_items').update({ release_date: releaseDate }).eq('id', item.id);
        if (!updError) {
          synced++;
          console.log(`✓ ${item.title} → ${releaseDate}`);
        } else {
          console.warn(`✗ ${item.title}:`, updError.message);
        }
      } catch (e) {
        console.warn(`✗ ${item.title}:`, e.message);
      }
    }));
    console.log(`Progress: ${Math.min(i + batchSize, items.length)} / ${items.length}`);
  }
  console.log(`\n✓ Sync complete: ${synced} updated`);
}

syncAllReleaseDates().then(() => process.exit());
