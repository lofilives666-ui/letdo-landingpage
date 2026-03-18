const { getBlogPostBySlug } = require("../../lib/blog-data");
const { json } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
    const slug = String(req.query.slug || "").trim();

    if (!slug) {
      return json(res, 400, { error: "Missing slug." });
    }

    const data = await getBlogPostBySlug(slug);

    if (!data) {
      return json(res, 404, { error: "Post not found." });
    }

    return json(res, 200, data);
  } catch (error) {
    console.error("Blog detail failed", error);
    return json(res, 500, { error: "Failed to load post." });
  }
};
