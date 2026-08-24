const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: 'D:/Projects/wathis/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data: all, error: allErr } = await supabase.from('watchlist_items').select('id, title, release_date');
  if (allErr) { console.error('Error:', allErr); return; }
  
  const withDate = all.filter(i => i.release_date);
  const withoutDate = all.filter(i => !i.release_date);
  
  console.log(`Total items: ${all.length}`);
  console.log(`With release_date: ${withDate.length}`);
  console.log(`Without release_date: ${withoutDate.length}`);
  
  if (withoutDate.length > 0) {
    console.log('\nSample tanpa release_date (5 pertama):');
    withoutDate.slice(0, 5).forEach(i => console.log(`- ${i.title}`));
  }
}

checkData().then(() => process.exit());
