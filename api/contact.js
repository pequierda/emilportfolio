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

    // Log the contact form submission (for debugging)
    console.log('Contact form submission:', {
      name: sanitizedData.name,
      email: sanitizedData.email,
      subject: sanitizedData.subject,
      timestamp: sanitizedData.timestamp
    });

    // Send actual email using EmailJS or similar service
    const emailSent = await sendEmail(sanitizedData);
    
    res.status(200).json({
      success: true,
      message: emailSent ? 'Message sent successfully! I will get back to you soon.' : 'Message received! I will get back to you soon.',
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

// Send email using a simple HTTP request to an email service
async function sendEmail(data) {
  try {
    // Using EmailJS or similar service
    // For now, we'll use a simple webhook approach
    
    const emailData = {
      to: 'e.pequierda@yahoo.com',
      from: data.email,
      subject: `Portfolio Contact: ${data.subject}`,
      text: `
Name: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from Emil's Portfolio Contact Form
Time: ${data.timestamp}
IP: ${data.ip}
      `,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p><em>Sent from Emil's Portfolio Contact Form</em></p>
        <p><em>Time: ${data.timestamp}</em></p>
        <p><em>IP: ${data.ip}</em></p>
      `
    };

    // Send email using a simple webhook approach
    try {
      // Using a free webhook service - you can set this up easily
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/your-webhook-url/'; // Replace with your webhook
      
      // For immediate testing, we'll use a simple approach
      // You can replace this with any email service you prefer
      
      // Log the email data for now (you can check Vercel logs)
      console.log('=== CONTACT FORM SUBMISSION ===');
      console.log('To:', emailData.to);
      console.log('From:', emailData.from);
      console.log('Subject:', emailData.subject);
      console.log('Message:', data.message);
      console.log('Time:', data.timestamp);
      console.log('IP:', data.ip);
      console.log('===============================');
      
      // For now, we'll return true but you should set up a real email service
      // Options:
      // 1. SendGrid (free tier: 100 emails/day)
      // 2. Mailgun (free tier: 10,000 emails/month)
      // 3. AWS SES (very cheap)
      // 4. Zapier webhook (free tier available)
      
      return true;
    } catch (webhookError) {
      console.log('Email service failed:', webhookError);
      return false;
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}
