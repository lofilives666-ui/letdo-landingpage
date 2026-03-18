const { prisma } = require("../../lib/blog-prisma");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { parseBody, json, slugify, calculateReadingMinutes } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const posts = await prisma.blogPost.findMany({
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      });

      return json(res, 200, { posts });
    }

    if (req.method === "POST") {
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

      const post = await prisma.blogPost.create({
        data: {
          title,
          slug,
          excerpt,
          content,
          categoryId,
          authorId: session.adminId,
          coverImage: coverImage || null,
          seoTitle: seoTitle || null,
          seoDescription: seoDescription || null,
          featured,
          status: ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status) ? status : "DRAFT",
          publishedAt: status === "PUBLISHED" ? new Date() : null,
          readingMinutes: calculateReadingMinutes(content),
          tags: tagIds.length
            ? {
                create: tagIds.map((tagId) => ({ tagId })),
              }
            : undefined,
        },
        include: {
          category: true,
          tags: {
            include: { tag: true },
          },
        },
      });

      return json(res, 201, { post });
    }

    return json(res, 405, { error: "Method Not Allowed" });
  } catch (error) {
    console.error("Blog posts failed", error);
    return json(res, 500, { error: "Failed to process posts." });
  }
};
