const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data: all, error: allErr } = await supabase.from('watchlist_items').select('id, title, vote_average');
  if (allErr) { console.error('Error:', allErr); return; }
  
  const withRating = all.filter(i => i.vote_average !== null && i.vote_average !== undefined);
  const withoutRating = all.filter(i => i.vote_average === null || i.vote_average === undefined);
  
  console.log(`Total items: ${all.length}`);
  console.log(`With vote_average: ${withRating.length}`);
  console.log(`Without vote_average: ${withoutRating.length}`);
  
  if (withoutRating.length > 0) {
    console.log('\nSample tanpa rating (5 pertama):');
    withoutRating.slice(0, 5).forEach(i => console.log(`- ${i.title}`));
  }
}

checkData().then(() => process.exit());
