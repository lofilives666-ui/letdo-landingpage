const nodemailer = require('nodemailer');
const querystring = require('querystring');
const GMAIL_ADDRESS = 'letsdoveera@gmail.com';
const SUBMISSION_WINDOW_MS = 2 * 60 * 60 * 1000;
const MIN_SUBMIT_DELAY_MS = 4000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 3;
const RECAPTCHA_MIN_SCORE = 0.5;
const RECAPTCHA_ACTION = 'contact_form';
const submissionStore = new Map();

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

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return String(
    req.headers['x-real-ip']
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || ''
  ).trim();
}

function pruneRateLimitStore(now) {
  for (const [key, timestamps] of submissionStore.entries()) {
    const freshTimestamps = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
    if (freshTimestamps.length === 0) {
      submissionStore.delete(key);
      continue;
    }
    submissionStore.set(key, freshTimestamps);
  }
}

function isRateLimited(key, now) {
  if (!key) return false;
  const timestamps = submissionStore.get(key) || [];
  const freshTimestamps = timestamps.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (freshTimestamps.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    submissionStore.set(key, freshTimestamps);
    return true;
  }
  freshTimestamps.push(now);
  submissionStore.set(key, freshTimestamps);
  return false;
}

function hasExternalUrl(value) {
  return /(https?:\/\/|www\.)/i.test(value);
}

function hasSpamPhrase(value) {
  return /(seo services|domain authority|backlinks|guest post|casino|crypto recovery|escort|loan approval)/i.test(value);
}

function looksLikeSpamMessage(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return false;
  if (hasExternalUrl(normalized)) return true;
  if (hasSpamPhrase(normalized)) return true;
  const wordCount = normalized.split(/\s+/).length;
  const longTokenCount = normalized.split(/\s+/).filter((token) => token.length >= 20).length;
  return wordCount >= 12 && longTokenCount >= 3;
}

async function verifyRecaptchaToken(token, clientIp) {
  const secret = env('RECAPTCHA_SECRET_KEY', '');
  if (!secret) {
    return {
      ok: false,
      status: 500,
      message: 'Spam protection is not configured. Please set RECAPTCHA_SECRET_KEY.',
    };
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', token);
  if (clientIp) {
    params.set('remoteip', clientIp);
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: 502,
        message: 'Unable to verify spam protection. Please try again.',
      };
    }

    const payload = await response.json();
    if (payload.success) {
      if (typeof payload.action === 'string' && payload.action !== RECAPTCHA_ACTION) {
        return {
          ok: false,
          status: 400,
          message: 'Spam protection action mismatch. Please try again.',
        };
      }
      if (typeof payload.score === 'number' && payload.score < RECAPTCHA_MIN_SCORE) {
        return {
          ok: false,
          status: 400,
          message: 'Spam protection check failed. Please try again.',
        };
      }
      return { ok: true };
    }

    const errorCodes = Array.isArray(payload['error-codes']) ? payload['error-codes'] : [];
    const isExpired = errorCodes.includes('timeout-or-duplicate');
    return {
      ok: false,
      status: 400,
      message: isExpired
        ? 'reCAPTCHA expired. Please complete it again.'
        : 'Please complete the reCAPTCHA challenge and try again.',
    };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      message: 'Unable to verify spam protection. Please try again.',
    };
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const body = parseBody(req);
  const name = String(body.name || '').trim().replace(/[\r\n]/g, ' ');
  const email = String(body.email || '').trim();
  const countryCodeRaw = String(body.country_code || '').trim();
  const phoneRaw = String(body.phone || '').trim();
  const service = String(body.service || '').trim();
  const subject = String(body.subject || '').trim() || 'Website Enquiry';
  const message = String(body.message || '').trim();
  const website = String(body.website || '').trim();
  const formStartedAtRaw = String(body.form_started_at || '').trim();
  const recaptchaToken = String(body['g-recaptcha-response'] || '').trim();
  const now = Date.now();
  const clientIp = getClientIp(req);

  pruneRateLimitStore(now);

  if (!name || !email || !phoneRaw || !message) {
    return res.status(400).send('Please complete the form and try again.');
  }
  if (website) {
    return res.status(400).send('Unable to submit this form.');
  }

  const formStartedAt = Number(formStartedAtRaw);
  if (!Number.isFinite(formStartedAt)) {
    return res.status(400).send('Please refresh the page and try again.');
  }
  if (formStartedAt > now || now - formStartedAt < MIN_SUBMIT_DELAY_MS || now - formStartedAt > SUBMISSION_WINDOW_MS) {
    return res.status(400).send('Please take a moment to review your message and try again.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const countryCodeRegex = /^\+[0-9]{1,4}$/;
  const phoneLocalRegex = /^[0-9]{6,14}$/;
  const fullPhoneRegex = /^\+?[0-9]{7,15}$/;
  const countryCode = countryCodeRaw.replace(/[^\d+]/g, '');
  const phoneLocal = phoneRaw.replace(/[^\d]/g, '');
  let phone = '';
  if (!emailRegex.test(email)) {
    return res.status(400).send('Please enter a valid email address.');
  }
  if (!recaptchaToken) {
    return res.status(400).send('Please complete the reCAPTCHA challenge.');
  }
  if (hasExternalUrl(name) || hasExternalUrl(email) || hasExternalUrl(phoneRaw) || looksLikeSpamMessage(message)) {
    return res.status(400).send('Please remove links or promotional content from your message.');
  }
  if (isRateLimited(`ip:${clientIp}`, now) || isRateLimited(`email:${email.toLowerCase()}`, now)) {
    return res.status(429).send('Too many enquiries received. Please try again later.');
  }
  const recaptchaCheck = await verifyRecaptchaToken(recaptchaToken, clientIp);
  if (!recaptchaCheck.ok) {
    return res.status(recaptchaCheck.status).send(recaptchaCheck.message);
  }
  if (countryCode) {
    phone = `${countryCode} ${phoneLocal}`.trim();
    if (!countryCodeRegex.test(countryCode) || !phoneLocalRegex.test(phoneLocal)) {
      return res.status(400).send('Please enter a valid mobile number.');
    }
  } else {
    const normalizedPhone = phoneRaw.replace(/[^\d+]/g, '');
    phone = normalizedPhone;
    if (!fullPhoneRegex.test(normalizedPhone)) {
      return res.status(400).send('Please enter a valid mobile number.');
    }
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
