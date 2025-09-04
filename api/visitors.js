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
      // Get visitor data (count and timestamp) from single key
      const response = await fetch(`${baseUrl}/get/visitor_data`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      const data = await response.json();
      let visitorData = { count: 0, lastVisit: null };
      
      if (data.result) {
        try {
          visitorData = JSON.parse(data.result);
        } catch (e) {
          // If parsing fails, try to get legacy data
          const legacyCount = await fetch(`${baseUrl}/get/visitor_count`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          const legacyData = await legacyCount.json();
          visitorData.count = legacyData.result === null ? 0 : Number(legacyData.result) || 0;
        }
      }
      
      res.status(200).json(visitorData);
      return;
    }

    if (method === 'POST') {
      // Get current data, increment count, and update timestamp
      const now = new Date();
      const timestamp24h = now.toLocaleString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      }).replace(',', '');
      
      // First, get current data
      const getResponse = await fetch(`${baseUrl}/get/visitor_data`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      const getData = await getResponse.json();
      let currentData = { count: 0, lastVisit: null };
      
      if (getData.result) {
        try {
          currentData = JSON.parse(getData.result);
        } catch (e) {
          // If parsing fails, try legacy count
          const legacyCount = await fetch(`${baseUrl}/get/visitor_count`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          });
          const legacyData = await legacyCount.json();
          currentData.count = legacyData.result === null ? 0 : Number(legacyData.result) || 0;
        }
      }
      
      // Increment count and update timestamp
      const newData = {
        count: currentData.count + 1,
        lastVisit: timestamp24h
      };
      
      // Store updated data
      const setResponse = await fetch(`${baseUrl}/set/visitor_data`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newData),
        cache: 'no-store'
      });
      
      res.status(200).json(newData);
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error('Visitor count error:', err);
    res.status(500).json({ error: 'Server error', details: String(err) });
  }
};
