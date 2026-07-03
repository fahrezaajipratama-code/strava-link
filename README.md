# Training Calendar · Solo Run Fest (dengan sync Strava live)

Kalender training half marathon kamu, dengan koneksi langsung ke Strava.
Klik "Reload Strava" → data terbaru langsung muncul, tanpa langkah manual.

Client Secret Strava kamu **tidak pernah** dikirim ke browser — semua panggilan
ke Strava yang butuh Client Secret dijalankan lewat Netlify Functions (server-side).

## 1. Deploy ke Netlify

**Cara termudah (drag & drop):**
1. Jalankan `npm install` lalu `npm run build` di folder ini (atau biarkan Netlify yang build).
2. Buka [app.netlify.com/drop](https://app.netlify.com/drop), drag seluruh folder project ini ke sana.

**Cara via Git (direkomendasikan, supaya bisa update):**
1. Push folder ini ke repo GitHub/GitLab kamu.
2. Di Netlify: **Add new site → Import an existing project**, hubungkan repo.
3. Build command: `npm run build`, Publish directory: `dist` (sudah diatur di `netlify.toml`).
4. Deploy.

Setelah deploy, kamu akan dapat URL seperti `https://nama-acak-123.netlify.app`
(bisa diganti nama di Site settings → Domain management).

## 2. Buat Strava API App

1. Buka [strava.com/settings/api](https://www.strava.com/settings/api), buat aplikasi baru.
2. Isi **Authorization Callback Domain** dengan domain Netlify kamu, TANPA `https://`,
   contoh: `nama-acak-123.netlify.app`
3. Catat **Client ID** dan **Client Secret** yang muncul.

## 3. Set Environment Variables di Netlify

Di dashboard Netlify: **Site settings → Environment variables**, tambahkan:

| Key | Value |
|---|---|
| `STRAVA_CLIENT_ID` | Client ID dari Strava |
| `STRAVA_CLIENT_SECRET` | Client Secret dari Strava |

Setelah menambahkan env vars, **re-deploy** situsnya (Deploys → Trigger deploy)
supaya functions membaca nilai env var yang baru.

## 4. Connect & Pakai

1. Buka situs Netlify kamu.
2. Klik **"Hubungkan Strava"** → **"Connect with Strava"**.
3. Login & authorize di halaman Strava.
4. Kamu diarahkan balik otomatis ke situsmu — connect selesai, tidak perlu copy-paste apa pun.
5. Klik **"Reload Strava"** kapan saja untuk narik data terbaru.
6. Klik badge Strava di tiap hari untuk lihat split per km, kalori, dan analisa coach.

## Struktur project

```
├── src/App.jsx                      # Seluruh UI kalender + logic
├── src/main.jsx                     # Entry point React
├── netlify/functions/
│   ├── strava-config.js             # Kirim Client ID (publik) ke frontend
│   ├── strava-connect.js            # Tukar authorization code → token (pakai Client Secret)
│   ├── strava-sync.js               # Refresh token + ambil daftar aktivitas
│   └── strava-detail.js             # Refresh token + ambil detail/laps satu aktivitas (lazy load)
└── netlify.toml                     # Konfigurasi build & functions
```

## Update jadwal training / data manual

Data rencana training ada di array `plan` dalam `src/App.jsx`. Data Strava awal
(sebelum connect) ada di `STRAVA_SEED_ACTIVITIES` — akan otomatis tergantikan
begitu kamu connect ke Strava.

## Development lokal

```bash
npm install
npm run dev          # jalankan frontend (Netlify Functions tidak aktif di mode ini)
```

Untuk test Netlify Functions secara lokal, install [Netlify CLI](https://docs.netlify.com/cli/get-started/)
lalu jalankan `netlify dev` (butuh env vars di file `.env` lokal).
