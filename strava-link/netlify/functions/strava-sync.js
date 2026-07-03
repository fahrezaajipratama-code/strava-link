// Refresh access token (pakai refresh_token yang sudah tersimpan di browser) lalu tarik daftar
// aktivitas dari Strava. Semua panggilan ke Strava terjadi di server (menghindari CORS) dan
// Client Secret tidak pernah diekspos ke browser.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { refreshToken, afterEpoch } = JSON.parse(event.body || "{}");
  if (!refreshToken) {
    return { statusCode: 400, body: JSON.stringify({ error: "Refresh token tidak ditemukan. Silakan connect ulang." }) };
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET belum di-set di Netlify environment variables." }) };
  }

  try {
    // 1. Refresh access token
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return { statusCode: tokenRes.status, body: JSON.stringify({ error: tokenData.message || "Gagal refresh token. Coba connect ulang." }) };
    }

    // 2. Fetch activities
    const after = afterEpoch || Math.floor(new Date("2026-06-22T00:00:00").getTime() / 1000);
    const actRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const activities = await actRes.json();
    if (!actRes.ok) {
      return { statusCode: actRes.status, body: JSON.stringify({ error: activities.message || "Gagal ambil aktivitas dari Strava." }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activities,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
      }),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gagal menghubungi Strava: " + e.message }) };
  }
};
