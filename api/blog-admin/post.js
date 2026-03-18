const { prisma } = require("../../lib/blog-prisma");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { parseBody, json, slugify, calculateReadingMinutes } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    const id = String(req.query.id || "").trim();
    if (!id) {
      return json(res, 400, { error: "Missing post id." });
    }

    if (req.method === "GET") {
      const post = await prisma.blogPost.findUnique({
        where: { id },
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      if (!post) {
        return json(res, 404, { error: "Post not found." });
      }

      return json(res, 200, { post });
    }

    if (req.method === "PATCH") {
      const body = parseBody(req);
      const title = String(body.title || "").trim();
      const excerpt = String(body.excerpt || "").trim();
      const content = String(body.content || "").trim();
      const categoryId = String(body.categoryId || "").trim();
      const coverImage = String(body.coverImage || "").trim();
      const seoTitle = String(body.seoTitle || "").trim();
      const seoDescription = String(body.seoDescription || "").trim();
      const status = String(body.status || "DRAFT").trim().toUpperCase();
      const featured = Boolean(body.featured);
      const tagIds = Array.isArray(body.tagIds) ? body.tagIds.map(String).filter(Boolean) : [];
      const slug = slugify(String(body.slug || title));

      if (!title || !excerpt || !content || !categoryId || !slug) {
        return json(res, 400, { error: "Title, excerpt, content, category, and slug are required." });
      }

      const currentPost = await prisma.blogPost.findUnique({
        where: { id },
        select: { publishedAt: true },
      });

      if (!currentPost) {
        return json(res, 404, { error: "Post not found." });
      }

      const post = await prisma.blogPost.update({
        where: { id },
        data: {
          title,
          slug,
          excerpt,
          content,
          categoryId,
          coverImage: coverImage || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          featured,
          status: ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) ? status : "DRAFT",
          publishedAt:
            status === "PUBLISHED" ? currentPost.publishedAt || new Date() : null,
          readingMinutes: calculateReadingMinutes(content),
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      return json(res, 200, { post });
    }

    if (req.method === "DELETE") {
      await prisma.blogPost.delete({
        where: { id },
      });

      return json(res, 200, { success: true });
    }

    return json(res, 405, { error: "Method Not Allowed" });
  } catch (error) {
    console.error("Blog single post failed", error);
    return json(res, 500, { error: "Failed to process the post." });
  }
};
