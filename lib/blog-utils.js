function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (_error) {
      return {};
    }
  }
  return req.body;
}

function json(res, statusCode, payload) {
  res.status(statusCode);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.send(JSON.stringify(payload));
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function calculateReadingMinutes(content) {
  const words = String(content || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function fallbackImage(seed) {
  const images = [
    "assets/img/blog/blog_post01.webp",
    "assets/img/blog/blog_post02.webp",
    "assets/img/blog/blog_post03.webp",
  ];
  const index = Math.abs(
    String(seed || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0),
  ) % images.length;
  return images[index];
}

function plainTextToHtml(content) {
  const blocks = String(content || "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (!lines.length) {
        return "";
      }

      if (lines.length === 1 && lines[0].length <= 80) {
        return `<h4 class="inner-title">${escapeHtml(lines[0])}</h4>`;
      }

      return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
    })
    .join("");
}

function toPublicPost(post) {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    contentHtml: plainTextToHtml(post.content),
    coverImage: post.coverImage || fallbackImage(post.slug),
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    featured: Boolean(post.featured),
    readingMinutes: post.readingMinutes,
    publishedAt: post.publishedAt,
    publishedLabel: formatDate(post.publishedAt),
    category: post.category ? { name: post.category.name, slug: post.category.slug } : null,
    author: post.author ? { name: post.author.name, email: post.author.email } : null,
    tags: Array.isArray(post.tags)
      ? post.tags.map((item) => ({
          name: item.tag.name,
          slug: item.tag.slug,
        }))
      : [],
  };
}

module.exports = {
  parseBody,
  json,
  slugify,
  escapeHtml,
  formatDate,
  calculateReadingMinutes,
  fallbackImage,
  plainTextToHtml,
  toPublicPost,
};
