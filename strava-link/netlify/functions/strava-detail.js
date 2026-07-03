// Refresh token lalu ambil detail (kalori) + laps satu aktivitas — dipanggil sekali saat
// user membuka modal detail di kalender (lazy load).
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { refreshToken, activityId, isRun } = JSON.parse(event.body || "{}");
  if (!refreshToken || !activityId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Parameter tidak lengkap." }) };
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET belum di-set di Netlify environment variables." }) };
  }

  try {
    const tokenRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return { statusCode: tokenRes.status, body: JSON.stringify({ error: tokenData.message || "Gagal refresh token." }) };
    }
    const authHeader = { Authorization: `Bearer ${tokenData.access_token}` };

    const [detailRes, lapsRes] = await Promise.all([
      fetch(`https://www.strava.com/api/v3/activities/${activityId}`, { headers: authHeader }),
      isRun ? fetch(`https://www.strava.com/api/v3/activities/${activityId}/laps`, { headers: authHeader }) : Promise.resolve(null),
    ]);
    const detail = detailRes.ok ? await detailRes.json() : {};
    const laps = lapsRes && lapsRes.ok ? await lapsRes.json() : [];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calories: detail.calories || null,
        laps,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      }),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gagal menghubungi Strava: " + e.message }) };
  }
};
