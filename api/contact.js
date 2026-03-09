const nodemailer = require('nodemailer');
const querystring = require('querystring');
const GMAIL_ADDRESS = 'letsdoveera@gmail.com';

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') return querystring.parse(req.body);
  return req.body;
}

function env(key, fallback = '') {
  const value = process.env[key];
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function detectSource(subject) {
  const lower = String(subject || '').toLowerCase();
  if (lower.includes('home')) return 'Home Page';
  if (lower.includes('contact')) return 'Contact Page';
  return 'Website';
}

function formatIstNow() {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(new Date());
}

function buildMailTemplates({ name, email, phone, service, subject, message }) {
  const source = detectSource(subject);
  const submittedAt = formatIstNow();
  const safeService = service || 'Not specified';
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');
  const html = `
<div style="margin:0;padding:24px;background:#f3f6fb;font-family:Arial,sans-serif;color:#1f2937;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:18px 24px;background:#0f172a;color:#ffffff;">
        <div style="font-size:20px;font-weight:700;">Letsdo Creative - New Enquiry</div>
        <div style="font-size:13px;opacity:0.9;margin-top:4px;">${escapeHtml(subject)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:0 0 10px;font-size:14px;"><strong>Name:</strong> ${escapeHtml(name)}</td></tr>
          <tr><td style="padding:0 0 10px;font-size:14px;"><strong>Email:</strong> ${escapeHtml(email)}</td></tr>
          <tr><td style="padding:0 0 10px;font-size:14px;"><strong>Mobile:</strong> ${escapeHtml(phone)}</td></tr>
          <tr><td style="padding:0 0 10px;font-size:14px;"><strong>Service:</strong> ${escapeHtml(safeService)}</td></tr>
          <tr><td style="padding:0 0 10px;font-size:14px;"><strong>Source:</strong> ${escapeHtml(source)}</td></tr>
          <tr><td style="padding:0 0 16px;font-size:14px;"><strong>Submitted At:</strong> ${escapeHtml(submittedAt)} IST</td></tr>
        </table>
        <div style="font-size:14px;font-weight:700;margin-bottom:8px;">Message</div>
        <div style="font-size:14px;line-height:1.6;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">${safeMessage}</div>
        <div style="margin-top:18px;font-size:13px;color:#4b5563;">
          Reply directly to this email to contact the lead.
        </div>
      </td>
    </tr>
  </table>
</div>`;

  const text = `New Enquiry - Letsdo Creative
Subject: ${subject}
Name: ${name}
Email: ${email}
Mobile: ${phone}
Service: ${safeService}
Source: ${source}
Submitted At: ${submittedAt} IST

Message:
${message}
`;

  return { html, text };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const body = parseBody(req);
  const name = String(body.name || '').trim().replace(/[\r\n]/g, ' ');
  const email = String(body.email || '').trim();
  const countryCode = String(body.country_code || '').trim();
  const phoneLocal = String(body.phone || '').trim().replace(/[^\d]/g, '');
  const phone = `${countryCode} ${phoneLocal}`.trim();
  const service = String(body.service || '').trim();
  const subject = String(body.subject || '').trim() || 'Website Enquiry';
  const message = String(body.message || '').trim();

  if (!name || !email || !countryCode || !phoneLocal || !message) {
    return res.status(400).send('Please complete the form and try again.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const countryCodeRegex = /^\+[0-9]{1,4}$/;
  const phoneLocalRegex = /^[0-9]{6,14}$/;
  const fullPhoneRegex = /^\+[0-9]{1,4}\s[0-9]{6,14}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Please enter a valid email address.');
  }
  if (!countryCodeRegex.test(countryCode) || !phoneLocalRegex.test(phoneLocal) || !fullPhoneRegex.test(phone)) {
    return res.status(400).send('Please enter a valid mobile number.');
  }

  const host = 'smtp.gmail.com';
  const port = 465;
  const secure = true;
  const user = GMAIL_ADDRESS;
  const pass = env('GMAIL_APP_PASSWORD', '');
  const fromEmail = GMAIL_ADDRESS;
  const fromName = 'Letsdo Creative';
  const toEmail = GMAIL_ADDRESS;

  if (!pass) {
    return res.status(500).send('Mail service is not configured. Missing GMAIL_APP_PASSWORD.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  try {
    await transporter.verify();
    const templates = buildMailTemplates({ name, email, phone, service, subject, message });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: `${name} <${email}>`,
      subject: `[Letsdo Lead] ${subject} - ${service || 'General Enquiry'}`,
      text: templates.text,
      html: templates.html,
    });

    return res.status(200).send('Thank You! Your message has been sent.');
  } catch (error) {
    if (error && error.code === 'EAUTH') {
      return res.status(500).send('SMTP authentication failed. Check Gmail app password.');
    }
    if (error && (error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT')) {
      return res.status(500).send('SMTP connection failed. Check Gmail SMTP connectivity.');
    }
    return res.status(500).send('SMTP send failed. Check Gmail SMTP settings and credentials.');
  }
};
