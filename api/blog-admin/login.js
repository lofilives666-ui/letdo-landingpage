const { prisma } = require("../../lib/blog-prisma");
const {
  verifyPassword,
  createSessionToken,
  buildSessionCookie,
} = require("../../lib/blog-auth");
const { parseBody, json } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const body = parseBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return json(res, 400, { error: "Email and password are required." });
    }

    const admin = await prisma.blogAdmin.findUnique({
      where: { email },
    });

    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return json(res, 401, { error: "Invalid email or password." });
    }

    const token = createSessionToken(admin);
    res.setHeader("Set-Cookie", buildSessionCookie(token));

    return json(res, 200, {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Blog admin login failed", error);
    return json(res, 500, { error: "Login failed." });
  }
};
