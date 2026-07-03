// Public endpoint — hanya mengembalikan Client ID (Client ID memang publik di OAuth,
// bukan rahasia; yang rahasia adalah Client Secret, yang TIDAK PERNAH dikirim ke browser).
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: process.env.STRAVA_CLIENT_ID || "" }),
  };
};
