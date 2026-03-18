const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { parseBody, json, slugify } = require("../../lib/blog-utils");

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
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
  } catch (error) {
    console.error("Blog image upload failed", error);
    return json(res, 500, { error: "Failed to upload image." });
  }
};
