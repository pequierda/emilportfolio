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

    // Send email using Resend
    try {
      // Get Resend API key from environment variables
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (!resendApiKey) {
        console.log('RESEND_API_KEY not found in environment variables');
        console.log('Email data prepared:', emailData);
        return false;
      }
      
      // Send email via Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Emil Portfolio <noreply@emilportfolio.vercel.app>', // Using Vercel domain
          to: [emailData.to],
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text,
          reply_to: data.email
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log('Email sent successfully via Resend:', result.id);
        return true;
      } else {
        console.log('Resend API failed:', result);
        console.log('Email data prepared:', emailData);
        return false;
      }
    } catch (resendError) {
      console.log('Resend API error:', resendError);
      console.log('Email data prepared:', emailData);
      return false;
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}
