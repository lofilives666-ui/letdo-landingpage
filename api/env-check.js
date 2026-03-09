module.exports = async (_req, res) => {
  return res.status(200).json({
    has_TITAN_SMTP_PASS: Boolean(process.env.TITAN_SMTP_PASS),
    has_TITAN_SMTP_USER: Boolean(process.env.TITAN_SMTP_USER),
    has_MAIL_TO_EMAIL: Boolean(process.env.MAIL_TO_EMAIL),
    has_MAIL_FROM_EMAIL: Boolean(process.env.MAIL_FROM_EMAIL),
    has_MAIL_FROM_NAME: Boolean(process.env.MAIL_FROM_NAME),
    node_env: process.env.NODE_ENV || null,
    vercel_env: process.env.VERCEL_ENV || null
  });
};

