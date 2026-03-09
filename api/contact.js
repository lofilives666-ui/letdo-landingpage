const nodemailer = require('nodemailer');
const querystring = require('querystring');

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
  const subject = String(body.subject || '').trim() || 'Website Enquiry';
  const message = String(body.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).send('Please complete the form and try again.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send('Please enter a valid email address.');
  }

  const host = env('TITAN_SMTP_HOST', 'smtp.titan.email');
  const port = Number(env('TITAN_SMTP_PORT', '587'));
  const secureEnv = env('TITAN_SMTP_SECURE', 'tls').toLowerCase();
  const secure = secureEnv === 'ssl' || port === 465;
  const user = env('TITAN_SMTP_USER', 'info@letesdocreative.com');
  const pass = env('TITAN_SMTP_PASS', '');
  const fromEmail = env('MAIL_FROM_EMAIL', user);
  const fromName = env('MAIL_FROM_NAME', 'Letsdo Creative');
  const toEmail = env('MAIL_TO_EMAIL', 'letsdoveera@gmail');

  if (!pass) {
    return res.status(500).send('Mail service is not configured. Missing TITAN_SMTP_PASS.');
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
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n`,
    });

    return res.status(200).send('Thank You! Your message has been sent.');
  } catch (error) {
    if (error && error.code === 'EAUTH') {
      return res.status(500).send('SMTP authentication failed. Check TITAN_SMTP_USER and TITAN_SMTP_PASS.');
    }
    if (error && (error.code === 'ESOCKET' || error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT')) {
      return res.status(500).send('SMTP connection failed. Check TITAN host/port/security settings.');
    }
    return res.status(500).send('SMTP send failed. Check Titan mailbox settings and credentials.');
  }
};
