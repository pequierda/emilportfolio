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

    if (String(data.message).trim().length < 10) {
      res.status(400).json({ error: 'Message must be at least 10 characters' });
      return;
    }

    const sanitizedData = {
      name: String(data.name).trim(),
      email: String(data.email).trim().toLowerCase(),
      subject: String(data.subject).trim(),
      message: String(data.message).trim(),
      timestamp: new Date().toISOString(),
      ip:
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        'Unknown',
    };

    const delivery = await deliverContactMessage(sanitizedData);

    if (!delivery.ok) {
      res.status(502).json({
        success: false,
        error: delivery.error || 'Could not deliver your message. Please try again or email directly.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      emailSent: true,
      provider: delivery.provider,
      message: 'Message sent successfully! I will get back to you soon.',
      contactId: `contact_${Date.now()}`,
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error. Please try again later.',
    });
  }
};

async function deliverContactMessage(data) {
  const web3Key = process.env.WEB3FORMS_ACCESS_KEY;
  if (web3Key) {
    const result = await sendViaWeb3Forms(data, web3Key);
    if (result.ok) return result;
  }

  const webhookUrl = process.env.CONTACT_WEBHOOK_URL;
  if (webhookUrl) {
    const result = await sendViaWebhook(data, webhookUrl);
    if (result.ok) return result;
  }

  return sendViaFormSubmit(data);
}

async function sendViaWeb3Forms(data, accessKey) {
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        name: data.name,
        email: data.email,
        subject: `Portfolio Contact: ${data.subject}`,
        message: data.message,
        from_name: 'Emil Portfolio',
      }),
    });

    const result = await response.json();
    if (response.ok && result.success) {
      return { ok: true, provider: 'web3forms' };
    }

    console.error('Web3Forms failed:', result);
    return { ok: false, error: result.message || 'Web3Forms delivery failed' };
  } catch (error) {
    console.error('Web3Forms error:', error);
    return { ok: false, error: error.message };
  }
}

async function sendViaWebhook(data, webhookUrl) {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        timestamp: data.timestamp,
        ip: data.ip,
      }),
    });

    if (response.ok) {
      return { ok: true, provider: 'webhook' };
    }

    console.error('Webhook failed:', response.status, await response.text());
    return { ok: false, error: 'Webhook delivery failed' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { ok: false, error: error.message };
  }
}

async function sendViaFormSubmit(data) {
  const toEmail = process.env.CONTACT_TO_EMAIL || 'e.pequierda@yahoo.com';

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        _subject: `Portfolio Contact: ${data.subject}`,
        _template: 'table',
        _captcha: 'false',
      }),
    });

    const result = await response.json();
    const succeeded = result.success === true || result.success === 'true';

    if (succeeded) {
      return { ok: true, provider: 'formsubmit' };
    }

    console.error('FormSubmit failed:', result);
    return {
      ok: false,
      error:
        result.message ||
        'Email delivery is not configured yet. Please use the email link below or try again later.',
    };
  } catch (error) {
    console.error('FormSubmit error:', error);
    return { ok: false, error: error.message };
  }
}
