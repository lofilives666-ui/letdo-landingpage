const { prisma } = require("../../lib/blog-prisma");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { parseBody, json, slugify } = require("../../lib/blog-utils");
const { ensureDefaultBlogTags } = require("../../lib/blog-taxonomy");

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      await ensureDefaultBlogTags(prisma);
      const tags = await prisma.blogTag.findMany({
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return json(res, 200, { tags });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const name = String(body.name || "").trim();
      if (!name) {
        return json(res, 400, { error: "Tag name is required." });
      }

      const tag = await prisma.blogTag.create({
        data: {
          name,
          slug: slugify(name),
        },
      });

      return json(res, 201, { tag });
    }

    return json(res, 405, { error: "Method Not Allowed" });
  } catch (error) {
    console.error("Blog tags failed", error);
    return json(res, 500, { error: "Failed to process tags." });
  }
};
