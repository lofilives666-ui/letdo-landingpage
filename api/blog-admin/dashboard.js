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

    const [publishedPosts, draftPosts, categories, recentPosts] = await Promise.all([
      prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
      prisma.blogPost.count({ where: { status: "DRAFT" } }),
      prisma.blogCategory.count(),
      prisma.blogPost.findMany({
        include: {
          category: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
    ]);

    return json(res, 200, {
      metrics: {
        publishedPosts,
        draftPosts,
        categories,
      },
      posts: recentPosts,
    });
  } catch (error) {
    console.error("Blog admin dashboard failed", error);
    return json(res, 500, { error: "Failed to load dashboard." });
  }
};
