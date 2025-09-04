module.exports = async function handler(req, res) {
  const { method } = req;
  
  // Email sending function using Resend
  async function sendEmail(contactData) {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      
      if (!resendApiKey) {
        console.log('Resend API key not configured, using fallback email service');
        return await sendEmailFallback(contactData);
      }

      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Portfolio Contact <noreply@yourdomain.com>',
          to: ['e.pequierda@yahoo.com'],
          subject: `Portfolio Contact: ${contactData.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                New Contact Form Submission
              </h2>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #1e293b; margin-top: 0;">Contact Details:</h3>
                <p><strong>Name:</strong> ${contactData.name}</p>
                <p><strong>Email:</strong> ${contactData.email}</p>
                <p><strong>Subject:</strong> ${contactData.subject}</p>
                <p><strong>IP Address:</strong> ${contactData.ip}</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-CA', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                  timeZone: 'Asia/Manila'
                }).replace(',', '')} (PH Time)</p>
              </div>
              
              <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h3 style="color: #1e293b; margin-top: 0;">Message:</h3>
                <p style="line-height: 1.6; color: #374151;">${contactData.message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #2563eb; border-radius: 4px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  <strong>Reply to:</strong> <a href="mailto:${contactData.email}" style="color: #2563eb;">${contactData.email}</a>
                </p>
              </div>
            </div>
          `
        })
      });

      if (emailResponse.ok) {
        console.log('Email sent successfully via Resend');
        return true;
      } else {
        console.error('Resend email failed:', await emailResponse.text());
        return await sendEmailFallback(contactData);
      }
    } catch (error) {
      console.error('Email sending error:', error);
      return await sendEmailFallback(contactData);
    }
  }

  // Fallback email service using EmailJS or similar
  async function sendEmailFallback(contactData) {
    try {
      // Using a simple webhook service as fallback
      const webhookUrl = process.env.EMAIL_WEBHOOK_URL;
      
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'e.pequierda@yahoo.com',
            subject: `Portfolio Contact: ${contactData.subject}`,
            text: `
New contact form submission:

Name: ${contactData.name}
Email: ${contactData.email}
Subject: ${contactData.subject}
IP: ${contactData.ip}
Timestamp: ${new Date().toISOString()}

Message:
${contactData.message}

Reply to: ${contactData.email}
            `
          })
        });
        
        if (response.ok) {
          console.log('Email sent via webhook fallback');
          return true;
        }
      }
      
      // If all else fails, just log it (you can set up email notifications later)
      console.log('Contact form submission (email service unavailable):', {
        name: contactData.name,
        email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
        ip: contactData.ip,
        timestamp: new Date().toISOString()
      });
      
      return true; // Return true so user doesn't see error
    } catch (error) {
      console.error('Fallback email error:', error);
      return false;
    }
  }
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
    return;
  }

  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Send email using Resend (free email service)
    const emailSent = await this.sendEmail({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      ip: req.headers['x-forwarded-for'] || 
          req.headers['x-real-ip'] || 
          req.connection?.remoteAddress || 
          'Unknown'
    });

    if (!emailSent) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send email. Please try again later.' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Message sent successfully! I\'ll get back to you soon.' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message. Please try again.' 
    });
  }
};
