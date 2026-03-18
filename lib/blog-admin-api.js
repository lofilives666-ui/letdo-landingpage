const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const OpenAI = require("openai");
const { prisma } = require("./blog-prisma");
const {
  verifyPassword,
  createSessionToken,
  buildSessionCookie,
  buildClearedSessionCookie,
  getSessionFromRequest,
} = require("./blog-auth");
const {
  parseBody,
  json,
  slugify,
  calculateReadingMinutes,
} = require("./blog-utils");
const {
  ensureDefaultBlogCategories,
  ensureDefaultBlogTags,
} = require("./blog-taxonomy");

function requireSession(req, res) {
  const session = getSessionFromRequest(req);
  if (!session) {
    json(res, 401, { error: "Unauthorized" });
    return null;
  }
  return session;
}

function buildPrompt(target, payload) {
  const context = [
    "Brand: Letsdo Creative",
    payload.category ? `Category: ${payload.category}` : null,
    payload.title ? `Title: ${payload.title}` : null,
    payload.excerpt ? `Excerpt: ${payload.excerpt}` : null,
    payload.wordCount ? `Word count: ${payload.wordCount}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (target === "all") {
    return `${context}

Return valid JSON only with:
{
  "title": "string",
  "excerpt": "string",
  "content": "string",
  "seoTitle": "string",
  "seoDescription": "string"
}

Rules:
- focus on Letsdo Creative services, products, digital delivery, or growth
- title: 8 to 14 words
- excerpt: 45 to 70 words
- content: 700 to 1000 words in plain text with section headings separated by blank lines
- seoTitle: under 60 characters if possible
- seoDescription: 140 to 160 characters if possible
- no markdown fences`;
  }

  if (target === "content") {
    return `${context}

Write an SEO-friendly blog article in plain text with section headings separated by blank lines. Keep it business-focused and readable for Letsdo Creative prospects.`;
  }

  return `${context}

Write a strong ${target} for a Letsdo Creative blog post. Return only the requested text.`;
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

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
}

async function handleLogout(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  res.setHeader("Set-Cookie", buildClearedSessionCookie());
  return json(res, 200, { success: true });
}

async function handleSession(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const session = requireSession(req, res);
  if (!session) return;

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
}

async function handleDashboard(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const session = requireSession(req, res);
  if (!session) return;

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
}

async function handleCategories(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

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
}

async function handleTags(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

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
}

async function handleAiGenerate(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json(res, 500, { error: "Missing OPENAI_API_KEY." });
  }

  const body = parseBody(req);
  const target = String(body.target || "all").trim();
  const category = String(body.category || "").trim();

  if (!category) {
    return json(res, 400, { error: "Category is required for AI generation." });
  }

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    input: buildPrompt(target, body),
  });

  const output = String(response.output_text || "").trim();
  if (!output) {
    return json(res, 502, { error: "Empty AI response." });
  }

  if (target === "all") {
    const parsed = JSON.parse(output.replace(/^```json/i, "").replace(/```$/i, "").trim());
    return json(res, 200, { content: parsed });
  }

  return json(res, 200, { content: output });
}

async function handleUploadImage(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  const body = parseBody(req);
  const dataUrl = String(body.dataUrl || "").trim();
  const filenameHint = String(body.filename || "blog-cover").trim();

  if (!dataUrl.startsWith("data:image/webp;base64,")) {
    return json(res, 400, { error: "Expected a WebP image payload." });
  }

  const base64 = dataUrl.replace(/^data:image\/webp;base64,/, "");
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) {
    return json(res, 400, { error: "Empty image data." });
  }

  const safeName = slugify(filenameHint) || "blog-cover";
  const filename = `${safeName}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.webp`;
  const uploadDir = path.join(process.cwd(), "assets", "img", "blog", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const targetPath = path.join(uploadDir, filename);
  await fs.writeFile(targetPath, buffer);

  return json(res, 200, {
    imageUrl: `/assets/img/blog/uploads/${filename}`,
  });
}

async function handlePosts(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

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
        tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
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
}

async function handlePost(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

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
        publishedAt: status === "PUBLISHED" ? currentPost.publishedAt || new Date() : null,
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
}

module.exports = async (req, res) => {
  try {
    const action = String(req.query.action || "").trim().toLowerCase();

    switch (action) {
      case "login":
        return await handleLogin(req, res);
      case "logout":
        return await handleLogout(req, res);
      case "session":
        return await handleSession(req, res);
      case "dashboard":
        return await handleDashboard(req, res);
      case "categories":
        return await handleCategories(req, res);
      case "tags":
        return await handleTags(req, res);
      case "ai-generate":
        return await handleAiGenerate(req, res);
      case "upload-image":
        return await handleUploadImage(req, res);
      case "posts":
        return await handlePosts(req, res);
      case "post":
        return await handlePost(req, res);
      default:
        return json(res, 404, { error: "Unknown admin action." });
    }
  } catch (error) {
    console.error("Blog admin API failed", error);
    return json(res, 500, { error: "Failed to process admin request." });
  }
};
