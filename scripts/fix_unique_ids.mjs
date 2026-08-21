import fs from 'fs';

const seed = JSON.parse(fs.readFileSync('src/data/seed_watchlist.json', 'utf-8'));

const updated = seed.map((item, idx) => ({
  ...item,
  id: `${item.media_type}-${item.tmdb_id}-${idx + 1}`
}));

fs.writeFileSync('src/data/seed_watchlist.json', JSON.stringify(updated, null, 2));
console.log('Fixed unique IDs for all', updated.length, 'seed items.');
