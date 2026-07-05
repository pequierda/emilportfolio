module.exports = async function handler(req, res) {
  const { method, body } = req;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    res.status(503).json({
      success: false,
      error: 'Contact form not configured on server. Use the browser form with Web3Forms.',
    });
    return;
  }

  try {
    const data = typeof body === 'string' ? JSON.parse(body) : body;

    const required = ['name', 'email', 'subject', 'message'];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        res.status(400).json({ error: `Missing required field: ${field}` });
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        name: String(data.name).trim(),
        email: String(data.email).trim(),
        subject: `Portfolio Contact: ${String(data.subject).trim()}`,
        message: String(data.message).trim(),
        from_name: 'Emil Portfolio',
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      res.status(200).json({
        success: true,
        message: 'Message sent successfully! I will get back to you soon.',
      });
      return;
    }

    res.status(502).json({
      success: false,
      error: result.message || 'Could not send your message.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
  }
};
