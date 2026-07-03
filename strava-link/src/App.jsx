import { useState, useEffect, useCallback } from "react";

const MONTH_MAP = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", Mei: "05", Jun: "06", Jul: "07", Agu: "08", Sep: "09", Okt: "10", Nov: "11", Des: "12" };

function planDateToISO(dateStr, year = 2026) {
  const [day, mon] = dateStr.split(" ");
  const month = MONTH_MAP[mon] || "01";
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

// Data ini di-refresh oleh Claude langsung dari Strava (via koneksi yang sudah kamu authorize di chat),
// lalu ditulis ulang ke sini. Klik "Reload Strava" untuk minta Claude menarik data terbaru.
// Data awal (seed) supaya kalender tidak kosong sebelum kamu connect ke Strava.
// Setelah connect, data ini akan digantikan oleh data live dari Strava API.
const STRAVA_SYNCED_AT_SEED = "2026-07-02T08:00:00+07:00";
const STRAVA_SEED_ACTIVITIES = {
  "2026-06-23": {
    type: "Run", name: "Morning Run", distance_km: 8.0, moving_time_min: 54.1, avg_pace: "6:45/km",
    avg_hr: 144, max_hr: 173, avg_cadence: 89, elevation_gain_m: 13, calories: 551, best_5k: "33:26",
    laps: [
      { km: 1, pace: "7:01/km", hr: 126 }, { km: 2, pace: "6:47/km", hr: 136 }, { km: 3, pace: "6:47/km", hr: 141 },
      { km: 4, pace: "6:50/km", hr: 145 }, { km: 5, pace: "7:01/km", hr: 146 }, { km: 6, pace: "6:47/km", hr: 148 },
      { km: 7, pace: "6:45/km", hr: 151 }, { km: 8, pace: "5:08/km", hr: 165, note: "kick akhir" },
    ],
    analysis: "Easy run yang solid, sesuai target 8km (6:50–7:10). HR naik bertahap dari Z1 ke Z2 seiring durasi — normal untuk cardiac drift di suhu hangat. Ada kick cepat di km terakhir (5:08/km, HR165) yang mendorong ke Z3 sesaat — bukan masalah besar untuk penutup easy run, tapi tidak perlu dijadikan kebiasaan tiap sesi easy."
  },
  "2026-06-24": {
    type: "Run", name: "Morning Run", distance_km: 8.1, moving_time_min: 54.6, avg_pace: "6:44/km",
    avg_hr: 142, max_hr: 156, avg_cadence: 89, elevation_gain_m: 10, calories: 554, best_5k: "33:20",
    laps: [
      { km: 1, pace: "6:57/km", hr: 121 }, { km: 2, pace: "6:45/km", hr: 134 }, { km: 3, pace: "6:47/km", hr: 138 },
      { km: 4, pace: "6:40/km", hr: 142 }, { km: 5, pace: "6:40/km", hr: 146 }, { km: 6, pace: "6:40/km", hr: 150 },
      { km: 7, pace: "6:40/km", hr: 152 }, { km: 8, pace: "6:40/km", hr: 153 },
    ],
    analysis: "Sangat rapi — pace stabil 6:40–6:57/km sepanjang lari, sesuai slot Easy (target 8km, 6:50–7:10). HR naik halus dan terkendali sampai akhir di Z1/Z2 rendah. Ini contoh eksekusi easy run yang bagus: konsisten, tidak ada lonjakan tempo."
  },
  "2026-06-25": {
    type: "Run", name: "Morning Run", distance_km: 5.1, moving_time_min: 30.5, avg_pace: "5:59/km",
    avg_hr: 152, max_hr: 168, avg_cadence: 89, elevation_gain_m: 12, calories: 347, best_5k: "29:50",
    laps: [
      { km: 1, pace: "6:25/km", hr: 132 }, { km: 2, pace: "5:56/km", hr: 148 }, { km: 3, pace: "5:43/km", hr: 157 },
      { km: 4, pace: "5:56/km", hr: 162 }, { km: 5, pace: "5:55/km", hr: 164 },
    ],
    analysis: "Hari ini seharusnya REST di plan, tapi tercatat lari progresif — pace turun dari 6:25/km ke 5:43/km, HR naik dari Z1 ke Z3 (164 bpm). Ini efektif jadi sesi tempo dadakan. Kalau ini pengganti hari lain, tidak masalah — tapi kalau spontan, ini pola yang perlu diwaspadai: rest day adalah bagian dari adaptasi, bukan opsional."
  },
  "2026-06-26": {
    type: "Run", name: "Morning Run", distance_km: 7.1, moving_time_min: 47.3, avg_pace: "6:42/km",
    avg_hr: 141, max_hr: 167, avg_cadence: 89, elevation_gain_m: 7, calories: 482, best_5k: "33:19",
    laps: [
      { km: 1, pace: "6:51/km", hr: 147, note: "spike sensor" }, { km: 2, pace: "6:47/km", hr: 129 }, { km: 3, pace: "6:45/km", hr: 135 },
      { km: 4, pace: "6:44/km", hr: 140 }, { km: 5, pace: "6:40/km", hr: 142 }, { km: 6, pace: "6:38/km", hr: 146 },
      { km: 7, pace: "6:30/km", hr: 150 },
    ],
    extraNote: "Ada juga sesi sepeda 145 menit (27.5km) di sore hari yang sama.",
    analysis: "Lari sesuai target (7km, 6:45–7:00), HR rendah dan stabil di Z1. Lap pertama HR 147 lalu turun ke 129 di lap 2 — ini kemungkinan glitch sensor HR saat start (max 167 di lap yang sama juga aneh), bukan kondisi fisiologis nyata. Yang perlu diperhatikan: ada juga sesi sepeda ~96 menit di hari yang sama — total training load hari ini cukup besar untuk dua sesi terpisah menjelang long run Minggu."
  },
  "2026-06-27": {
    type: "Run", name: "Morning Run", distance_km: 7.0, moving_time_min: 47.8, avg_pace: "6:49/km",
    avg_hr: 139, max_hr: 152, avg_cadence: 88, elevation_gain_m: 6, calories: 479, best_5k: "33:58",
    laps: [
      { km: 1, pace: "6:53/km", hr: 123 }, { km: 2, pace: "6:51/km", hr: 133 }, { km: 3, pace: "6:51/km", hr: 137 },
      { km: 4, pace: "6:49/km", hr: 140 }, { km: 5, pace: "6:48/km", hr: 145 }, { km: 6, pace: "6:45/km", hr: 148 },
      { km: 7, pace: "6:45/km", hr: 149 },
    ],
    analysis: "Plan minta Strength 45min + Easy 5km — larinya 2km lebih panjang dari target, tidak ada data strength di Strava (mungkin tidak di-log atau dilewati). Larinya sendiri sangat bersih: HR rendah dan stabil, pace pas di rentang easy. Pastikan sesi strength tetap dijalankan — ini penting untuk cegah cedera menjelang volume lari yang terus naik."
  },
  "2026-06-28": {
    type: "Run", name: "Morning Run", distance_km: 12.0, moving_time_min: 79.1, avg_pace: "6:35/km",
    avg_hr: 146, max_hr: 158, avg_cadence: 89, elevation_gain_m: 23, calories: 825, best_5k: "32:43", best_10k: "1:05:51",
    laps: [
      { km: 1, pace: "6:37/km", hr: 127 }, { km: 2, pace: "6:33/km", hr: 136 }, { km: 3, pace: "6:37/km", hr: 139 },
      { km: 4, pace: "6:37/km", hr: 143 }, { km: 5, pace: "6:40/km", hr: 143 }, { km: 6, pace: "6:36/km", hr: 146 },
      { km: 7, pace: "6:35/km", hr: 149 }, { km: 8, pace: "6:35/km", hr: 151 }, { km: 9, pace: "6:35/km", hr: 151 },
      { km: 10, pace: "6:32/km", hr: 152 }, { km: 11, pace: "6:31/km", hr: 155 }, { km: 12, pace: "6:29/km", hr: 156 },
    ],
    analysis: "Ini yang paling perlu disorot minggu ini. Plan minta 13km @ 7:00–7:15/km — aktualnya 1km LEBIH PENDEK dan hampir 30–40 detik/km LEBIH CEPAT (6:29–6:37/km sepanjang lari, bukan melambat). Long run fungsinya membangun daya tahan aerobik di intensitas rendah, bukan kecepatan. Lari kejauhan yang dipercepat begini mengurangi manfaat endurance dan menambah fatigue yang tidak perlu — apalagi kalori terbakar 825 kkal, jauh di atas sesi easy biasa."
  },
  "2026-06-30": {
    type: "Run", name: "Morning Run", distance_km: 8.3, moving_time_min: 55.7, avg_pace: "6:45/km",
    avg_hr: 140, max_hr: 158, avg_cadence: 89, elevation_gain_m: 34, calories: 566, best_5k: "33:24",
    laps: [
      { km: 1, pace: "6:55/km", hr: 125 }, { km: 2, pace: "6:51/km", hr: 132 }, { km: 3, pace: "6:50/km", hr: 137 },
      { km: 4, pace: "6:52/km", hr: 142, note: "tanjakan" }, { km: 5, pace: "6:45/km", hr: 145 }, { km: 6, pace: "6:44/km", hr: 144 },
      { km: 7, pace: "6:36/km", hr: 147 }, { km: 8, pace: "6:30/km", hr: 149 },
    ],
    analysis: "Konsisten dengan sesi easy lainnya minggu ini. Ada tanjakan di km 4 (+17m elevasi) yang bikin HR naik ke 142 lalu turun lagi setelah turunan di km 5 — respons fisiologis normal terhadap medan. Pace dan HR keseluruhan tetap di zona easy yang sehat."
  },
  "2026-07-01": {
    type: "Run", name: "Morning Run", distance_km: 8.0, moving_time_min: 50.5, avg_pace: "6:19/km",
    avg_hr: 146, max_hr: 161, avg_cadence: 89, elevation_gain_m: 9, calories: 543, best_5k: "29:59",
    laps: [
      { km: 1, pace: "6:48/km", hr: 123, note: "warmup" }, { km: 2, pace: "6:45/km", hr: 133, note: "warmup" },
      { km: 3, pace: "5:52/km", hr: 149, note: "tempo" }, { km: 4, pace: "5:52/km", hr: 154, note: "tempo" },
      { km: 5, pace: "5:46/km", hr: 156, note: "tempo" }, { km: 6, pace: "5:45/km", hr: 158, note: "tempo" },
      { km: 7, pace: "6:48/km", hr: 151, note: "cooldown" }, { km: 8, pace: "6:48/km", hr: 148, note: "cooldown" },
    ],
    analysis: "Plan minta 9km (2km easy + 5km tempo @5:55–6:10 + 2km cooldown, target HR 162–170). Struktur larinya jelas: 2km warmup, lalu 4km tempo di 5:45–5:52/km (LEBIH CEPAT dari target pace!), diikuti cooldown. Total cuma 8km — cooldown kependekan 1km, dan blok tempo cuma 4km bukan 5km. Menariknya: pace tempo tercapai/terlampaui, tapi HR cuma sampai 158–161 (belum menyentuh target 162–170) — sinyal bagus, fitness kamu naik, bisa lari pace tempo dengan effort lebih rendah dari sebelumnya."
  },
  "2026-07-02": {
    type: "WeightTraining", name: "Morning Weight Training", distance_km: 0, moving_time_min: 23.6,
    avg_pace: null, avg_hr: null, max_hr: null, avg_cadence: null, elevation_gain_m: 0, calories: 96,
    laps: [],
    analysis: "Hari ini REST di plan lari, dan kamu isi dengan latihan beban ringan 24 menit — ini pas sekali. Strength training di hari rest lari itu ideal karena tidak menambah impact/fatigue kaki, sambil tetap membangun kekuatan otot pendukung. Lanjutkan pola ini."
  },
};

// ---------- Live Strava data — semua lewat Netlify Functions (client_secret aman di server) ----------

function buildStravaAuthorizeUrl(clientId, redirectUri) {
  const scope = "activity:read_all,profile:read_all";
  return `https://www.strava.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&approval_prompt=auto&scope=${encodeURIComponent(scope)}`;
}

async function apiFetchConfig() {
  const res = await fetch("/.netlify/functions/strava-config");
  if (!res.ok) throw new Error("Gagal ambil konfigurasi Strava dari server.");
  return res.json(); // { clientId }
}

async function apiConnect(code) {
  const res = await fetch("/.netlify/functions/strava-connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Gagal connect (HTTP ${res.status})`);
  return data; // { accessToken, refreshToken, expiresAt, athlete }
}

async function apiSync(refreshToken, afterEpoch) {
  const res = await fetch("/.netlify/functions/strava-sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, afterEpoch }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Gagal sync (HTTP ${res.status})`);
  return data; // { activities, accessToken, refreshToken, expiresAt }
}

async function apiDetail(refreshToken, activityId, isRun) {
  const res = await fetch("/.netlify/functions/strava-detail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken, activityId, isRun }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Gagal ambil detail (HTTP ${res.status})`);
  return data; // { calories, laps, accessToken, refreshToken }
}

function secsToPace(distanceM, movingTimeS) {
  if (!distanceM || !movingTimeS) return null;
  const secPerKm = movingTimeS / (distanceM / 1000);
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}/km`;
}

function mapStravaActivity(raw) {
  const localDate = (raw.start_date_local || raw.start_date || "").slice(0, 10);
  return {
    id: raw.id,
    date: localDate,
    type: raw.type === "Run" ? "Run" : raw.type,
    name: raw.name,
    distance_km: raw.distance ? Math.round((raw.distance / 1000) * 10) / 10 : 0,
    moving_time_min: raw.moving_time ? Math.round((raw.moving_time / 60) * 10) / 10 : 0,
    avg_pace: raw.type === "Run" ? secsToPace(raw.distance, raw.moving_time) : null,
    avg_hr: raw.average_heartrate ? Math.round(raw.average_heartrate) : null,
    max_hr: raw.max_heartrate || null,
    avg_cadence: raw.average_cadence ? Math.round(raw.average_cadence * (raw.type === "Run" ? 2 : 1)) : null,
    elevation_gain_m: raw.total_elevation_gain ? Math.round(raw.total_elevation_gain) : 0,
    calories: null, // di-lazy-load saat modal dibuka
    laps: null, // di-lazy-load saat modal dibuka
  };
}

function buildAnalysis(dayData, actual) {
  const isRestType = dayData.type === "REST" || dayData.type === "REST + Prep";
  if (isRestType) {
    return `Ada aktivitas "${actual.name}" tercatat di hari REST. Kalau ini strength/cross-training ringan, bagus untuk recovery aktif — kalau lari intens, sebaiknya jaga hari rest tetap rest.`;
  }
  if (actual.distance_km === 0) {
    return `Sesi "${actual.name}" (${Math.round(actual.moving_time_min)} menit, ${actual.calories || "?"} kkal) tercatat di hari ini.`;
  }
  const plannedKm = dayData.km || 0;
  const diffPct = plannedKm > 0 ? ((actual.distance_km - plannedKm) / plannedKm) * 100 : 0;
  let verdict;
  if (plannedKm > 0 && diffPct <= -20) verdict = `Jarak ${diffPct.toFixed(0)}% di bawah target ${plannedKm}km — pertimbangkan menambah easy run ringan berikutnya.`;
  else if (plannedKm > 0 && diffPct >= 20) verdict = `Jarak ${diffPct.toFixed(0)}% di atas target ${plannedKm}km — jaga sesi berikutnya tetap ringan.`;
  else if (plannedKm > 0) verdict = `Jarak sesuai target (${actual.distance_km}km vs ${plannedKm}km).`;
  else verdict = `Tercatat ${actual.distance_km}km.`;
  return `${verdict} Pace rata² ${actual.avg_pace || "—"}, HR rata² ${actual.avg_hr || "—"} bpm.`;
}

function fmtSyncTime(iso) {
  if (!iso) return "belum pernah";
  return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function compareAndSuggest(dayData, actual, isFuture) {
  const isRestType = dayData.type === "REST" || dayData.type === "REST + Prep";

  if (isRestType) {
    if (actual) {
      return { status: "info", note: "Ada aktivitas Strava tercatat di hari REST. Pastikan tetap ringan dan tidak mengganggu pemulihan." };
    }
    return null;
  }

  if (isFuture) return null;

  if (!actual) {
    return { status: "missed", note: "Belum ada aktivitas Strava tercatat untuk sesi ini. Kalau sudah lari, tunggu sinkronisasi berikutnya — kalau terlewat, coba geser easy run ke hari lain agar volume minggu ini tetap tercapai." };
  }

  const plannedKm = dayData.km || 0;
  const actualKm = actual.distance_km || 0;
  const diffPct = plannedKm > 0 ? ((actualKm - plannedKm) / plannedKm) * 100 : 0;

  if (plannedKm > 0 && diffPct <= -25) {
    return { status: "short", note: `Jarak aktual ${actualKm}km cukup jauh di bawah target ${plannedKm}km (${diffPct.toFixed(0)}%). Kalau badan masih fit, tambah easy run ringan di hari berikutnya supaya volume minggu ini tetap terkejar.` };
  }
  if (plannedKm > 0 && diffPct >= 25) {
    return { status: "over", note: `Jarak aktual ${actualKm}km melebihi target ${plannedKm}km (+${diffPct.toFixed(0)}%). Bagus, tapi jaga hari easy/rest berikutnya benar-benar ringan supaya tidak overtraining.` };
  }
  if (plannedKm > 0) {
    return { status: "ontrack", note: `Sesuai target: ${actualKm}km tercatat vs ${plannedKm}km rencana. Lanjutkan progresi sesuai plan.` };
  }
  return { status: "info", note: `Aktivitas tercatat: ${actualKm}km.` };
}

const PHASE_META = {
  Base:      { color: "#4ade80", bg: "#052e16", border: "#166534", label: "BASE" },
  Build:     { color: "#facc15", bg: "#1c1400", border: "#854d0e", label: "BUILD" },
  Peak:      { color: "#f97316", bg: "#1c0a00", border: "#9a3412", label: "PEAK" },
  Taper:     { color: "#a78bfa", bg: "#1e0040", border: "#5b21b6", label: "TAPER" },
  "Race Week":{ color: "#f43f5e", bg: "#1f0010", border: "#9f1239", label: "RACE WEEK" },
};

const TYPE_META = {
  "Easy":                { color: "#22d3ee", icon: "🟦" },
  "Easy + Strides":      { color: "#38bdf8", icon: "🟦" },
  "Tempo":               { color: "#facc15", icon: "🟨" },
  "Race Pace Run":       { color: "#f97316", icon: "🟧" },
  "Race Simulation":     { color: "#f97316", icon: "🟧" },
  "Strength + Easy Run": { color: "#a78bfa", icon: "🟪" },
  "Strength (light) + Easy Run": { color: "#c4b5fd", icon: "🟪" },
  "Long Run":            { color: "#4ade80", icon: "🟩" },
  "Long Run ⭐":         { color: "#86efac", icon: "⭐" },
  "Strides + Easy":      { color: "#38bdf8", icon: "🟦" },
  "REST + Prep":         { color: "#475569", icon: "🔘" },
  "🏁 RACE DAY":         { color: "#f43f5e", icon: "🏁" },
  "REST":                { color: "#334155", icon: "🔘" },
};

const DAY_LABELS = { mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT", sun: "SUN" };

const plan = [
  { week: 1, phase: "Base", totalKm: 40, dateRange: "22 Jun – 28 Jun", weeklyFocus: "Re-establish rhythm",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest day. Walk, stretch, foam roll.", rpe: "—", date: "22 Jun" },
      tue: { type: "Easy", km: 7, pace: "6:50–7:10", hr: "139–152", detail: "Easy aerobic run. Conversational pace. Focus on form.", rpe: "4/10", date: "23 Jun" },
      wed: { type: "Easy", km: 8, pace: "6:50–7:10", hr: "139–152", detail: "Easy run. Keep HR in Z2. No pushing today.", rpe: "4/10", date: "24 Jun" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest day. Active recovery: 20–30 min walk optional.", rpe: "—", date: "25 Jun" },
      fri: { type: "Easy", km: 7, pace: "6:45–7:00", hr: "139–155", detail: "Easy run. Slightly fresher legs after Thu rest.", rpe: "4/10", date: "26 Jun" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:15", hr: "139–150", detail: "Strength 45min → Easy 5km shakeout.", strength: "Lower body + core: 3×12 squats, 3×10 lunges/leg, 3×12 hip thrust, 3×15 calf raise, 3×30s plank", rpe: "5/10", date: "27 Jun" },
      sun: { type: "Long Run", km: 13, pace: "7:00–7:15", hr: "142–155", detail: "Steady long run. All Z2. Hydrate every 20–25 min. Fuel after 60 min.", rpe: "5/10", date: "28 Jun" },
    }},
  { week: 2, phase: "Base", totalKm: 43, dateRange: "29 Jun – 5 Jul", weeklyFocus: "First tempo session",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest day. Reflect on Week 1. Sleep well.", rpe: "—", date: "29 Jun" },
      tue: { type: "Easy", km: 7, pace: "6:50–7:10", hr: "139–152", detail: "Easy Z2 run. Warm up 1km, easy 6km, cool down 1km.", rpe: "4/10", date: "30 Jun" },
      wed: { type: "Tempo", km: 9, pace: "6:50 easy / 5:55–6:10 tempo", hr: "139–152 / 162–170", detail: "Warm up 2km easy → 5km tempo @ 5:55–6:10/km → cool down 2km. First quality session!", rpe: "7/10", date: "1 Jul" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest day. Stretch hip flexors & calves after tempo.", rpe: "—", date: "2 Jul" },
      fri: { type: "Easy", km: 7, pace: "6:50–7:10", hr: "139–152", detail: "Recovery run after tempo. Keep HR under 152. Slow is fine.", rpe: "3/10", date: "3 Jul" },
      sat: { type: "Strength + Easy Run", km: 6, pace: "7:00–7:15", hr: "139–150", detail: "Strength 45min → Easy 6km shakeout.", strength: "Lower body + core: 3×12 squats, 3×12 RDL, 3×10 step-up, 3×12 glute bridge, 2×45s plank", rpe: "5/10", date: "4 Jul" },
      sun: { type: "Long Run", km: 14, pace: "7:00–7:15", hr: "142–155", detail: "Steady long run. All Z2. If legs feel heavy from strength, slow down to 7:15–7:30.", rpe: "5/10", date: "5 Jul" },
    }},
  { week: 3, phase: "Base", totalKm: 46, dateRange: "6 Jul – 12 Jul", weeklyFocus: "Build long run",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest day. Hydrate well, prep nutrition for the week.", rpe: "—", date: "6 Jul" },
      tue: { type: "Easy", km: 8, pace: "6:45–7:05", hr: "139–152", detail: "Easy Z2. Can include 4×20s strides at the end (relax, not sprint).", rpe: "4/10", date: "7 Jul" },
      wed: { type: "Tempo", km: 10, pace: "6:50 easy / 5:55–6:05 tempo", hr: "139–152 / 162–170", detail: "Warm up 2km → 6km tempo → cool down 2km. Add 1km vs last week.", rpe: "7/10", date: "8 Jul" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Focus on sleep. 16km this Sunday!", rpe: "—", date: "9 Jul" },
      fri: { type: "Easy", km: 7, pace: "6:50–7:10", hr: "139–152", detail: "Easy recovery run. Shake out legs before big weekend.", rpe: "3/10", date: "10 Jul" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:15", hr: "139–150", detail: "Strength 50min → Easy 5km.", strength: "Upper body + core: 3×10 push-up, 3×12 dumbbell row, 3×10 shoulder press, 3×15 dead bug, 3×20 bird dog", rpe: "5/10", date: "11 Jul" },
      sun: { type: "Long Run", km: 16, pace: "7:00–7:20", hr: "142–155", detail: "16km — milestone run! Split: 8km easy, 6km steady, 2km easy cool-down. Take gel at 50 min.", rpe: "6/10", date: "12 Jul" },
    }},
  { week: 4, phase: "Base", totalKm: 32, dateRange: "13 Jul – 19 Jul", weeklyFocus: "⬇️ Cutback — recover & adapt",
    cutback: true,
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Recovery week — be proud of 3 strong base weeks!", rpe: "—", date: "13 Jul" },
      tue: { type: "Easy", km: 6, pace: "7:00–7:15", hr: "139–150", detail: "Easy 6km. No tempo this week. Body needs adaptation time.", rpe: "3/10", date: "14 Jul" },
      wed: { type: "Easy", km: 7, pace: "7:00–7:15", hr: "139–150", detail: "Easy 7km. Keep relaxed. Optional strides: 4×20s at the end.", rpe: "4/10", date: "15 Jul" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Extra sleep if possible.", rpe: "—", date: "16 Jul" },
      fri: { type: "Easy", km: 6, pace: "7:00–7:15", hr: "139–150", detail: "Easy 6km. Focus on breathing quality and cadence (aim 87–92 spm).", rpe: "3/10", date: "17 Jul" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:20", hr: "139–148", detail: "Strength 40min (lighter) → Easy 5km.", strength: "Full body light: 2×12 squats, 2×10 lunges, 2×12 push-up, 2×10 dumbbell row, 3×30s plank, 3×15 glute bridge", rpe: "4/10", date: "18 Jul" },
      sun: { type: "Long Run", km: 12, pace: "7:00–7:20", hr: "142–152", detail: "Easy 12km long run. All conversational. This is active recovery.", rpe: "4/10", date: "19 Jul" },
    }},
  { week: 5, phase: "Build", totalKm: 47, dateRange: "20 Jul – 26 Jul", weeklyFocus: "Introduce race pace",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Build phase begins — mentally prepare for harder sessions.", rpe: "—", date: "20 Jul" },
      tue: { type: "Easy + Strides", km: 8, pace: "6:45–7:00 + strides", hr: "139–155", detail: "Easy 8km + 5×20s strides (run fast but relaxed, not sprinting). 90s walk recovery between strides.", rpe: "5/10", date: "21 Jul" },
      wed: { type: "Race Pace Run", km: 10, pace: "6:50 easy / 6:20–6:30 race pace", hr: "155–168", detail: "Warm up 2km → 6km @ goal HM pace (6:20–6:30/km) → cool down 2km. First race-pace work!", rpe: "7/10", date: "22 Jul" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Legs needed after race-pace session.", rpe: "—", date: "23 Jul" },
      fri: { type: "Easy", km: 8, pace: "6:50–7:10", hr: "139–152", detail: "Easy recovery run. Must feel easy after Wed effort.", rpe: "3/10", date: "24 Jul" },
      sat: { type: "Strength + Easy Run", km: 6, pace: "7:00–7:15", hr: "139–152", detail: "Strength 50min → Easy 6km.", strength: "Lower body power: 3×10 Bulgarian split squat, 3×12 hip thrust, 3×15 calf raise, 3×10 lateral band walk, 3×30s side plank", rpe: "6/10", date: "25 Jul" },
      sun: { type: "Long Run", km: 17, pace: "7:00–7:20", hr: "142–155", detail: "17km. First 12km easy, last 5km steady (6:45/km). Practice fueling: water + gel at 45 min & 80 min.", rpe: "6/10", date: "26 Jul" },
    }},
  { week: 6, phase: "Build", totalKm: 49, dateRange: "27 Jul – 2 Agu", weeklyFocus: "Extended race-pace work",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. You're over halfway to race day!", rpe: "—", date: "27 Jul" },
      tue: { type: "Easy", km: 8, pace: "6:45–7:05", hr: "139–152", detail: "Easy 8km. Include 4×20s strides at the end.", rpe: "4/10", date: "28 Jul" },
      wed: { type: "Tempo", km: 11, pace: "6:50 easy / 5:50–6:00 tempo", hr: "139–152 / 162–172", detail: "Warm up 2km → 7km tempo → cool down 2km. Your longest tempo block yet.", rpe: "7/10", date: "29 Jul" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Big long run this Sunday — prepare mentally.", rpe: "—", date: "30 Jul" },
      fri: { type: "Easy", km: 7, pace: "7:00–7:15", hr: "139–150", detail: "Easy 7km. Recovery run. Let legs flush out from Wednesday.", rpe: "3/10", date: "31 Jul" },
      sat: { type: "Strength + Easy Run", km: 6, pace: "7:00–7:15", hr: "139–152", detail: "Strength 50min → Easy 6km.", strength: "Upper body + core: 3×10 push-up/dips, 3×12 DB row, 3×10 overhead press, 4×45s plank, 3×20 Russian twist", rpe: "5/10", date: "1 Agu" },
      sun: { type: "Long Run", km: 18, pace: "7:00–7:15", hr: "142–155", detail: "18km milestone! Steady effort throughout. Fuel at 45 & 80 min. Last 3km can pick up to 6:40/km.", rpe: "6/10", date: "2 Agu" },
    }},
  { week: 7, phase: "Build", totalKm: 52, dateRange: "3 Agu – 9 Agu", weeklyFocus: "🔥 Biggest training week",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. This is peak Build week — fuel up and sleep well.", rpe: "—", date: "3 Agu" },
      tue: { type: "Easy + Strides", km: 8, pace: "6:45–7:00", hr: "139–155", detail: "Easy 8km + 6×20s strides. Legs should feel springy — this is peak week.", rpe: "5/10", date: "4 Agu" },
      wed: { type: "Race Pace Run", km: 12, pace: "6:50 easy / 6:20–6:30 race pace", hr: "155–168", detail: "Warm up 2km → 8km @ goal HM race pace (6:20–6:30) → cool down 2km. Biggest race pace block.", rpe: "8/10", date: "5 Agu" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Crucial recovery before 19km this Sunday.", rpe: "—", date: "6 Agu" },
      fri: { type: "Easy", km: 8, pace: "6:50–7:10", hr: "139–152", detail: "Easy 8km. You earned this easy day. Keep HR under 152.", rpe: "3/10", date: "7 Agu" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:20", hr: "139–148", detail: "Strength 50min → Easy 5km (keep short, saving legs for Sunday).", strength: "Full body: 3×10 squat, 3×10 RDL, 3×10 push-up, 3×12 row, 3×15 hip thrust, 4×30s plank", rpe: "5/10", date: "8 Agu" },
      sun: { type: "Long Run", km: 19, pace: "7:00–7:15", hr: "142–155", detail: "19km — your build peak long run! Fuel strategy: water every 20 min, gel at 45 & 85 min. You got this.", rpe: "7/10", date: "9 Agu" },
    }},
  { week: 8, phase: "Build", totalKm: 36, dateRange: "10 Agu – 16 Agu", weeklyFocus: "⬇️ Cutback — 2nd recovery week",
    cutback: true,
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Week 7 was massive — celebrate and recover.", rpe: "—", date: "10 Agu" },
      tue: { type: "Easy", km: 7, pace: "7:00–7:15", hr: "139–150", detail: "Easy 7km. Flush out fatigue from peak week. Slow is good.", rpe: "3/10", date: "11 Agu" },
      wed: { type: "Easy + Strides", km: 8, pace: "6:50–7:05", hr: "139–152", detail: "Easy 8km + 4×20s strides. Keep strides controlled.", rpe: "4/10", date: "12 Agu" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Let body absorb 7 weeks of training.", rpe: "—", date: "13 Agu" },
      fri: { type: "Easy", km: 6, pace: "7:00–7:15", hr: "139–150", detail: "Easy 6km. Very easy. Let body fully absorb the training block.", rpe: "3/10", date: "14 Agu" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:20", hr: "139–148", detail: "Strength 40min (moderate) → Easy 5km.", strength: "Maintenance: 2×12 squat, 2×10 lunge, 2×12 hip thrust, 3×12 push-up, 3×30s plank, 3×10 row", rpe: "4/10", date: "15 Agu" },
      sun: { type: "Long Run", km: 14, pace: "7:00–7:20", hr: "142–152", detail: "Relaxed 14km. All easy. No pressure. You're in the best shape of your life heading into Peak phase.", rpe: "5/10", date: "16 Agu" },
    }},
  { week: 9, phase: "Peak", totalKm: 52, dateRange: "17 Agu – 23 Agu", weeklyFocus: "🏆 Peak: 20km long run",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. PEAK PHASE starts. This is the hardest 3 weeks — give everything.", rpe: "—", date: "17 Agu" },
      tue: { type: "Easy + Strides", km: 8, pace: "6:45–7:00", hr: "139–155", detail: "Easy 8km + 6×20s strides. Building race sharpness.", rpe: "5/10", date: "18 Agu" },
      wed: { type: "Tempo", km: 12, pace: "6:50 easy / 5:50–6:00 tempo", hr: "139–152 / 162–172", detail: "Warm up 2km → 8km tempo → cool down 2km. Strongest tempo effort of the entire plan.", rpe: "8/10", date: "19 Agu" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Big 20km this Sunday — your body needs this.", rpe: "—", date: "20 Agu" },
      fri: { type: "Easy", km: 8, pace: "6:50–7:10", hr: "139–152", detail: "Easy 8km. Full recovery from Wednesday. Stay patient.", rpe: "3/10", date: "21 Agu" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:20", hr: "139–148", detail: "Strength 45min → Easy 5km (short to save legs for Sunday!).", strength: "Lower body focus: 3×10 Bulgarian squat, 3×12 hip thrust, 3×15 calf raise, 3×20 glute bridge, 3×30s plank", rpe: "5/10", date: "22 Agu" },
      sun: { type: "Long Run ⭐", km: 20, pace: "7:00–7:20", hr: "142–155", detail: "20km — PEAK LONG RUN ⭐ You've never run this far. This is your confidence maker. Fuel every 40 min. Run by feel, not pace. Celebrate hard after!", rpe: "7/10", date: "23 Agu" },
    }},
  { week: 10, phase: "Peak", totalKm: 50, dateRange: "24 Agu – 30 Agu", weeklyFocus: "Race simulation + confidence",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Recovery after 20km. Pride yourself on what you've built.", rpe: "—", date: "24 Agu" },
      tue: { type: "Easy", km: 8, pace: "6:50–7:10", hr: "139–152", detail: "Easy 8km recovery after 20km Sunday. Legs may feel heavy — that's fine.", rpe: "3/10", date: "25 Agu" },
      wed: { type: "Race Simulation", km: 13, pace: "6:50 easy / 6:20–6:30 race pace", hr: "155–170", detail: "Warm up 2km → 9km @ HM race pace (6:20–6:30/km) → cool down 2km. Rehearse race-day mindset. 5 weeks to go!", rpe: "8/10", date: "26 Agu" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Crucial after race simulation.", rpe: "—", date: "27 Agu" },
      fri: { type: "Easy + Strides", km: 7, pace: "6:50–7:05", hr: "139–155", detail: "Easy 7km + 5×20s strides. Feel fast and light.", rpe: "4/10", date: "28 Agu" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:15", hr: "139–150", detail: "Strength 45min → Easy 5km.", strength: "Full body: 3×10 squat, 3×10 push-up, 3×12 row, 3×12 hip thrust, 4×40s plank, 3×10 single-leg deadlift", rpe: "5/10", date: "29 Agu" },
      sun: { type: "Long Run", km: 18, pace: "7:00–7:15", hr: "142–155", detail: "18km. First 14km easy, last 4km @ 6:30/km. Practice your race-day breakfast & fueling protocol.", rpe: "6/10", date: "30 Agu" },
    }},
  { week: 11, phase: "Peak", totalKm: 44, dateRange: "31 Agu – 6 Sep", weeklyFocus: "Last hard week → taper begins",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Final hard week. After Sunday — taper begins!", rpe: "—", date: "31 Agu" },
      tue: { type: "Easy + Strides", km: 8, pace: "6:45–7:00", hr: "139–155", detail: "Easy 8km + 6×20s strides. Feel strong and sharp.", rpe: "5/10", date: "1 Sep" },
      wed: { type: "Tempo", km: 10, pace: "6:50 easy / 5:50–6:05 tempo", hr: "139–152 / 162–172", detail: "Warm up 2km → 6km tempo → cool down 2km. Last hard tempo of the entire cycle.", rpe: "7/10", date: "2 Sep" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Only 3.5 weeks to Solo Run Fest!", rpe: "—", date: "3 Sep" },
      fri: { type: "Easy", km: 7, pace: "6:50–7:10", hr: "139–152", detail: "Easy 7km. Last 'normal' easy run before taper begins.", rpe: "3/10", date: "4 Sep" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:15", hr: "139–150", detail: "Strength 40min (start reducing load) → Easy 5km.", strength: "Maintenance: 2×12 squat, 2×10 lunge, 2×10 push-up, 2×10 row, 3×30s plank, 3×12 hip thrust. REDUCE WEIGHT by 20%.", rpe: "4/10", date: "5 Sep" },
      sun: { type: "Long Run", km: 16, pace: "7:00–7:15", hr: "142–155", detail: "16km easy. Last long run of the cycle. CELEBRATE — the hard work is done!", rpe: "6/10", date: "6 Sep" },
    }},
  { week: 12, phase: "Taper", totalKm: 35, dateRange: "7 Sep – 13 Sep", weeklyFocus: "⬇️ Taper begins — feel antsy, trust it",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. TAPER BEGINS. You may feel restless — totally normal!", rpe: "—", date: "7 Sep" },
      tue: { type: "Easy", km: 7, pace: "6:50–7:05", hr: "139–152", detail: "Easy 7km. You may feel sluggish or flat — totally normal during taper. Trust the process.", rpe: "3/10", date: "8 Sep" },
      wed: { type: "Race Pace Run", km: 8, pace: "6:50 easy / 6:20–6:30 race pace", hr: "155–168", detail: "Warm up 2km → 4km @ race pace → cool down 2km. Short quality to stay sharp.", rpe: "6/10", date: "9 Sep" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Taper madness is real — don't add extra runs!", rpe: "—", date: "10 Sep" },
      fri: { type: "Easy + Strides", km: 6, pace: "6:50–7:05", hr: "139–152", detail: "Easy 6km + 4×20s strides. Light and breezy.", rpe: "3/10", date: "11 Sep" },
      sat: { type: "Strength + Easy Run", km: 5, pace: "7:00–7:15", hr: "139–150", detail: "Strength 30min (light — maintenance only) → Easy 5km.", strength: "Light maintenance: 2×10 squat, 2×10 lunge, 2×10 push-up, 2×10 row, 2×30s plank. NO heavy lifting now!", rpe: "3/10", date: "12 Sep" },
      sun: { type: "Long Run", km: 13, pace: "7:00–7:20", hr: "142–152", detail: "13km easy. Just keep the legs moving. No pressure. Practice race-day nutrition one more time.", rpe: "4/10", date: "13 Sep" },
    }},
  { week: 13, phase: "Taper", totalKm: 28, dateRange: "14 Sep – 20 Sep", weeklyFocus: "Stay sharp, reduce volume",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Race is 2 weeks away. Stay calm.", rpe: "—", date: "14 Sep" },
      tue: { type: "Easy", km: 6, pace: "6:45–7:00", hr: "139–152", detail: "Easy 6km. Feel crisp. Your aerobic fitness is at its absolute peak right now.", rpe: "3/10", date: "15 Sep" },
      wed: { type: "Race Pace Run", km: 7, pace: "6:50 easy / 6:20–6:25 race pace", hr: "155–168", detail: "Warm up 2km → 3km @ race pace → cool down 2km. Short, controlled, confident.", rpe: "6/10", date: "16 Sep" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. 11 days to race day.", rpe: "—", date: "17 Sep" },
      fri: { type: "Easy + Strides", km: 5, pace: "6:50–7:05", hr: "139–150", detail: "Easy 5km + 4×20s strides. Legs should feel springy and fresh!", rpe: "3/10", date: "18 Sep" },
      sat: { type: "Strength (light) + Easy Run", km: 4, pace: "7:00–7:15", hr: "139–148", detail: "Strength 20min (very light, mobility focused) → Easy 4km.", strength: "Mobility & activation ONLY: 2×10 bodyweight squat, 2×10 glute bridge, 2×10 clamshell, 3×30s plank, 10 min hip flexor stretch. NO weights.", rpe: "2/10", date: "19 Sep" },
      sun: { type: "Long Run", km: 10, pace: "7:00–7:15", hr: "142–152", detail: "10km easy. Final long run. Don't push. Trust your body. Race is 7 days away!", rpe: "4/10", date: "20 Sep" },
    }},
  { week: 14, phase: "Race Week", totalKm: 34.1, dateRange: "21 Sep – 27 Sep", weeklyFocus: "🏁 Race week — trust the work, execute the plan",
    days: {
      mon: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. RACE WEEK. Do nothing extra. Sleep, hydrate, relax.", rpe: "—", date: "21 Sep" },
      tue: { type: "Easy", km: 5, pace: "6:45–7:00", hr: "139–150", detail: "Easy 5km shakeout. Feel the freshness. Short and sweet.", rpe: "2/10", date: "22 Sep" },
      wed: { type: "Strides + Easy", km: 5, pace: "7:00 easy + strides", hr: "139–155", detail: "Easy 4km + 4×20s relaxed strides. Keep legs awake without tiring them.", rpe: "3/10", date: "23 Sep" },
      thu: { type: "REST", km: 0, pace: "—", hr: "—", detail: "Rest. Carb-load starts today — extra rice & pasta. Hydrate.", rpe: "—", date: "24 Sep" },
      fri: { type: "Easy", km: 3, pace: "7:00–7:15", hr: "139–148", detail: "3km very easy jog. Just to move the legs. LAY OUT RACE KIT TONIGHT.", rpe: "2/10", date: "25 Sep" },
      sat: { type: "REST + Prep", km: 0, pace: "—", hr: "—", detail: "Full rest. Carb-load: rice, banana, toast all day. Hydrate 3L. Prepare race kit, bib, shoes, gels. Sleep by 9:30pm. Wake up 4:00am.", rpe: "—", date: "26 Sep" },
      sun: { type: "🏁 RACE DAY", km: 21.1, pace: "6:20–6:30 target", hr: "162–175", detail: "SOLO RUN FEST HALF MARATHON 🏁\n\n⏰ 4:00am Wake up\n🍌 4:30am Breakfast: rice/banana/toast + water\n🏟️ 5:30am Arrive venue, collect bib\n🔥 6:00am Warm up: 10min easy jog + 4×20s strides\n🚀 6:30am GUN START\n\nRace strategy:\n• Km 0–3: 6:30–6:35/km (conservative start!)\n• Km 3–10: 6:20–6:25/km (find your rhythm)\n• Km 10–18: 6:20–6:25/km (stay strong)\n• Km 18–21.1: EVERYTHING YOU HAVE LEFT\n\nFuel: gel at 5km & 13km. Water at every station.\n\nYOU'VE DONE THE WORK. TRUST IT. GO!", rpe: "9/10", date: "27 Sep" },
    }},
];

const dayOrder = ["mon","tue","wed","thu","fri","sat","sun"];

function RPEBar({ rpe }) {
  if (rpe === "—") return null;
  const val = parseFloat(rpe);
  const color = val <= 4 ? "#22d3ee" : val <= 6 ? "#4ade80" : val <= 7 ? "#facc15" : val <= 8 ? "#f97316" : "#f43f5e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
      <span style={{ fontSize: 10, color: "#475569", minWidth: 24 }}>RPE</span>
      <div style={{ flex: 1, height: 4, background: "#1e293b", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${val * 10}%`, background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 10, color, fontWeight: 700, minWidth: 24 }}>{rpe}</span>
    </div>
  );
}

const SUGGESTION_META = {
  missed: { color: "#f59e0b", icon: "⚠️", label: "BELUM ADA DATA" },
  short:  { color: "#facc15", icon: "📉", label: "DI BAWAH TARGET" },
  over:   { color: "#f97316", icon: "📈", label: "MELEBIHI TARGET" },
  ontrack:{ color: "#4ade80", icon: "✅", label: "SESUAI TARGET" },
  info:   { color: "#38bdf8", icon: "ℹ️", label: "INFO" },
};

function StravaDetailModal({ date, dayData, actual, onClose, refreshToken, onTokenRotated }) {
  const [liveDetail, setLiveDetail] = useState(null); // { calories, laps }
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!actual) return;
    const needsDetail = actual.id && !actual.calories && !actual.laps;
    if (!needsDetail || !refreshToken) return;
    let cancelled = false;
    setLoadingDetail(true);
    (async () => {
      try {
        const data = await apiDetail(refreshToken, actual.id, actual.type === "Run");
        if (cancelled) return;
        const laps = (data.laps || []).map((l, i) => ({
          km: i + 1,
          pace: secsToPace(l.distance, l.moving_time) || "—",
          hr: l.average_heartrate ? Math.round(l.average_heartrate) : "—",
        }));
        setLiveDetail({ calories: data.calories, laps });
        if (data.refreshToken && onTokenRotated) onTokenRotated(data.refreshToken);
      } catch (e) {
        // silently ignore — stat grid still shows summary data
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [actual, refreshToken]);

  if (!actual) return null;
  const calories = actual.calories || (liveDetail && liveDetail.calories);
  const laps = actual.laps || (liveDetail && liveDetail.laps) || [];
  const analysisText = actual.analysis || buildAnalysis(dayData, actual);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#00000099", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#0d1117", border: "1px solid #fc4c0255", borderRadius: 10,
          maxWidth: 480, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: "#fc4c02", fontWeight: 700, letterSpacing: 1 }}>⚡ STRAVA · {actual.name}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginTop: 2 }}>{date} · {dayData.type}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        {/* Stat grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
          {[
            actual.distance_km > 0 ? ["Jarak", `${actual.distance_km} km`] : null,
            ["Durasi", `${Math.round(actual.moving_time_min)} min`],
            actual.avg_pace ? ["Pace rata²", actual.avg_pace] : null,
            actual.avg_hr ? ["HR rata²", `${actual.avg_hr} bpm`] : null,
            actual.max_hr ? ["HR maks", `${actual.max_hr} bpm`] : null,
            actual.avg_cadence ? ["Cadence", `${actual.avg_cadence} spm`] : null,
            actual.elevation_gain_m ? ["Elevasi", `${actual.elevation_gain_m} m`] : null,
            calories ? ["Kalori", `${calories} kkal`] : null,
            actual.best_5k ? ["Best 5K", actual.best_5k] : null,
          ].filter(Boolean).map(([label, val]) => (
            <div key={label} style={{ background: "#111827", borderRadius: 6, padding: "7px 8px" }}>
              <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, marginTop: 1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Laps */}
        {loadingDetail && laps.length === 0 && (
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 14 }}>Memuat split per km dari Strava…</div>
        )}
        {laps.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, letterSpacing: 1, marginBottom: 6 }}>SPLIT PER KM</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {laps.map((lap, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, padding: "3px 6px", background: i % 2 ? "#0f172a" : "transparent", borderRadius: 4 }}>
                  <span style={{ color: "#64748b", minWidth: 34 }}>Km {lap.km}</span>
                  <span style={{ color: "#e2e8f0", fontWeight: 700, minWidth: 60 }}>{lap.pace}</span>
                  <span style={{ color: "#f87171", minWidth: 70 }}>❤️ {lap.hr} bpm</span>
                  {lap.note && <span style={{ color: "#fbbf24", fontSize: 10 }}>· {lap.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {actual.extraNote && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10, fontStyle: "italic" }}>ℹ️ {actual.extraNote}</div>
        )}

        {/* Analysis */}
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 6, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, letterSpacing: 1, marginBottom: 5 }}>🏃 ANALISA COACH</div>
          <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>{analysisText}</div>
        </div>
      </div>
    </div>
  );
}

function ConnectModal({ onClose, onConnect, error, connecting }) {
  const [clientId, setClientId] = useState(null);
  const [configError, setConfigError] = useState(null);

  useEffect(() => {
    apiFetchConfig()
      .then(cfg => {
        if (!cfg.clientId) setConfigError("STRAVA_CLIENT_ID belum di-set di Netlify environment variables.");
        else setClientId(cfg.clientId);
      })
      .catch(e => setConfigError(e.message));
  }, []);

  const redirectUri = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  const authorizeUrl = clientId ? buildStravaAuthorizeUrl(clientId, redirectUri) : null;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "#00000099", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #fc4c0255", borderRadius: 10, maxWidth: 440, width: "100%", maxHeight: "88vh", overflowY: "auto", padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>⚡ Hubungkan ke Strava</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {connecting ? (
          <div style={{ fontSize: 12, color: "#94a3b8", padding: "20px 0", textAlign: "center" }}>Menghubungkan ke Strava…</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6, marginBottom: 14 }}>
              Belum punya Strava API App? Buat dulu (gratis, sekali saja):
            </div>
            <ol style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.8, paddingLeft: 18, marginBottom: 14 }}>
              <li>Buka <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" style={{ color: "#fc4c02" }}>strava.com/settings/api</a> dan buat aplikasi baru.</li>
              <li>Isi "Authorization Callback Domain" dengan domain situs ini: <code style={{ background: "#111827", padding: "1px 4px", borderRadius: 3 }}>{typeof window !== "undefined" ? window.location.hostname : "domain-kamu.netlify.app"}</code></li>
              <li>Set <b>STRAVA_CLIENT_ID</b> dan <b>STRAVA_CLIENT_SECRET</b> di Netlify → Site settings → Environment variables (lihat README).</li>
            </ol>

            {configError && <div style={{ fontSize: 11, color: "#f87171", marginBottom: 12 }}>⚠️ {configError}</div>}
            {error && <div style={{ fontSize: 11, color: "#f87171", marginBottom: 12 }}>⚠️ {error}</div>}

            <a
              href={authorizeUrl || undefined}
              style={{
                display: "block", textAlign: "center", padding: "10px", borderRadius: 6,
                background: authorizeUrl ? "#fc4c02" : "#1e293b", color: authorizeUrl ? "#fff" : "#475569",
                fontWeight: 700, fontSize: 13, textDecoration: "none", pointerEvents: authorizeUrl ? "auto" : "none",
              }}
            >
              Connect with Strava ↗
            </a>
          </>
        )}

        <div style={{ fontSize: 10, color: "#475569", marginTop: 14, lineHeight: 1.5 }}>
          Client Secret kamu disimpan sebagai environment variable di server Netlify — tidak pernah dikirim ke browser.
        </div>
      </div>
    </div>
  );
}

function DayCard({ dayKey, dayData, phase, expanded, onToggle, actual, suggestion, isFuture, onShowDetail }) {
  const isRest = dayData.type === "REST" || dayData.type === "REST + Prep";
  const isRace = dayData.type === "🏁 RACE DAY";
  const typeMeta = TYPE_META[dayData.type] || { color: "#94a3b8", icon: "⬜" };
  const phaseMeta = PHASE_META[phase];

  return (
    <div
      onClick={() => onToggle()}
      style={{
        background: isRace ? "#1f0010" : isRest ? "#0d1117" : "#111827",
        border: `1px solid ${isRace ? "#9f1239" : expanded ? typeMeta.color + "66" : "#1e293b"}`,
        borderRadius: 8,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      {/* Day header */}
      <div style={{ padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 32 }}>
          <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: 1 }}>{DAY_LABELS[dayKey]}</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>{dayData.date}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isRace ? "#f43f5e" : isRest ? "#334155" : typeMeta.color }}>
              {dayData.type}
            </span>
            {dayData.km > 0 && (
              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 700 }}>{dayData.km} km</span>
            )}
            {actual && (
              <span
                onClick={e => { e.stopPropagation(); onShowDetail && onShowDetail(); }}
                style={{ fontSize: 10, color: "#fc4c02", fontWeight: 700, background: "#fc4c0222", border: "1px solid #fc4c0255", borderRadius: 4, padding: "1px 5px", cursor: "pointer" }}
              >
                ⚡ {actual.distance_km > 0 ? `${actual.distance_km}km` : `${Math.round(actual.moving_time_min)}min`} Strava · detail
              </span>
            )}
            {!actual && !isFuture && !isRest && (
              <span style={{ fontSize: 9, color: "#64748b", fontWeight: 600 }}>· belum ada data</span>
            )}
          </div>
          {!isRest && (
            <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>
              {dayData.pace !== "—" ? `⏱ ${dayData.pace}` : ""}
              {dayData.hr !== "—" ? ` · ❤️ ${dayData.hr}` : ""}
            </div>
          )}
          {isRest && <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>Recovery{actual ? ` · ⚡ ${actual.distance_km}km tercatat` : ""}</div>}
        </div>
        <div style={{ color: "#475569", fontSize: 10, flexShrink: 0 }}>{expanded ? "▲" : "▼"}</div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 12px 12px", borderTop: "1px solid #1e293b" }}>
          {!isRest && (
            <div style={{ paddingTop: 10, fontSize: 12, color: "#94a3b8", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {dayData.detail}
            </div>
          )}
          {dayData.strength && (
            <div style={{ marginTop: 8, background: "#1e0040", border: "1px solid #5b21b6", borderRadius: 5, padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>💪 STRENGTH</div>
              <div style={{ fontSize: 11, color: "#c4b5fd", lineHeight: 1.6 }}>{dayData.strength}</div>
            </div>
          )}
          {!isRest && <RPEBar rpe={dayData.rpe} />}

          {/* Rencana vs Aktual (Strava) */}
          {(actual || (!isFuture && !isRest)) && (
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={{ background: "#0f172a", borderRadius: 5, padding: "8px 10px" }}>
                <div style={{ fontSize: 9, color: "#475569", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>RENCANA</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{dayData.km > 0 ? `${dayData.km} km` : "—"}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{dayData.pace !== "—" ? dayData.pace : "—"}</div>
              </div>
              <div
                onClick={e => { actual && e.stopPropagation(); actual && onShowDetail && onShowDetail(); }}
                style={{ background: "#1f0f00", border: "1px solid #7c2d0011", borderRadius: 5, padding: "8px 10px", cursor: actual ? "pointer" : "default" }}
              >
                <div style={{ fontSize: 9, color: "#fc4c02", fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>⚡ AKTUAL (STRAVA)</div>
                {actual ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>
                      {actual.distance_km > 0 ? `${actual.distance_km} km` : (actual.name || actual.type)}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                      {actual.avg_pace ? `⏱ ${actual.avg_pace}` : ""}
                      {actual.avg_hr ? ` · ❤️ ${actual.avg_hr}` : ""}
                    </div>
                    {actual.moving_time_min && (
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{Math.round(actual.moving_time_min)} menit</div>
                    )}
                    <div style={{ fontSize: 9, color: "#fc4c02", marginTop: 4, fontWeight: 600 }}>Klik untuk data & analisa lengkap →</div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: "#64748b" }}>Belum ada data</div>
                )}
              </div>
            </div>
          )}

          {/* Suggestion */}
          {suggestion && (
            <div style={{
              marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start",
              background: SUGGESTION_META[suggestion.status].color + "14",
              border: `1px solid ${SUGGESTION_META[suggestion.status].color}44`,
              borderRadius: 5, padding: "8px 10px"
            }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{SUGGESTION_META[suggestion.status].icon}</span>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1, color: SUGGESTION_META[suggestion.status].color, marginBottom: 2 }}>
                  {SUGGESTION_META[suggestion.status].label}
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.5 }}>{suggestion.note}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [expandedWeek, setExpandedWeek] = useState(1);
  const [expandedDay, setExpandedDay] = useState(null);
  const [viewMode, setViewMode] = useState("plan"); // "plan" | "overview"

  const [stravaActivities, setStravaActivities] = useState(STRAVA_SEED_ACTIVITIES); // keyed by YYYY-MM-DD
  const [lastSync, setLastSync] = useState(STRAVA_SYNCED_AT_SEED);
  const [refreshToken, setRefreshToken] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // { date, dayData, actual }

  const persistRefreshToken = useCallback((token) => {
    setRefreshToken(token);
    try { localStorage.setItem("strava_refresh_token", token); } catch (e) {}
  }, []);

  const syncStrava = useCallback(async (tokenOverride) => {
    const tokenToUse = tokenOverride || refreshToken;
    if (!tokenToUse) {
      setShowConnectModal(true);
      return;
    }
    setSyncing(true);
    setSyncError(null);
    try {
      const programStartEpoch = Math.floor(new Date("2026-06-22T00:00:00").getTime() / 1000);
      const data = await apiSync(tokenToUse, programStartEpoch);
      persistRefreshToken(data.refreshToken);

      const byDate = {};
      (data.activities || []).forEach(a => {
        const mapped = mapStravaActivity(a);
        if (!mapped.date) return;
        const existing = byDate[mapped.date];
        if (!existing || (mapped.distance_km || 0) > (existing.distance_km || 0)) {
          byDate[mapped.date] = mapped;
        }
      });
      setStravaActivities(byDate);
      setLastSync(new Date().toISOString());
    } catch (e) {
      setSyncError(e.message || "Gagal sync ke Strava.");
    } finally {
      setSyncing(false);
    }
  }, [refreshToken, persistRefreshToken]);

  // On mount: load saved refresh token, OR handle ?code= redirect from Strava, then auto-sync
  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        setConnecting(true);
        setShowConnectModal(true);
        try {
          const data = await apiConnect(code);
          persistRefreshToken(data.refreshToken);
          // bersihkan ?code= dari URL
          window.history.replaceState({}, "", window.location.pathname);
          setShowConnectModal(false);
          await syncStrava(data.refreshToken);
        } catch (e) {
          setConnectError(e.message || "Gagal menghubungkan ke Strava.");
        } finally {
          setConnecting(false);
        }
        return;
      }

      const saved = localStorage.getItem("strava_refresh_token");
      if (saved) {
        setRefreshToken(saved);
        syncStrava(saved);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayISO = new Date().toISOString().slice(0, 10);

  const toggleDay = (weekNum, day) => {
    const key = `${weekNum}-${day}`;
    setExpandedDay(prev => prev === key ? null : key);
  };

  const totalKmAll = plan.reduce((s, w) => s + (w.totalKm || 0), 0);

  // Overview volume chart
  const maxKm = Math.max(...plan.map(w => w.totalKm));

  return (
    <div style={{ background: "#06090f", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(160deg, #0a0a1a 0%, #0d1b2a 50%, #0a1628 100%)", borderBottom: "1px solid #1e293b", padding: "24px 16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <span style={{ background: "#f43f5e", color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 2, padding: "2px 8px", borderRadius: 2 }}>SOLO RUN FEST</span>
            <span style={{ background: "#1e293b", color: "#64748b", fontSize: 10, fontWeight: 600, letterSpacing: 1, padding: "2px 8px", borderRadius: 2 }}>27 SEP 2026</span>
            <span style={{ background: "#1e293b", color: "#64748b", fontSize: 10, fontWeight: 600, letterSpacing: 1, padding: "2px 8px", borderRadius: 2 }}>HALF MARATHON</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 2px", letterSpacing: -0.5 }}>Training Calendar</h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 14px" }}>Fahreza Aji Pratama · 14 Weeks · {Math.round(totalKmAll)} km total</p>

          {/* Phase Legend */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {Object.entries(PHASE_META).map(([phase, meta]) => (
              <div key={phase} style={{ display: "flex", alignItems: "center", gap: 4, background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 4, padding: "2px 8px" }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: meta.color }} />
                <span style={{ fontSize: 10, color: meta.color, fontWeight: 700, letterSpacing: 0.5 }}>{meta.label}</span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[{ id: "plan", label: "📅 Week-by-Week" }, { id: "overview", label: "📊 Volume Overview" }].map(t => (
              <button key={t.id} onClick={() => setViewMode(t.id)} style={{
                padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: viewMode === t.id ? "#f43f5e" : "#1e293b",
                color: viewMode === t.id ? "#fff" : "#94a3b8",
              }}>{t.label}</button>
            ))}

            {/* Strava sync control */}
            <button
              onClick={() => syncStrava()}
              disabled={syncing}
              style={{
                padding: "7px 14px", borderRadius: 6, border: "1px solid #fc4c0255", cursor: syncing ? "default" : "pointer",
                fontSize: 12, fontWeight: 600, background: "#fc4c0218", color: "#fc4c02",
                display: "flex", alignItems: "center", gap: 6, opacity: syncing ? 0.7 : 1,
              }}
            >
              <span style={{ display: "inline-block", animation: syncing ? "spin 1s linear infinite" : "none" }}>⚡</span>
              {syncing ? "Syncing..." : refreshToken ? "Reload Strava" : "Hubungkan Strava"}
            </button>
            {refreshToken && (
              <button
                onClick={() => setShowConnectModal(true)}
                style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid #1e293b", cursor: "pointer", fontSize: 11, fontWeight: 600, background: "transparent", color: "#64748b" }}
              >
                ⚙️
              </button>
            )}
          </div>

          {/* Strava status line */}
          <div style={{ marginTop: 8, fontSize: 11, color: syncError ? "#f87171" : "#64748b" }}>
            {syncError
              ? `⚠️ ${syncError}`
              : !refreshToken
                ? "⚡ Belum terhubung ke Strava — klik \"Hubungkan Strava\" untuk setup sekali, setelah itu reload langsung otomatis."
                : `⚡ Strava sinkron terakhir: ${fmtSyncTime(lastSync)} · ${Object.keys(stravaActivities).length} aktivitas cocok dengan plan`}
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: "16px 12px" }}>

        {viewMode === "overview" && (
          <div>
            {/* Volume bars */}
            <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: "18px 16px", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Weekly Volume — All 14 Weeks</div>
              {plan.map(w => {
                const phaseMeta = PHASE_META[w.phase];
                const barWidth = (w.totalKm / maxKm) * 100;
                return (
                  <div key={w.week} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                    <div style={{ width: 40, fontSize: 10, color: "#475569", fontWeight: 700, flexShrink: 0 }}>W{w.week}</div>
                    <div style={{ flex: 1, height: 18, background: "#1e293b", borderRadius: 3, overflow: "hidden", position: "relative" }}>
                      <div style={{
                        height: "100%", width: `${barWidth}%`,
                        background: w.cutback ? "#374151" : phaseMeta.color,
                        borderRadius: 3, display: "flex", alignItems: "center", paddingLeft: 6, transition: "width 0.3s"
                      }}>
                        {w.totalKm >= 20 && <span style={{ fontSize: 9, color: "#000", fontWeight: 800 }}>{w.totalKm} km</span>}
                      </div>
                    </div>
                    <div style={{ width: 38, fontSize: 11, color: w.cutback ? "#4b5563" : phaseMeta.color, fontWeight: 700, textAlign: "right", flexShrink: 0 }}>
                      {w.totalKm} km
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Type legend */}
            <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 10, padding: "16px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Session Types Legend</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { type: "Easy / Easy + Strides", color: "#22d3ee", desc: "Z2 aerobic. Conversational." },
                  { type: "Tempo", color: "#facc15", desc: "Comfortably hard. 5:50–6:05/km." },
                  { type: "Race Pace Run", color: "#f97316", desc: "Goal HM pace. 6:20–6:30/km." },
                  { type: "Long Run", color: "#4ade80", desc: "Sunday staple. Easy Z2." },
                  { type: "Strength + Easy Run", color: "#a78bfa", desc: "Lifting + short shakeout." },
                  { type: "Race Simulation", color: "#f97316", desc: "Longest race-pace block." },
                ].map(i => (
                  <div key={i.type} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: i.color, flexShrink: 0, marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: i.color }}>{i.type}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{i.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Schedule summary */}
              <div style={{ marginTop: 14, padding: "10px 12px", background: "#0f172a", borderRadius: 6, fontSize: 12, color: "#94a3b8" }}>
                <div style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: 6 }}>Your Weekly Schedule</div>
                {[
                  { day: "Mon", label: "🔘 REST", color: "#334155" },
                  { day: "Tue", label: "🟦 Easy Run", color: "#22d3ee" },
                  { day: "Wed", label: "🟨 Quality (Tempo / Race Pace)", color: "#facc15" },
                  { day: "Thu", label: "🔘 REST", color: "#334155" },
                  { day: "Fri", label: "🟦 Easy Run", color: "#22d3ee" },
                  { day: "Sat", label: "🟪 Strength + Easy Run", color: "#a78bfa" },
                  { day: "Sun", label: "🟩 Long Run", color: "#4ade80" },
                ].map(d => (
                  <div key={d.day} style={{ display: "flex", gap: 10, marginBottom: 4 }}>
                    <span style={{ color: "#475569", minWidth: 28, fontWeight: 700 }}>{d.day}</span>
                    <span style={{ color: d.color }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === "plan" && plan.map(week => {
          const phaseMeta = PHASE_META[week.phase];
          const isOpen = expandedWeek === week.week;

          return (
            <div key={week.week} style={{
              border: `1px solid ${isOpen ? phaseMeta.border : "#1e293b"}`,
              borderRadius: 10, marginBottom: 10, overflow: "hidden",
              background: isOpen ? phaseMeta.bg : "#0d1117"
            }}>
              {/* Week header */}
              <button
                onClick={() => setExpandedWeek(isOpen ? null : week.week)}
                style={{ width: "100%", background: "none", border: "none", padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    background: phaseMeta.color + "22", border: `1px solid ${phaseMeta.color}`,
                    color: phaseMeta.color, fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
                    padding: "2px 7px", borderRadius: 3, flexShrink: 0
                  }}>
                    {phaseMeta.label}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>
                      Week {week.week}
                      {week.cutback && <span style={{ marginLeft: 6, fontSize: 10, color: "#6b7280", background: "#1f2937", padding: "1px 5px", borderRadius: 3 }}>CUTBACK</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{week.dateRange} · {week.weeklyFocus}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontWeight: 800, fontSize: 15, color: phaseMeta.color }}>{week.totalKm} km</span>
                  <span style={{ color: "#475569", fontSize: 11 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Week days */}
              {isOpen && (
                <div style={{ padding: "0 12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Week summary bar */}
                  <div style={{ background: "#0f172a", borderRadius: 5, padding: "8px 10px", marginBottom: 4, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {dayOrder.map(d => {
                      const dd = week.days[d];
                      if (!dd) return null;
                      const isRest = dd.type === "REST";
                      const tm = TYPE_META[dd.type] || { color: "#94a3b8" };
                      const hasActual = !!stravaActivities[planDateToISO(dd.date)];
                      return (
                        <div key={d} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: "#475569", fontWeight: 700 }}>{DAY_LABELS[d]}</div>
                          <div style={{ fontSize: 10, color: isRest ? "#334155" : tm.color, fontWeight: 600 }}>
                            {isRest ? "REST" : `${dd.km}k`}
                          </div>
                          <div style={{ height: 4, width: 4, borderRadius: 2, background: hasActual ? "#fc4c02" : "transparent", margin: "2px auto 0" }} />
                        </div>
                      );
                    })}
                  </div>

                  {dayOrder.map(d => {
                    const dd = week.days[d];
                    if (!dd) return null;
                    const key = `${week.week}-${d}`;
                    const dayISO = planDateToISO(dd.date);
                    const actual = stravaActivities[dayISO] || null;
                    const isFuture = dayISO > todayISO;
                    const suggestion = compareAndSuggest(dd, actual, isFuture);
                    return (
                      <DayCard
                        key={d}
                        dayKey={d}
                        dayData={dd}
                        phase={week.phase}
                        expanded={expandedDay === key}
                        onToggle={() => toggleDay(week.week, d)}
                        actual={actual}
                        suggestion={suggestion}
                        isFuture={isFuture}
                        onShowDetail={() => setDetailModal({ date: dd.date, dayData: dd, actual })}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {detailModal && (
        <StravaDetailModal
          date={detailModal.date}
          dayData={detailModal.dayData}
          actual={detailModal.actual}
          onClose={() => setDetailModal(null)}
          refreshToken={refreshToken}
          onTokenRotated={persistRefreshToken}
        />
      )}

      {showConnectModal && (
        <ConnectModal
          onClose={() => setShowConnectModal(false)}
          error={connectError}
          connecting={connecting}
        />
      )}
    </div>
  );
}
