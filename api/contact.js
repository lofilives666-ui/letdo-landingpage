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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const body = parseBody(req);
  const name = String(body.name || '').trim().replace(/[\r\n]/g, ' ');
  const email = String(body.email || '').trim();
  const service = String(body.service || '').trim();
  const subject = String(body.subject || '').trim() || 'Website Enquiry';
  const message = String(body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).send('Please complete the form and try again.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Please enter a valid email address.');
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

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      replyTo: `${name} <${email}>`,
      subject,
      text: `Name: ${name}\nEmail: ${email}\nService: ${service || 'Not specified'}\n\nMessage:\n${message}\n`,
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
