module.exports = async function handler(req, res) {
  const { method, body } = req;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    // Parse the request body
    const data = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Validate required fields
    const required = ['name', 'email', 'subject', 'message'];
    for (const field of required) {
      if (!data[field] || data[field].trim() === '') {
        res.status(400).json({ error: `Missing required field: ${field}` });
        return;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Sanitize input
    const sanitizedData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      subject: data.subject.trim(),
      message: data.message.trim(),
      timestamp: new Date().toISOString(),
      ip: req.headers['x-forwarded-for'] || 
          req.headers['x-real-ip'] || 
          req.connection?.remoteAddress || 
          'Unknown'
    };

    // For serverless deployment, we'll use a simple response
    // In production, you would integrate with an email service like SendGrid, Mailgun, etc.
    
    // Log the contact form submission (for debugging)
    console.log('Contact form submission:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
      timestamp: sanitizedData.timestamp
    });

    // Simulate email sending (replace with actual email service)
    const emailSent = await simulateEmailSending(sanitizedData);
    
    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      emailSent: emailSent,
      contactId: `contact_${Date.now()}`
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
};

// Simulate email sending function
async function simulateEmailSending(data) {
  try {
    // In a real implementation, you would:
    // 1. Use an email service like SendGrid, Mailgun, or AWS SES
    // 2. Send the email to your inbox
    // 3. Return true/false based on success
    
    console.log('Simulating email send to: e.pequierda@yahoo.com');
    console.log('Subject:', `Portfolio Contact: ${data.subject}`);
    console.log('From:', data.email);
    console.log('Message:', data.message);
    
    // For now, just simulate success
    return true;
  } catch (error) {
    console.error('Email sending simulation failed:', error);
    return false;
  }
}
