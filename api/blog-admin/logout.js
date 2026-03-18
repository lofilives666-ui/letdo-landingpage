const { buildClearedSessionCookie } = require("../../lib/blog-auth");
const { json } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  res.setHeader("Set-Cookie", buildClearedSessionCookie());
  return json(res, 200, { success: true });
};
