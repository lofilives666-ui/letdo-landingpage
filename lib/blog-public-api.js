const { getBlogListing, getBlogPostBySlug } = require("./blog-data");
const { json } = require("./blog-utils");

async function handleBlogListing(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const category = String(req.query.category || "").trim() || undefined;
  const tag = String(req.query.tag || "").trim() || undefined;
  const search = String(req.query.q || "").trim() || undefined;
  const data = await getBlogListing({
    page,
    pageSize: 9,
    category,
    tag,
    search,
  });

  return json(res, 200, data);
}

async function handleBlogPost(req, res) {
  const slug = String(req.query.slug || "").trim();

  if (!slug) {
    return json(res, 400, { error: "Missing slug." });
  }

  const data = await getBlogPostBySlug(slug);

  if (!data) {
    return json(res, 404, { error: "Post not found." });
  }

  return json(res, 200, data);
}

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const action = String(req.query.action || "").trim().toLowerCase();

    if (action === "post") {
      return await handleBlogPost(req, res);
    }

    return await handleBlogListing(req, res);
  } catch (error) {
    console.error("Blog API failed", error);
    return json(res, 500, { error: "Failed to process blog request." });
  }
};
