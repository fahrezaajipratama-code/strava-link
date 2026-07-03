// Menukar authorization code (dari redirect Strava) menjadi access_token + refresh_token.
// Client Secret dibaca dari environment variable server-side — TIDAK PERNAH dikirim ke browser.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { code } = JSON.parse(event.body || "{}");
  if (!code) {
    return { statusCode: 400, body: JSON.stringify({ error: "Kode otorisasi tidak ditemukan." }) };
  }

  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: JSON.stringify({ error: "STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET belum di-set di Netlify environment variables." }) };
  }

  try {
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data.message || "Gagal menukar kode otorisasi." }) };
    }
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        athlete: data.athlete ? { firstname: data.athlete.firstname, lastname: data.athlete.lastname } : null,
      }),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: "Gagal menghubungi Strava: " + e.message }) };
  }
};
