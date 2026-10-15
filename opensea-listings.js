// Vercel serverless function. Keep OPENSEA_API_KEY in Vercel Environment Variables.
const WALLET_ADDRESS = '0x494d8866f098a363e4effdfef2f5e240730b4c2a';

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=240');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'OpenSea API key is not configured on the server.' });
  try {
    const url = new URL(`https://api.opensea.io/api/v2/account/${WALLET_ADDRESS}/listings`);
    url.searchParams.set('limit', '50');
    url.searchParams.set('sort_by', 'START_TIME');
    url.searchParams.set('sort_direction', 'desc');
    const upstream = await fetch(url.toString(), {
      headers: { 'accept': 'application/json', 'x-api-key': apiKey }
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      return res.status(status).json({ error: upstream.status === 429 ? 'OpenSea rate limit reached. Please wait a little before refreshing.' : `OpenSea API request failed (${upstream.status}).` });
    }
    const listings = Array.isArray(payload.listings) ? payload.listings.filter(x => x && x.status === 'ACTIVE') : [];
    return res.status(200).json({ listings, next: payload.next || null, fetchedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: 'Could not connect to OpenSea. Please try again later.' });
  }
};
