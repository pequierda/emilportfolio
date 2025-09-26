module.exports = async function handler(req, res) {
  const { method, query } = req;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Test API called with method:', method);
    console.log('Query parameters:', query);
    console.log('Request headers:', req.headers);
    
    if (method === 'GET') {
      const testData = {
        success: true,
        message: 'Test API is working!',
        timestamp: new Date().toISOString(),
        method: 'GET',
        query: query,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime()
        }
      };
      
      res.status(200).json(testData);
      return;
    }
    
    if (method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      
      const testData = {
        success: true,
        message: 'Test API POST is working!',
        timestamp: new Date().toISOString(),
        method: 'POST',
        receivedData: body,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          uptime: process.uptime()
        }
      };
      
      res.status(200).json(testData);
      return;
    }
    
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Test API error:', error);
    res.status(500).json({ 
      error: 'Test API error', 
      details: error.message,
      stack: error.stack 
    });
  }
};
