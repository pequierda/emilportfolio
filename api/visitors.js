module.exports = async function handler(req, res) {
  const { method } = req;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    console.log('Upstash not configured');
    res.status(200).json({ count: 0, warning: "Upstash not configured" });
    return;
  }

  try {
    if (method === 'GET') {
      // Get current visitor count
      const r = await fetch(`${baseUrl}/get/visitor_count`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await r.json();
      const raw = data.result;
      const count = raw === null ? 0 : Number(raw) || 0;
      res.status(200).json({ count });
      return;
    }

    if (method === 'POST') {
      // Increment visitor count
      const r = await fetch(`${baseUrl}/incrby/visitor_count/1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await r.json();
      const count = Number(data.result) || 0;
      res.status(200).json({ count });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error('Visitor count error:', err);
    res.status(500).json({ error: 'Server error', details: String(err) });
  }
};
