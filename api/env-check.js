module.exports = async (_req, res) => {
  return res.status(200).json({
    has_GMAIL_APP_PASSWORD: Boolean(process.env.GMAIL_APP_PASSWORD),
    node_env: process.env.NODE_ENV || null,
    vercel_env: process.env.VERCEL_ENV || null
  });
};
