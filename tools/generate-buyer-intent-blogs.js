const fs = require("fs");
const path = require("path");
const { getBuyerIntentPosts } = require("../lib/buyer-intent-posts");

const rootDir = path.resolve(__dirname, "..");
const blogTemplate = fs.readFileSync(path.join(rootDir, "blog.html"), "utf8");

const headerMatch = blogTemplate.match(/<body>([\s\S]*?)<main class="main--area">/);
const footerMatch = blogTemplate.match(/<\/main>([\s\S]*?)<\/body>/);

if (!headerMatch || !footerMatch) {
  throw new Error("Unable to extract shared header or footer from blog.html");
}

const sharedHeader = headerMatch[1]
  .replace(/<li><a href="#">Blog<\/a><\/li>/g, '<li><a href="blog.html">Blog</a></li>');
const sharedFooter = footerMatch[1]
  .replace(/\s*<script src="assets\/js\/blog-listing\.min\.js"><\/script>/, "");

const posts = getBuyerIntentPosts();

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function absolutize(assetPath) {
  return `https://letsdocreative.com/${String(assetPath || "").replace(/^\/+/, "")}`;
}

function formatArticleDate(isoValue) {
  const date = new Date(isoValue);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function articleStyles() {
  return `
    <style>
      .buyer-blog-hero {
        padding: 120px 0 70px;
        background:
          radial-gradient(circle at top left, rgba(16, 185, 129, 0.18), transparent 28%),
          radial-gradient(circle at top right, rgba(46, 116, 255, 0.12), transparent 26%),
          #0f1720;
      }
      .buyer-blog-shell {
        max-width: 1180px;
        margin: 0 auto;
      }
      .buyer-blog-badge {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        border-radius: 999px;
        border: 1px solid rgba(16, 185, 129, 0.3);
        background: rgba(16, 185, 129, 0.12);
        color: #5df0b4;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .buyer-blog-title {
        max-width: 980px;
        margin: 26px auto 20px;
        color: #fff;
        font-size: clamp(34px, 5vw, 66px);
        line-height: 1.05;
        text-transform: uppercase;
      }
      .buyer-blog-intro {
        max-width: 860px;
        margin: 0 auto;
        color: rgba(226, 232, 240, 0.82);
        font-size: 20px;
        line-height: 1.8;
      }
      .buyer-blog-meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 14px;
        margin-top: 28px;
      }
      .buyer-blog-meta-item {
        padding: 12px 18px;
        border-radius: 16px;
        background: rgba(11, 19, 32, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.16);
        color: rgba(226, 232, 240, 0.88);
        font-size: 14px;
      }
      .buyer-blog-main {
        background:
          radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.08), transparent 25%),
          #09111a;
        padding: 70px 0 120px;
      }
      .buyer-blog-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.8fr);
        gap: 34px;
        align-items: start;
      }
      .buyer-blog-article-card,
      .buyer-blog-sidebar-card,
      .buyer-blog-cta-card,
      .buyer-blog-related-card {
        border-radius: 28px;
        border: 1px solid rgba(148, 163, 184, 0.14);
        background: rgba(15, 23, 32, 0.92);
        box-shadow: 0 26px 70px rgba(0, 0, 0, 0.32);
      }
      .buyer-blog-article-card {
        overflow: hidden;
      }
      .buyer-blog-cover {
        width: 100%;
        display: block;
        aspect-ratio: 16 / 9;
        object-fit: cover;
      }
      .buyer-blog-article-inner {
        padding: 34px 34px 12px;
      }
      .buyer-blog-content h4 {
        margin: 36px 0 16px;
        color: #fff;
        font-size: 28px;
        line-height: 1.25;
      }
      .buyer-blog-content p {
        margin: 0 0 18px;
        color: rgba(226, 232, 240, 0.84);
        font-size: 18px;
        line-height: 1.9;
      }
      .buyer-blog-inline-callout {
        margin: 34px 0;
        padding: 22px 24px;
        border-radius: 20px;
        border: 1px solid rgba(16, 185, 129, 0.22);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.13), rgba(20, 30, 44, 0.8));
      }
      .buyer-blog-inline-callout strong {
        display: block;
        margin-bottom: 8px;
        color: #fff;
        font-size: 20px;
      }
      .buyer-blog-inline-callout p {
        margin: 0;
        font-size: 16px;
      }
      .buyer-blog-sidebar {
        position: sticky;
        top: 120px;
        display: grid;
        gap: 22px;
      }
      .buyer-blog-sidebar-card,
      .buyer-blog-cta-card {
        padding: 28px;
      }
      .buyer-blog-sidebar-label {
        display: block;
        margin-bottom: 10px;
        color: #5df0b4;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .buyer-blog-sidebar-title {
        margin: 0 0 10px;
        color: #fff;
        font-size: 30px;
        line-height: 1.2;
      }
      .buyer-blog-sidebar-copy {
        margin: 0;
        color: rgba(226, 232, 240, 0.82);
        line-height: 1.8;
      }
      .buyer-blog-detail-list {
        display: grid;
        gap: 14px;
        margin: 22px 0 0;
      }
      .buyer-blog-detail-item {
        padding: 14px 16px;
        border-radius: 18px;
        background: rgba(8, 15, 24, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.12);
      }
      .buyer-blog-detail-item small {
        display: block;
        margin-bottom: 6px;
        color: rgba(148, 163, 184, 0.86);
        font-size: 11px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .buyer-blog-detail-item span,
      .buyer-blog-detail-item a {
        color: #fff;
        font-size: 16px;
        font-weight: 600;
      }
      .buyer-blog-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 18px;
      }
      .buyer-blog-tag {
        padding: 10px 14px;
        border-radius: 999px;
        background: rgba(11, 19, 32, 0.88);
        border: 1px solid rgba(16, 185, 129, 0.18);
        color: rgba(226, 232, 240, 0.92);
        font-size: 13px;
      }
      .buyer-blog-cta-card {
        background:
          radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.16), transparent 34%),
          rgba(15, 23, 32, 0.96);
      }
      .buyer-blog-cta-card .tg-btn-1 {
        margin-top: 18px;
      }
      .buyer-blog-related {
        margin-top: 52px;
      }
      .buyer-blog-related-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 22px;
        margin-top: 26px;
      }
      .buyer-blog-related-card {
        overflow: hidden;
      }
      .buyer-blog-related-card img {
        width: 100%;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        display: block;
      }
      .buyer-blog-related-card-body {
        padding: 22px;
      }
      .buyer-blog-related-card h3 {
        margin: 10px 0 12px;
        color: #fff;
        font-size: 22px;
        line-height: 1.35;
      }
      .buyer-blog-related-card p {
        margin: 0 0 18px;
        color: rgba(226, 232, 240, 0.78);
        line-height: 1.75;
      }
      .buyer-blog-related-card a {
        color: #5df0b4;
        font-weight: 700;
      }
      @media (max-width: 991px) {
        .buyer-blog-grid,
        .buyer-blog-related-grid {
          grid-template-columns: 1fr;
        }
        .buyer-blog-sidebar {
          position: static;
        }
        .buyer-blog-article-inner,
        .buyer-blog-sidebar-card,
        .buyer-blog-cta-card {
          padding: 24px;
        }
        .buyer-blog-title {
          font-size: 42px;
        }
        .buyer-blog-intro {
          font-size: 18px;
        }
        .buyer-blog-content h4 {
          font-size: 24px;
        }
      }
    </style>
  `;
}

function renderTags(post) {
  return (post.tags || [])
    .map(
      (tag) =>
        `<a class="buyer-blog-tag" href="blog.html?tag=${encodeURIComponent(tag.slug)}">${escapeHtml(tag.name)}</a>`,
    )
    .join("");
}

function renderRelatedPosts(currentPost) {
  const related = posts.filter((post) => post.slug !== currentPost.slug).slice(0, 3);
  return related
    .map(
      (post) => `
        <article class="buyer-blog-related-card">
          <img src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">
          <div class="buyer-blog-related-card-body">
            <span class="buyer-blog-sidebar-label">${escapeHtml(post.category.name)}</span>
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.excerpt)}</p>
            <a href="${escapeHtml(post.slug)}.html">Read article</a>
          </div>
        </article>`,
    )
    .join("");
}

function renderMain(post) {
  return `
    <main class="main--area">
      <section class="buyer-blog-hero">
        <div class="container">
          <div class="buyer-blog-shell text-center">
            <span class="buyer-blog-badge">${escapeHtml(post.category.name)}</span>
            <h1 class="buyer-blog-title">${escapeHtml(post.title)}</h1>
            <p class="buyer-blog-intro">${escapeHtml(post.excerpt)}</p>
            <div class="buyer-blog-meta">
              <span class="buyer-blog-meta-item"><i class="far fa-calendar-alt"></i> ${escapeHtml(formatArticleDate(post.publishedAt))}</span>
              <span class="buyer-blog-meta-item"><i class="far fa-clock"></i> ${escapeHtml(String(post.readingMinutes))} min read</span>
              <span class="buyer-blog-meta-item"><i class="far fa-user"></i> ${escapeHtml(post.author.name)}</span>
            </div>
          </div>
        </div>
      </section>
      <section class="buyer-blog-main">
        <div class="container">
          <div class="buyer-blog-shell">
            <div class="buyer-blog-grid">
              <article class="buyer-blog-article-card">
                <img class="buyer-blog-cover" src="${escapeHtml(post.coverImage)}" alt="${escapeHtml(post.title)}">
                <div class="buyer-blog-article-inner">
                  <div class="buyer-blog-content">
                    ${post.contentHtml}
                    <div class="buyer-blog-inline-callout">
                      <strong>Need a delivery partner, not just a vendor list?</strong>
                      <p>${escapeHtml(post.excerpt)} Use this article as a decision filter, then map the shortlist back to your actual delivery goals, timeline, and post-launch support needs.</p>
                    </div>
                  </div>
                </div>
              </article>
              <aside class="buyer-blog-sidebar">
                <div class="buyer-blog-sidebar-card">
                  <span class="buyer-blog-sidebar-label">Article Snapshot</span>
                  <h2 class="buyer-blog-sidebar-title">Built for decision-stage search</h2>
                  <p class="buyer-blog-sidebar-copy">This guide is written for teams already comparing vendors, platforms, timelines, or launch models and looking for a practical next step.</p>
                  <div class="buyer-blog-detail-list">
                    <div class="buyer-blog-detail-item">
                      <small>Category</small>
                      <a href="blog.html?category=${encodeURIComponent(post.category.slug)}">${escapeHtml(post.category.name)}</a>
                    </div>
                    <div class="buyer-blog-detail-item">
                      <small>Published</small>
                      <span>${escapeHtml(formatArticleDate(post.publishedAt))}</span>
                    </div>
                    <div class="buyer-blog-detail-item">
                      <small>Reading Time</small>
                      <span>${escapeHtml(String(post.readingMinutes))} minutes</span>
                    </div>
                  </div>
                  <div class="buyer-blog-tags">
                    ${renderTags(post)}
                  </div>
                </div>
                <div class="buyer-blog-cta-card">
                  <span class="buyer-blog-sidebar-label">Next Step</span>
                  <h2 class="buyer-blog-sidebar-title">Turn research into action</h2>
                  <p class="buyer-blog-sidebar-copy">If this topic matches what your team is evaluating, move from theory into scope, delivery planning, and the right product path for your business.</p>
                  <a href="${escapeHtml(post.ctaUrl || "contact.html")}" class="tg-btn-1">
                    <span>${escapeHtml(post.ctaLabel || "Talk to our team")}</span>
                    <svg preserveAspectRatio="none" viewBox="0 0 197 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M194 1H1V59H194V1Z" stroke="currentcolor" stroke-width="2"></path>
                      <path d="M193 59L130 1" stroke="currentcolor" stroke-width="2"></path>
                      <path d="M1 59L64 1" stroke="currentcolor" stroke-width="2"></path>
                    </svg>
                  </a>
                </div>
              </aside>
            </div>
            <div class="buyer-blog-related">
              <div class="section__title text-center mb-20">
                <span class="sub-title tg__animate-text">more buyer intent content</span>
                <h2 class="title">Related Articles</h2>
              </div>
              <div class="buyer-blog-related-grid">
                ${renderRelatedPosts(post)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  `;
}

function renderPage(post) {
  const canonicalUrl = `https://letsdocreative.com/${post.slug}.html`;
  const metaTitle = `${post.seoTitle} | Letsdo Creative`;
  const metaDescription = post.seoDescription;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: metaDescription,
    image: [absolutize(post.coverImage)],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      "@type": "Organization",
      name: post.author.name,
    },
    publisher: {
      "@type": "Organization",
      name: "Letsdo Creative",
      logo: {
        "@type": "ImageObject",
        url: "https://letsdocreative.com/assets/img/logo/logo.webp",
      },
    },
    mainEntityOfPage: canonicalUrl,
    keywords: (post.tags || []).map((tag) => tag.name).join(", "),
  };

  return `<!doctype html>
<html class="no-js" lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>${escapeHtml(metaTitle)}</title>
    <meta name="description" content="${escapeHtml(metaDescription)}">
    <link rel="canonical" href="${canonicalUrl}">
    <meta property="og:locale" content="en_IN">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(metaTitle)}">
    <meta property="og:description" content="${escapeHtml(metaDescription)}">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:site_name" content="Letsdo Creative">
    <meta property="og:image" content="${absolutize(post.coverImage)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(metaTitle)}">
    <meta name="twitter:description" content="${escapeHtml(metaDescription)}">
    <meta name="twitter:image" content="${absolutize(post.coverImage)}">
    <link rel="icon" type="image/png" href="assets/img/favicon.png">
    <link rel="shortcut icon" type="image/x-icon" href="assets/img/favicon.png">
    <link rel="apple-touch-icon" href="assets/img/favicon.png">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <script src="assets/js/tracking-loader.js"></script>
    <link rel="stylesheet" href="assets/css/bootstrap.min.css">
    <link rel="stylesheet" href="assets/css/animate.min.css">
    <link rel="stylesheet" href="assets/css/magnific-popup.css">
    <link rel="stylesheet" href="assets/css/fontawesome-all.min.css">
    <link rel="stylesheet" href="assets/css/swiper-bundle.min.css">
    <link rel="stylesheet" href="assets/css/tg-cursor.min.css">
    <link rel="stylesheet" href="assets/css/jquery-ui.css">
    <link rel="stylesheet" href="assets/css/odometer.css">
    <link rel="stylesheet" href="assets/css/slick.css">
    <link rel="stylesheet" href="assets/css/flaticon.min.css">
    <link rel="stylesheet" href="assets/css/spacing.css">
    <link rel="stylesheet" href="assets/css/main.min.css">
    <script src="assets/js/tg-page-head.min.js"></script>
    <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
    </script>
    ${articleStyles()}
</head>
<body>
${sharedHeader}
${renderMain(post)}
${sharedFooter}
</body>
</html>
`;
}

posts.forEach((post) => {
  const outputPath = path.join(rootDir, `${post.slug}.html`);
  fs.writeFileSync(outputPath, renderPage(post), "utf8");
});

console.log(`Generated ${posts.length} buyer-intent blog pages.`);
