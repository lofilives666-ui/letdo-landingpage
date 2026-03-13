function env(key, fallback = '') {
  const value = process.env[key];
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const siteKey = env('RECAPTCHA_SITE_KEY', '');
  res.setHeader('Cache-Control', 'no-store');

  if (!siteKey) {
    return res.status(503).json({ siteKey: '' });
  }

  return res.status(200).json({ siteKey });
};
