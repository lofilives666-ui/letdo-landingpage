const { prisma } = require("../../lib/blog-prisma");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { json } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return json(res, 401, { error: "Unauthorized" });
    }

    const admin = await prisma.blogAdmin.findUnique({
      where: { id: session.adminId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!admin) {
      return json(res, 401, { error: "Unauthorized" });
    }

    return json(res, 200, { admin });
  } catch (error) {
    console.error("Blog admin session failed", error);
    return json(res, 500, { error: "Session check failed." });
  }
};
