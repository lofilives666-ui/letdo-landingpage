const { getBlogListing } = require("../../lib/blog-data");
const { json } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
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
  } catch (error) {
    console.error("Blog listing failed", error);
    return json(res, 500, { error: "Failed to load blog posts." });
  }
};
