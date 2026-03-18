const OpenAI = require("openai");
const { getSessionFromRequest } = require("../../lib/blog-auth");
const { parseBody, json } = require("../../lib/blog-utils");

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

module.exports = async (req, res) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return json(res, 401, { error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "Method Not Allowed" });
  }

  try {
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
  } catch (error) {
    console.error("Blog AI generation failed", error);
    return json(res, 500, { error: "AI generation failed." });
  }
};
