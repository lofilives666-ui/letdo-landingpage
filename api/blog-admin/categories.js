const { prisma } = require("../../lib/blog-prisma");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { parseBody, json, slugify } = require("../../lib/blog-utils");
const { ensureDefaultBlogCategories } = require("../../lib/blog-taxonomy");

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      await ensureDefaultBlogCategories(prisma);
      const categories = await prisma.blogCategory.findMany({
        include: {
          _count: {
            select: { posts: true },
          },
        },
        orderBy: { name: "asc" },
      });

      return json(res, 200, { categories });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const name = String(body.name || "").trim();
      const description = String(body.description || "").trim();

      if (!name) {
        return json(res, 400, { error: "Category name is required." });
      }

      const category = await prisma.blogCategory.create({
        data: {
          name,
          slug: slugify(name),
          description: description || null,
        },
      });

      return json(res, 201, { category });
    }

    return json(res, 405, { error: "Method Not Allowed" });
  } catch (error) {
    console.error("Blog categories failed", error);
    return json(res, 500, { error: "Failed to process categories." });
  }
};
