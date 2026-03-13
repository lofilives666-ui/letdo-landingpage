const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const SITE_URL = "https://www.letsdocreative.com";

const noindexPages = new Set([
  "404.html",
  "blog-details.html",
  "cart.html",
  "checkout.html",
  "index-2.html",
  "index-3.html",
  "index-4.html",
  "index-5.html",
  "login.html",
  "reset-password.html",
  "services-details.html",
  "shop.html",
  "shop-details.html",
  "sign-up.html",
  "team-details.html",
  "tournament-details.html",
  "tournament.html",
  "VR-game-development copy.html",
]);

const specialMeta = {
  "index.html": {
    title: "Letsdo Creative | Game Development, AR/VR, Web3 & Ecommerce",
    description:
      "Letsdo Creative builds game, AR/VR, Web3, mobile app, and ecommerce white-label solutions for startups and enterprises in India.",
    ogDescription:
      "Build and scale with Letsdo Creative: game development, AR/VR, Web3, AI products, and ecommerce white-label solutions.",
  },
  "about-us.html": {
    title: "About Letsdo Creative | Game Development and Digital Product Studio",
    description:
      "Learn about Letsdo Creative, a studio delivering game development, AR/VR, mobile app, web, and white-label product services for modern brands.",
  },
  "services.html": {
    title: "Services | Letsdo Creative",
    description:
      "Explore Letsdo Creative services across game development, AR/VR, Web3, app development, design, marketing, and white-label digital products.",
  },
  "contact.html": {
    title: "Contact Letsdo Creative | Start Your Project",
    description:
      "Contact Letsdo Creative to discuss game development, AR/VR, web, mobile, ecommerce, and white-label product requirements.",
  },
  "blog.html": {
    title: "Insights and Updates | Letsdo Creative",
    description:
      "Read Letsdo Creative insights on game development, product design, AR/VR, Web3, mobile apps, and digital growth.",
  },
};

const serviceTypeMap = [
  {
    files: new Set([
      "casual-game-development.html",
      "hyper-casual-games.html",
      "casino-games.html",
      "mini-games.html",
      "mobile-game.html",
      "web-games.html",
      "pc-games.html",
      "console-games.html",
      "multiplayer-games.html",
      "telegram-games.html",
      "play-to-earn-games.html",
    ]),
    suffix: "Game Development",
    description: (heading) =>
      `Letsdo Creative delivers ${heading.toLowerCase()} solutions with production-ready design, development, optimization, and launch support for web and mobile products.`,
  },
  {
    files: new Set([
      "VR-game-development.html",
      "AR-game-development.html",
      "metaverse-development.html",
      "virtual-reality-experiences.html",
      "augmented-reality-apps.html",
      "3D-interactive-environments.html",
    ]),
    suffix: "AR/VR Services",
    description: (heading) =>
      `Letsdo Creative builds ${heading.toLowerCase()} experiences for immersive products, branded activations, simulations, and interactive environments.`,
  },
  {
    files: new Set([
      "NFT-game-development.html",
      "smart-ontract-evelopment.html",
      "token-wallet-integration.html",
      "IDO.html",
      "ICO.html",
    ]),
    suffix: "Blockchain Services",
    description: (heading) =>
      `Letsdo Creative provides ${heading.toLowerCase()} support for Web3 products, token ecosystems, blockchain gaming, and wallet-enabled platforms.`,
  },
  {
    files: new Set([
      "3D-game-art.html",
      "2D-game-art.html",
      "character-design.html",
      "environment-design.html",
      "animation-2D-3D.html",
      "UI-UX.html",
    ]),
    suffix: "Design Services",
    description: (heading) =>
      `Letsdo Creative offers ${heading.toLowerCase()} for games and digital products, combining production artwork, visual systems, motion, and usability-focused design.`,
  },
  {
    files: new Set([
      "website-development.html",
      "web-app-evelopment.html",
      "landing-page-design.html",
      "CMS-development.html",
      "E-commerce-development.html",
      "backend-API-development.html",
    ]),
    suffix: "Web Development Services",
    description: (heading) =>
      `Letsdo Creative delivers ${heading.toLowerCase()} with scalable architecture, responsive UI, CMS support, and conversion-focused implementation.`,
  },
  {
    files: new Set([
      "android-app-development.html",
      "iOS-app-development.html",
      "cross-platform.html",
      "UI-UX-for-mobile-apps.html",
      "App-maintenance-support.html",
    ]),
    suffix: "Mobile App Services",
    description: (heading) =>
      `Letsdo Creative provides ${heading.toLowerCase()} for startups and enterprises, covering product design, development, QA, release, and ongoing support.`,
  },
  {
    files: new Set([
      "logo-design.html",
      "brand-identity-design.html",
      "marketing-creatives.html",
      "social-media-creatives.html",
      "presentation-design.html",
    ]),
    suffix: "Creative Design Services",
    description: (heading) =>
      `Letsdo Creative creates ${heading.toLowerCase()} for brands that need clear messaging, strong visuals, and campaign-ready design assets.`,
  },
  {
    files: new Set([
      "promotional-videos.html",
      "game-trailers.html",
      "motion-graphics.html",
      "reels-Shorts-editing.html",
      "youtube-video-editing.html",
    ]),
    suffix: "Video Services",
    description: (heading) =>
      `Letsdo Creative delivers ${heading.toLowerCase()} for product launches, brand storytelling, gameplay showcases, and social-first video campaigns.`,
  },
  {
    files: new Set([
      "social-media-strategy.html",
      "content-creation.html",
      "paid-ads-campaigns.html",
      "influencer-marketing.html",
      "community-management.html",
    ]),
    suffix: "Marketing Services",
    description: (heading) =>
      `Letsdo Creative supports ${heading.toLowerCase()} with execution across planning, creative production, distribution, optimization, and audience growth.`,
  },
];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function write(file, content, eol) {
  const normalized = content.replace(/\r?\n/g, "\n").replace(/\n/g, eol);
  fs.writeFileSync(path.join(ROOT, file), normalized, "utf8");
}

function cleanText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function titleCaseSlug(file) {
  const slug = file.replace(/\.html$/i, "");
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\bui ux\b/i, "UI UX")
    .replace(/\bar\b/i, "AR")
    .replace(/\bvr\b/i, "VR")
    .replace(/\bico\b/i, "ICO")
    .replace(/\bido\b/i, "IDO")
    .replace(/\bnft\b/i, "NFT")
    .replace(/\bios\b/i, "iOS")
    .replace(/\bapi\b/i, "API")
    .replace(/\bcms\b/i, "CMS")
    .replace(/\b2d\b/i, "2D")
    .replace(/\b3d\b/i, "3D")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractHeading(html, file) {
  const breadcrumbMatch = html.match(
    /<div class="breadcrumb__content">[\s\S]*?<h([1-6])[^>]*class="title"[^>]*>([\s\S]*?)<\/h\1>/i
  );
  if (breadcrumbMatch) return cleanText(breadcrumbMatch[2]);

  const mainMatch =
    html.match(/<main[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<main[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (mainMatch) return cleanText(mainMatch[1]);

  return titleCaseSlug(file);
}

function getUrl(file) {
  return file === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${file}`;
}

function getMeta(file, html) {
  if (specialMeta[file]) {
    const meta = specialMeta[file];
    return {
      title: meta.title,
      description: meta.description,
      ogDescription: meta.ogDescription || meta.description,
    };
  }

  const heading = extractHeading(html, file);
  const serviceType = serviceTypeMap.find((entry) => entry.files.has(file));
  if (serviceType) {
    const normalizedHeading = heading.replace(/\s+/g, " ").trim();
    return {
      title: /letsdo creative/i.test(normalizedHeading)
        ? normalizedHeading
        : `${normalizedHeading} | Letsdo Creative`,
      description: serviceType.description(normalizedHeading),
      ogDescription: serviceType.description(normalizedHeading),
    };
  }

  const fallbackHeading = extractHeading(html, file);
  return {
    title: `${fallbackHeading} | Letsdo Creative`,
    description: `Explore ${fallbackHeading.toLowerCase()} at Letsdo Creative with tailored delivery for digital products, marketing, and launch-ready experiences.`,
    ogDescription: `Explore ${fallbackHeading.toLowerCase()} at Letsdo Creative with tailored delivery for digital products, marketing, and launch-ready experiences.`,
  };
}

function replaceHeadMeta(file, html, robotsValue) {
  const meta = getMeta(file, html);
  const canonical = getUrl(file);
  const metaBlock = [
    `    <title>${meta.title}</title>`,
    `    <meta name="description" content="${meta.description}">`,
    robotsValue ? `    <meta name="robots" content="${robotsValue}">` : null,
    `    <link rel="canonical" href="${canonical}">`,
    `    <meta property="og:locale" content="en_US">`,
    `    <meta property="og:type" content="website">`,
    `    <meta property="og:title" content="${meta.title}">`,
    `    <meta property="og:description" content="${meta.ogDescription}">`,
    `    <meta property="og:url" content="${canonical}">`,
    `    <meta property="og:site_name" content="Letsdo Creative">`,
    `    <meta property="og:image" content="${SITE_URL}/assets/img/logo/logo.webp">`,
    `    <meta name="twitter:card" content="summary_large_image">`,
    `    <meta name="twitter:title" content="${meta.title}">`,
    `    <meta name="twitter:description" content="${meta.ogDescription}">`,
    `    <meta name="twitter:image" content="${SITE_URL}/assets/img/logo/logo.webp">`,
    `    <link rel="icon" type="image/png" href="assets/img/favicon.png">`,
    `    <link rel="shortcut icon" type="image/x-icon" href="assets/img/favicon.png">`,
    `    <link rel="apple-touch-icon" href="assets/img/favicon.png">`,
  ]
    .filter(Boolean)
    .join("\n");

  html = html
    .replace(/^\s*<title>[\s\S]*?<\/title>\s*$/gim, "")
    .replace(/^\s*<meta name="description"[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<meta name="keywords"[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<meta name="robots"[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<link rel="canonical"[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<meta property="og:[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<meta name="twitter:[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<link rel="icon"[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<link rel="shortcut icon"[\s\S]*?$\r?\n?/gim, "")
    .replace(/^\s*<link rel="apple-touch-icon"[\s\S]*?$\r?\n?/gim, "");

  const withMeta = html.replace(
    /(<meta http-equiv=["']x-ua-compatible["'] content=["']ie=edge["']>\s*)/i,
    `$1${metaBlock}\n`
  );

  if (withMeta !== html) return withMeta;

  return html.replace(
    /(<meta charset=["'][^"']+["']>\s*)/i,
    `$1${metaBlock}\n`
  );
}

function promoteBreadcrumbHeading(html) {
  if (/<main[\s\S]*?<h1[^>]*>/i.test(html)) return html;

  return html.replace(
    /(<div class="breadcrumb__content">[\s\S]*?)<h2([^>]*class="title"[^>]*)>([\s\S]*?)<\/h2>/i,
    (_, prefix, attrs, inner) => `${prefix}<h1${attrs}>${inner}</h1>`
  );
}

function removeUrlsFromSitemap(xml, urlsToRemove) {
  let output = xml;
  for (const file of urlsToRemove) {
    const url = file === "index.html" ? `${SITE_URL}/` : `${SITE_URL}/${file}`;
    const pattern = new RegExp(
      `\\s*<url>\\s*<loc>${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</loc>[\\s\\S]*?<\\/url>\\s*`,
      "g"
    );
    output = output.replace(pattern, "\n");
  }
  return output.replace(/\n{3,}/g, "\n\n");
}

function main() {
  const htmlFiles = fs
    .readdirSync(ROOT)
    .filter((file) => file.endsWith(".html"));

  for (const file of htmlFiles) {
    let html = read(file);
    const eol = html.includes("\r\n") ? "\r\n" : "\n";
    const robotsValue = noindexPages.has(file) ? "noindex,follow" : "";
    html = replaceHeadMeta(file, html, robotsValue);
    if (!noindexPages.has(file)) {
      html = promoteBreadcrumbHeading(html);
    }

    html = html.replace("href=\"Play-to-Earn.html\"", 'href="play-to-earn-games.html"');
    if (file === "index.html") {
      html = html.replace('href="cart.html">Ecommerce</a>', 'href="whitelable/ecommerce/">Ecommerce</a>');
      html = html.replace(/href="Blog\.html"/g, 'href="blog.html"');
      html = html.replace(/href="Portfolio\.html"/g, 'href="services.html"');
      html = html.replace(/href="Careers\.html"/g, 'href="contact.html"');
    }

    write(file, html, eol);
  }

  const sitemapPath = path.join(ROOT, "sitemap.xml");
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const sitemapEol = sitemap.includes("\r\n") ? "\r\n" : "\n";
  const updatedSitemap = removeUrlsFromSitemap(sitemap, [...noindexPages].filter((file) => !/^index-[2-5]\.html$|404\.html$|VR-game-development copy\.html$/i.test(file)));
  fs.writeFileSync(
    sitemapPath,
    updatedSitemap.replace(/\r?\n/g, "\n").replace(/\n/g, sitemapEol),
    "utf8"
  );
}

main();
