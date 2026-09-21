const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to detect if text is already Indonesian
function isIndonesian(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const indonesianIndicators = [
    ' yang ',
    ' dan ',
    ' di ',
    ' ke ',
    ' sebuah ',
    ' seorang ',
    ' menceritakan ',
    ' dengan ',
    ' untuk ',
    ' tidak ',
    ' dari ',
    ' adalah ',
    ' saat ',
    ' tentang '
  ];
  let matches = 0;
  for (const ind of indonesianIndicators) {
    if (lower.includes(ind)) matches++;
  }
  return matches >= 2;
}

// Helper function to translate text via MyMemory in chunks <= 400 chars
async function translateText(text) {
  const trimmed = text.trim();
  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [trimmed];
  const chunks = [];
  let current = '';

  for (const s of sentences) {
    if ((current + s).length > 350) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const translatedChunks = [];
  for (const chunk of chunks) {
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=en|id&de=wathis_sync2@gmail.com`;
      const res = await fetch(url);
      if (!res.ok) {
        translatedChunks.push(chunk);
        continue;
      }
      const data = await res.json();
      const resText = data.responseData?.translatedText;
      if (resText && !resText.includes('MYMEMORY WARNING')) {
        translatedChunks.push(resText);
      } else {
        translatedChunks.push(chunk);
      }
    } catch {
      translatedChunks.push(chunk);
    }
    // Polite pause between chunks
    await new Promise((r) => setTimeout(r, 150));
  }

  return translatedChunks.join(' ');
}

async function main() {
  console.log('Fetching watchlist items from Supabase...');
  const { data: items, error } = await supabase
    .from('watchlist_items')
    .select('id, title, overview')
    .not('overview', 'is', null);

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  const needsTranslation = (items || []).filter((it) => it.overview && !isIndonesian(it.overview));
  console.log(`Total items: ${items.length}`);
  console.log(`Already Indonesian: ${items.length - needsTranslation.length}`);
  console.log(`Needs translation: ${needsTranslation.length}`);

  if (needsTranslation.length === 0) {
    console.log('All overviews are already in Indonesian!');
    return;
  }

  let count = 0;
  for (const item of needsTranslation) {
    count++;
    try {
      console.log(`[${count}/${needsTranslation.length}] Translating: ${item.title}...`);
      const translated = await translateText(item.overview);

      if (translated && translated !== item.overview) {
        const { error: updateErr } = await supabase
          .from('watchlist_items')
          .update({ overview: translated })
          .eq('id', item.id);

        if (updateErr) {
          console.warn(`  Failed to update DB for ${item.title}:`, updateErr.message);
        } else {
          console.log(`  ✓ Translated & saved: ${translated.slice(0, 60)}...`);
        }
      } else {
        console.log(`  - Skipped (same text)`);
      }
    } catch (e) {
      console.warn(`  Error translating ${item.title}:`, e.message || e);
    }

    // Delay between items to respect API rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log('Finished translating items!');
}

main().then(() => process.exit(0));
