module.exports = async function handler(req, res) {
  const { method, query } = req;
  const project = (query.project || '').toString().toLowerCase();

  if (!project) {
    res.status(400).json({ error: 'Missing project parameter' });
    return;
  }

  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) {
    // Fail gracefully so UI still loads
    if (method === 'GET') {
      res.status(200).json({ project, count: 0, warning: 'Upstash not configured' });
      return;
    }
    res.status(500).json({ error: 'Upstash credentials missing' });
    return;
  }

  try {
    if (method === 'GET') {
      const r = await fetch(`${baseUrl}/get/likes:${project}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await r.json();
      const raw = data.result;
      const count = raw === null ? 0 : Number(raw) || 0;
      res.status(200).json({ project, count });
      return;
    }

    if (method === 'POST') {
      const r = await fetch(`${baseUrl}/incrby/likes:${project}/1`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await r.json();
      const count = Number(data.result) || 0;
      res.status(200).json({ project, count });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: String(err) });
  }
}


