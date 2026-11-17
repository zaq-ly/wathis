/**
 * Supabase keep-alive (dipakai oleh .github/workflows/keep-alive.yml).
 *
 * Env:
 *   SUPABASE_URL           (wajib)  https://<ref>.supabase.co
 *   SUPABASE_ANON_KEY      (wajib)  anon key / publishable key
 *   SUPABASE_ACCESS_TOKEN  (opsional) Personal Access Token untuk auto-restore
 *   APP_URL                (opsional) URL web app untuk ping /api/health
 *
 * Exit code != 0 jika DB tidak aktif & tidak berhasil di-restore,
 * sehingga GitHub mengirim email notifikasi kegagalan.
 */

const RETRIES = 3;
const RETRY_DELAY_MS = 10_000;

function clean(value) {
  // Toleran terhadap secret yang ditempel dalam format "KEY=value" atau berkutip
  return (value || '').trim().replace(/^[A-Z_]+=/, '').replace(/["'\s]/g, '');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url, options = {}, timeoutMs = 20_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

function buildHeaders(key) {
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  // Key lama berformat JWT boleh dipakai sebagai Bearer; key baru (sb_publishable_) tidak.
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  return headers;
}

/** Aktivitas tulis via RPC; fallback ke SELECT bila fungsi belum dibuat. */
async function pingDatabase(baseUrl, key) {
  const headers = buildHeaders(key);

  const rpc = await fetchWithTimeout(`${baseUrl}/rest/v1/rpc/ping_keep_alive`, {
    method: 'POST',
    headers,
    body: '{}',
  });
  if (rpc.ok) {
    console.log('RPC ping_keep_alive OK:', await rpc.text());
    return { ok: true, status: rpc.status };
  }
  const rpcBody = await rpc.text();
  console.warn(`RPC ping_keep_alive gagal (HTTP ${rpc.status}): ${rpcBody.slice(0, 200)}`);
  if (rpc.status === 404 || rpcBody.includes('PGRST202')) {
    console.warn('::warning::Fungsi ping_keep_alive belum ada. Jalankan supabase/keep_alive.sql di SQL Editor.');
  }

  const sel = await fetchWithTimeout(`${baseUrl}/rest/v1/watchlist_items?select=id&limit=1`, { headers });
  console.log('SELECT watchlist_items status:', sel.status);
  return { ok: sel.ok, status: sel.status };
}

async function restoreProject(projectRef, token) {
  console.log('Mencoba auto-restore project:', projectRef);
  const res = await fetchWithTimeout(`https://api.supabase.com/v1/projects/${projectRef}/restore`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (res.ok) {
    console.log('SUKSES: perintah restore dikirim, DB sedang dinyalakan kembali.');
    return true;
  }
  console.error(`Gagal restore (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
  return false;
}

/** Pastikan token auto-restore masih valid, agar tidak baru ketahuan rusak saat DB terpause. */
async function verifyAccessToken(projectRef, token) {
  if (!token) {
    console.warn('::warning::SUPABASE_ACCESS_TOKEN tidak diset; auto-restore tidak tersedia.');
    return;
  }
  const res = await fetchWithTimeout(`https://api.supabase.com/v1/projects/${projectRef}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) {
    const { status } = await res.json();
    console.log(`Access token valid. Status project: ${status}`);
    return;
  }
  console.error(`::error::SUPABASE_ACCESS_TOKEN tidak valid/kedaluwarsa (HTTP ${res.status}). Buat token baru dan update secret di GitHub.`);
  process.exit(1);
}

async function main() {
  const rawUrl = clean(process.env.SUPABASE_URL).replace(/\/$/, '');
  const key = clean(process.env.SUPABASE_ANON_KEY);
  const token = clean(process.env.SUPABASE_ACCESS_TOKEN);
  const appUrl = clean(process.env.APP_URL).replace(/\/$/, '');

  if (!rawUrl || !key) {
    console.error('::error::Secret SUPABASE_URL atau SUPABASE_ANON_KEY belum diisi di Settings > Secrets > Actions.');
    process.exit(1);
  }

  const baseUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  const projectRef = new URL(baseUrl).hostname.split('.')[0];
  console.log(`Target Supabase: ${projectRef}`);

  if (appUrl) {
    try {
      const res = await fetchWithTimeout(`${appUrl}/api/health`);
      console.log('App /api/health status:', res.status);
    } catch (e) {
      console.log('App ping gagal:', e.message);
    }
  }

  let last = null;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      last = await pingDatabase(baseUrl, key);
      if (last.ok) {
        console.log('SUKSES: database aktif.');
        await verifyAccessToken(projectRef, token);
        return;
      }
    } catch (e) {
      console.warn(`Percobaan ${attempt} error:`, e.message);
    }
    if (attempt < RETRIES) await sleep(RETRY_DELAY_MS);
  }

  if (last && (last.status === 401 || last.status === 403)) {
    console.error('::error::Ditolak (401/403). Periksa nilai secret SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  console.warn('::warning::Database tidak merespons, kemungkinan sedang PAUSED.');
  if (!token) {
    console.error('::error::DB tidak aktif dan SUPABASE_ACCESS_TOKEN tidak diset, jadi auto-restore tidak bisa dilakukan. Buat token di https://supabase.com/dashboard/account/tokens.');
    process.exit(1);
  }

  const restored = await restoreProject(projectRef, token);
  // Tetap tandai gagal agar pemilik dapat notifikasi bahwa project sempat terpause.
  console.error(restored
    ? '::error::Project sempat PAUSED dan sudah di-restore otomatis. Cek dashboard Supabase.'
    : '::error::Project PAUSED dan auto-restore gagal. Restore manual dari dashboard Supabase.');
  process.exit(1);
}

main().catch((err) => {
  console.error('::error::Fatal:', err);
  process.exit(1);
});
