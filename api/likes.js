module.exports = async function handler(req, res) {
  const { method, query } = req;
  const project = (query.project || '').toString().toLowerCase();
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

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
    // Add debug logging
    console.log('API Request:', { method, project, baseUrl: baseUrl?.substring(0, 30) + '...', hasToken: !!token });

    if (method === 'GET') {
      const url = `${baseUrl}/get/likes:${project}`;
      console.log('GET request to:', url);
      
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      console.log('Response status:', r.status);
      const data = await r.json();
      console.log('Response data:', data);
      
      const raw = data.result;
      const count = raw === null ? 0 : Number(raw) || 0;
      res.status(200).json({ project, count });
      return;
    }

    if (method === 'POST') {
      const url = `${baseUrl}/incrby/likes:${project}/1`;
      console.log('POST request to:', url);
      
      const r = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      console.log('Response status:', r.status);
      const data = await r.json();
      console.log('Response data:', data);
      
      const count = Number(data.result) || 0;
      res.status(200).json({ project, count });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Server error', details: String(err), stack: err.stack });
  }
}


