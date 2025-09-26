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

  // Get visitor's IP address and location
  async function getVisitorLocation() {
    try {
      // Get IP address from various headers (for different hosting platforms)
      let ip = req.headers['x-forwarded-for'] || 
               req.headers['x-real-ip'] || 
               req.headers['x-client-ip'] || 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress ||
               '127.0.0.1';

      // Clean up IP (remove port if present)
      if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
      }
      if (ip.includes(':')) {
        ip = ip.split(':')[0].trim();
      }

      // Skip geolocation for localhost/private IPs
      if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return {
          ip: ip,
          country: 'Local Development',
          countryCode: 'LOCAL',
          city: 'Localhost',
          region: 'Development',
          timezone: 'Asia/Manila'
        };
      }

      // Try multiple geolocation services for better reliability
      const services = [
        `https://ipapi.co/${ip}/json/`,
        `http://ip-api.com/json/${ip}`,
        `https://ipinfo.io/${ip}/json`
      ];

      for (const serviceUrl of services) {
        try {
          console.log(`Trying geolocation service: ${serviceUrl}`);
          const response = await fetch(serviceUrl, {
            timeout: 3000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Portfolio/1.0)'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Geolocation data received:', data);
            
            // Handle different service response formats
            if (serviceUrl.includes('ipapi.co')) {
              return {
                ip: ip,
                country: data.country_name || 'Unknown',
                countryCode: data.country_code || 'Unknown',
                city: data.city || 'Unknown',
                region: data.region || 'Unknown',
                timezone: data.timezone || 'Unknown'
              };
            } else if (serviceUrl.includes('ip-api.com')) {
              return {
                ip: ip,
                country: data.country || 'Unknown',
                countryCode: data.countryCode || 'Unknown',
                city: data.city || 'Unknown',
                region: data.regionName || 'Unknown',
                timezone: data.timezone || 'Unknown'
              };
            } else if (serviceUrl.includes('ipinfo.io')) {
              return {
                ip: ip,
                country: data.country || 'Unknown',
                countryCode: data.country || 'Unknown',
                city: data.city || 'Unknown',
                region: data.region || 'Unknown',
                timezone: data.timezone || 'Unknown'
              };
            }
          }
        } catch (serviceError) {
          console.log(`Service ${serviceUrl} failed:`, serviceError.message);
          continue;
        }
      }
    } catch (error) {
      console.log('Location fetch failed:', error.message);
    }
    
    // Final fallback if all services fail
    return {
      ip: 'Unknown',
      country: 'Unknown',
      countryCode: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      timezone: 'Unknown'
    };
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
      let visitorData = { count: 0, lastVisit: null, lastLocation: null };
      
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
      // Get current data, increment count, and update timestamp with location
      const now = new Date();
      const timestamp24h = now.toLocaleString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Manila'
      }).replace(',', '');
      
      // Get visitor location
      const location = await getVisitorLocation();
      
      // First, get current data
      const getResponse = await fetch(`${baseUrl}/get/visitor_data`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      
      const getData = await getResponse.json();
      let currentData = { count: 0, lastVisit: null, lastLocation: null };
      
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
      
      // Increment count and update timestamp with location
      const newData = {
        count: currentData.count + 1,
        lastVisit: timestamp24h,
        lastLocation: location
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
