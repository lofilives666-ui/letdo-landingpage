const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const INDEX_FILE = "index.html";
const INDEX_STYLE_FILE = "assets/css/index-page.min.css";
const INDEX_HEAD_SCRIPT_FILE = "assets/js/index-head.min.js";
const INDEX_FOOTER_SCRIPT_FILE = "assets/js/index-footer.min.js";
const BLOCK_MARKER = "seo-text-ratio-block";

const skipPages = new Set([
  "404.html",
  "blog-admin-editor.html",
  "blog-admin-login.html",
  "blog-admin.html",
  "blog.html",
  "cart.html",
  "checkout.html",
  "index-2.html",
  "index-3.html",
  "index-4.html",
  "index-5.html",
  "login.html",
  "reset-password.html",
  "shop-details.html",
  "shop.html",
  "sign-up.html",
  "tournament-details.html",
  "tournament.html",
]);

const groups = {
  game: new Set([
    "casual-game-development.html",
    "console-games.html",
    "mobile-game.html",
    "multiplayer-games.html",
    "pc-games.html",
    "play-to-earn-games.html",
    "telegram-games.html",
    "web-games.html",
  ]),
  immersive: new Set([
    "AR-game-development.html",
    "3D-interactive-environments.html",
    "augmented-reality-apps.html",
    "metaverse-development.html",
    "virtual-reality-experiences.html",
    "VR-game-development.html",
  ]),
  blockchain: new Set([
    "ICO.html",
    "IDO.html",
    "NFT-game-development.html",
    "smart-ontract-evelopment.html",
    "token-wallet-integration.html",
  ]),
  art: new Set([
    "2D-game-art.html",
    "3D-game-art.html",
    "animation-2D-3D.html",
    "character-design.html",
    "environment-design.html",
    "UI-UX.html",
  ]),
  web: new Set([
    "E-commerce-development.html",
    "backend-API-development.html",
    "landing-page-design.html",
    "web-app-evelopment.html",
    "website-development.html",
  ]),
  mobile: new Set([
    "android-app-development.html",
    "App-maintenance-index.html#contact",
    "cross-platform.html",
    "iOS-app-development.html",
    "UI-UX-for-mobile-apps.html",
  ]),
  creative: new Set([
    "brand-identity-design.html",
    "logo-design.html",
    "marketing-creatives.html",
    "presentation-design.html",
    "social-media-creatives.html",
  ]),
  video: new Set([
    "game-trailers.html",
    "motion-graphics.html",
    "promotional-videos.html",
    "reels-Shorts-editing.html",
    "youtube-video-editing.html",
  ]),
  marketing: new Set([
    "community-management.html",
    "content-creation.html",
    "influencer-marketing.html",
    "paid-ads-campaigns.html",
    "social-media-strategy.html",
  ]),
  product: new Set([
    "chatbot-crm-whitelable.html",
    "erp-whitelable.html",
  ]),
};

const pageSpecificContent = {
  "about-us.html": {
    title: "A delivery partner built around clarity, accountability, and long-term product support",
    paragraphs: [
      "Letsdo Creative is structured for businesses that want more than isolated execution. Our team supports digital products and launch initiatives across strategy, design, development, QA, release preparation, and growth-facing delivery so clients can move from concept to production with fewer blind spots and fewer disconnected handoffs.",
      "That operating model matters because modern digital work rarely stays inside one discipline. A product launch may need interface design, engineering support, campaign assets, social content, technical documentation, and post-launch refinement in the same delivery window. We help connect those requirements so decision-making stays faster, clearer, and more commercially relevant.",
      "Our work spans game development, immersive experiences, Web3 products, websites, mobile apps, ecommerce systems, white-label software, video assets, and campaign support. This range allows us to support founders, growing businesses, and enterprise teams that need one reliable partner across product delivery and market-facing execution.",
      "From Coimbatore, India, we collaborate with teams that value communication, production discipline, and outcome-focused execution. The goal is simple: create digital work that is easier to launch, easier to operate, and easier to improve over time.",
    ],
    bullets: [
      "Cross-functional support across product strategy, design, engineering, QA, and launch delivery.",
      "A workflow built to reduce project friction, hidden dependencies, and revision drag.",
      "Experience across product development, white-label systems, creative assets, and marketing support.",
      "Clear collaboration for businesses that need both speed and long-term maintainability.",
    ],
  },
  "services.html": {
    title: "Connected services for product delivery, launch support, and business growth",
    paragraphs: [
      "The Letsdo Creative service mix is designed for businesses that need connected digital execution rather than isolated task completion. Our work covers product planning, game development, AR and VR experiences, Web3 services, websites, mobile applications, ecommerce systems, design, motion, content, and marketing support that can move together around one business objective.",
      "This matters because product and growth work often overlap. A business may need engineering support, conversion-minded landing pages, launch videos, app design, community messaging, or white-label deployment guidance in the same timeline. We help clients manage those dependencies in a cleaner way so execution stays coordinated and easier to measure.",
      "Each service line is delivered with the same priorities: scope clarity, practical communication, milestone visibility, launch readiness, and the ability to improve after release. Whether the need is a one-off build or a longer operating partnership, our goal is to remove friction between idea, execution, and market impact.",
      "Clients use this service stack when they need one partner that can support product delivery and supporting assets together. That creates faster handoffs, stronger consistency, and better control over what gets built, launched, and improved next.",
    ],
    bullets: [
      "Product, engineering, design, launch, and growth support that can be planned together.",
      "Coverage across game, immersive, Web3, web, mobile, ecommerce, creative, and marketing workflows.",
      "Delivery systems shaped around milestones, review clarity, and measurable business outcomes.",
      "A practical service model for startups, agencies, brands, and scaling digital teams.",
    ],
  },
  "blog.html": {
    title: "Insights that support better product, launch, and growth decisions",
    paragraphs: [
      "The Letsdo Creative blog focuses on the decisions that sit between design, engineering, launch planning, and digital growth. We publish content for founders, product teams, marketers, and operators who want practical guidance around building, shipping, presenting, and scaling digital products in a more structured way.",
      "Topics cover game development, immersive experiences, Web3 execution, mobile and web delivery, ecommerce planning, design systems, white-label products, content production, and marketing support. The goal is not just to describe trends, but to make implementation choices easier to understand for teams working with real budgets, timelines, and launch pressures.",
      "That editorial approach supports the rest of the site as well. It gives clients and search audiences clearer context around how we think, how we deliver, and where our product and growth capabilities connect. Over time, it helps build topical authority around the services and industries we actively support.",
      "If you are researching a service, planning a launch, or looking for a delivery partner that understands both product execution and growth visibility, this knowledge base is designed to help you make better decisions before development and campaign work begins.",
    ],
    bullets: [
      "Articles focused on product planning, delivery tradeoffs, launch readiness, and digital growth.",
      "Coverage across games, AR and VR, Web3, mobile apps, web platforms, ecommerce, and white-label tools.",
      "Practical insights for founders, operators, product teams, and marketing stakeholders.",
      "Content that supports stronger internal linking, topical authority, and better search visibility.",
    ],
  },
};

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function write(file, content, eol = "\n") {
  const normalized = content.replace(/\r?\n/g, "\n").replace(/\n/g, eol);
  fs.writeFileSync(path.join(ROOT, file), normalized, "utf8");
}

function cleanText(value) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function titleCaseSlug(file) {
  return file
    .replace(/\.html$/i, "")
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
    .replace(/\bcrm\b/i, "CRM")
    .replace(/\berp\b/i, "ERP")
    .replace(/\bwhitelable\b/i, "White Label")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractHeading(html, file) {
  const matches = [
    /<div class="team__details-content">[\s\S]*?<span[^>]*class="sub-title"[^>]*>([\s\S]*?)<\/span>/i,
    /<div class="team__details-content">[\s\S]*?<h([1-6])[^>]*class="title"[^>]*>([\s\S]*?)<\/h\1>/i,
    /<div class="breadcrumb__content">[\s\S]*?<h([1-6])[^>]*class="title"[^>]*>([\s\S]*?)<\/h\1>/i,
    /<main[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<main[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i,
  ];

  for (const regex of matches) {
    const match = html.match(regex);
    if (!match) continue;
    const value = cleanText(match[match.length - 1]);
    if (value) return value;
  }

  return titleCaseSlug(file);
}

function detectGroup(file) {
  for (const [name, files] of Object.entries(groups)) {
    if (files.has(file)) return name;
  }
  return "generic";
}

function buildSharedBlock(file, heading) {
  const group = detectGroup(file);
  const headingText = heading.replace(/\s+/g, " ").trim();
  const lowerHeading = headingText.toLowerCase();
  const customPage = pageSpecificContent[file];

  const contentByGroup = {
    game: {
      title: `Reliable ${headingText} for launch-focused teams`,
      paragraphs: [
        `Our ${lowerHeading} work is built for studios, founders, and publishers that need a dependable production partner from concept to release. Letsdo Creative helps turn early ideas into scoped milestones, playable prototypes, art pipelines, technical planning, and launch-ready builds that support retention, monetization, and long-term product growth.`,
        `We keep discovery, gameplay iteration, visual design, engineering, QA, performance tuning, and release support connected in one workflow. That reduces handoff friction, shortens revision cycles, and gives product teams clearer visibility into priorities, blockers, timelines, and feature tradeoffs before they become costly.`,
        `Whether the goal is a new IP, a branded experience, a platform extension, or a white-label title, we focus on stable builds, clear communication, and measurable progress at every milestone. Teams choose us when they want production discipline, flexible collaboration, and post-launch support without losing speed.`,
      ],
      bullets: [
        "Discovery, production planning, and milestone mapping tied to business goals.",
        "Gameplay, UI, backend, QA, optimization, and launch support in one delivery track.",
        "Clear documentation, feedback loops, and practical post-release iteration planning.",
      ],
    },
    immersive: {
      title: `Practical ${headingText} that supports product and brand goals`,
      paragraphs: [
        `Our ${lowerHeading} services are designed for teams that need more than a visual demo. Letsdo Creative plans immersive products around real use cases such as training, engagement, simulation, sales enablement, visualization, product storytelling, and interactive experiences that need to perform well across devices and environments.`,
        `We connect concept development, spatial UX, asset planning, engineering, testing, and deployment support so immersive work stays usable, maintainable, and commercially relevant. That means less guesswork during production and a stronger link between creative direction, technical constraints, and the end-user experience.`,
        `From activation concepts to full product builds, we help teams define scope early, reduce avoidable rework, and move toward launch with better visibility into content needs, integration requirements, device behavior, and long-term support expectations.`,
      ],
      bullets: [
        "Experience planning around user journeys, environments, and device constraints.",
        "3D content, interaction design, engineering, QA, and deployment guidance.",
        "Support for prototypes, pilot rollouts, production launches, and future iteration.",
      ],
    },
    blockchain: {
      title: `${headingText} with delivery discipline and product clarity`,
      paragraphs: [
        `Our ${lowerHeading} services are structured for founders and product teams that need Web3 execution with practical delivery controls. Letsdo Creative helps translate token, wallet, marketplace, and blockchain concepts into scoped product decisions, cleaner technical planning, and release-ready user flows that reduce confusion for both teams and end users.`,
        `We focus on business logic, integration planning, user experience, engineering coordination, QA, and launch support so product teams can move faster without disconnecting strategy from implementation. That approach is especially useful when requirements span smart contracts, onboarding, payments, gaming, community access, or loyalty mechanics.`,
        `Instead of treating Web3 work as isolated technical tasks, we align functionality with trust, usability, compliance awareness, and long-term maintainability. That gives teams a more realistic path from idea validation to production, iteration, and operational handoff.`,
      ],
      bullets: [
        "Feature scoping, flow design, integration planning, and release support.",
        "Wallet, token, marketplace, and product UX decisions shaped around usability.",
        "A delivery approach that balances experimentation with stability and clarity.",
      ],
    },
    art: {
      title: `${headingText} created for usable, production-ready delivery`,
      paragraphs: [
        `Our ${lowerHeading} services are designed for teams that need artwork and interface decisions that hold up in real production. Letsdo Creative combines concept alignment, visual direction, asset planning, usability thinking, and revision control so creative output stays consistent across product, marketing, and launch requirements.`,
        `We support teams that need style exploration, production art, motion support, interface polish, and system-level consistency without losing momentum. That includes coordinating visual decisions with development realities, gameplay needs, branding goals, and stakeholder feedback cycles.`,
        `The result is not just attractive presentation. It is a clearer path from rough concept to approved production assets, stronger design continuity, and less rework during implementation, testing, and future content expansion.`,
      ],
      bullets: [
        "Concept framing, visual system planning, production assets, and feedback loops.",
        "Design work that stays aligned with implementation, performance, and usability.",
        "Support for product interfaces, game art, campaigns, and launch asset handoff.",
      ],
    },
    web: {
      title: `${headingText} for teams that need dependable web delivery`,
      paragraphs: [
        `Our ${lowerHeading} services support businesses that need websites and web products with clearer scope, stronger usability, and cleaner implementation. Letsdo Creative connects discovery, architecture, interface planning, development, testing, launch, and improvement work so web delivery stays tied to real product and growth goals.`,
        `We help product teams and business owners move from idea validation to release without losing visibility into content needs, technical tradeoffs, integrations, or conversion priorities. That is especially valuable when timelines are tight and the same project must balance brand, performance, and operational needs.`,
        `From marketing-led pages to custom product builds, we focus on maintainable structure, user-friendly journeys, and launch readiness. Teams choose us when they want a partner that can think through scope, build cleanly, and support long-term iteration rather than just ship a first version.`,
      ],
      bullets: [
        "Discovery, architecture, design, engineering, QA, and launch support.",
        "Clear workflows for content, CMS, commerce, API, and conversion-focused pages.",
        "Post-launch optimization, maintenance, and documentation that reduce future friction.",
      ],
    },
    mobile: {
      title: `${headingText} with product thinking, QA, and launch support`,
      paragraphs: [
        `Our ${lowerHeading} services are built for startups and enterprises that need mobile delivery with fewer blind spots. Letsdo Creative helps teams plan features, validate user journeys, align design and engineering, manage releases, and support continuous improvement without losing speed or clarity.`,
        `We combine product design, platform planning, development, testing, release preparation, and maintenance support in one process so teams can make better decisions earlier. That improves handoff quality, reduces rework, and keeps product goals connected to performance, usability, and long-term maintainability.`,
        `Whether the requirement is a new app, a platform refresh, or ongoing support, we focus on reliable execution, transparent collaboration, and realistic planning. The goal is to help teams move from concept to production with fewer surprises and better launch readiness.`,
      ],
      bullets: [
        "Product scoping, UX planning, development, QA, store-readiness, and support.",
        "Alignment across design, engineering, release management, and iteration planning.",
        "A delivery model built for clarity, maintainability, and measurable product progress.",
      ],
    },
    creative: {
      title: `${headingText} that supports growth, recognition, and consistency`,
      paragraphs: [
        `Our ${lowerHeading} services are shaped for teams that need creative work to do more than look polished. Letsdo Creative builds brand and campaign assets that help businesses communicate clearly, stay visually consistent, and support marketing, sales, product, and launch activities across multiple channels.`,
        `We align messaging, visual direction, design systems, execution timelines, and stakeholder feedback so creative output stays useful in real production settings. That means less fragmentation between brand goals and day-to-day asset creation, and stronger continuity across campaigns, presentations, digital experiences, and launch materials.`,
        `When teams need speed without losing quality, we help define the right scope, protect consistency, and deliver assets that can be reused, extended, and adapted over time. That makes creative delivery easier to manage and easier to scale.`,
      ],
      bullets: [
        "Brand framing, campaign asset planning, design execution, and iteration support.",
        "Creative systems that stay consistent across channels, teams, and delivery stages.",
        "Output designed for practical use in product launches, marketing, and sales workflows.",
      ],
    },
    video: {
      title: `${headingText} built for messaging, momentum, and launch impact`,
      paragraphs: [
        `Our ${lowerHeading} services are planned for teams that need video output with a clear purpose. Letsdo Creative helps shape story structure, asset planning, editing direction, motion treatment, review cycles, and channel fit so each video supports a larger product, campaign, or brand goal.`,
        `We work across trailers, promotional content, shorts, motion graphics, and social-first edits with an emphasis on clarity, pacing, and production efficiency. That helps teams move from raw ideas or source files to final delivery without losing control over messaging, quality, or turnaround expectations.`,
        `For product launches, portfolio showcases, and performance-led campaigns, we focus on videos that are easier to approve, easier to repurpose, and better aligned with the audience action you want next. That is where stronger planning pays off.`,
      ],
      bullets: [
        "Concept shaping, editing direction, motion support, and launch-ready delivery.",
        "Video workflows aligned to product demos, campaigns, trailers, and social growth.",
        "Review systems that reduce revision drag and improve clarity across stakeholders.",
      ],
    },
    marketing: {
      title: `${headingText} with clearer planning, execution, and reporting alignment`,
      paragraphs: [
        `Our ${lowerHeading} services are designed for brands that want stronger execution without disconnected channel work. Letsdo Creative helps businesses align audience goals, messaging, creative needs, campaign structure, and optimization priorities so marketing delivery feels deliberate rather than reactive.`,
        `We support planning, asset coordination, rollout execution, testing, and iteration with an emphasis on measurable movement. That can include campaign setup, organic content systems, community programs, performance-led improvements, and clearer decision-making around what to scale, pause, or refine.`,
        `When teams need a partner that can move between strategy and execution, we focus on communication, consistency, and operational clarity. The result is marketing work that is easier to manage, easier to improve, and better connected to business outcomes.`,
      ],
      bullets: [
        "Campaign and channel planning tied to audience goals and delivery priorities.",
        "Creative, content, rollout, optimization, and reporting-minded execution support.",
        "A workflow built to improve consistency, responsiveness, and measurable progress.",
      ],
    },
    product: {
      title: `${headingText} for businesses that need usable white-label delivery`,
      paragraphs: [
        `Our ${lowerHeading} services support founders, agencies, and operators that need white-label products with clear scope and reliable handoff. Letsdo Creative helps turn feature ideas into usable workflows, delivery plans, implementation priorities, and launch-ready product experiences that are easier to deploy and easier to grow.`,
        `We focus on product structure, branding flexibility, user journeys, engineering coordination, QA, and post-launch thinking so the final system works in real client and team environments. That is especially important when a product has to support demos, onboarding, recurring use, and future customization.`,
        `Teams choose us when they need product delivery that balances speed with maintainability. By aligning design, development, support planning, and business use cases early, we reduce unnecessary rework and create a stronger base for future expansion.`,
        `A good white-label product has to serve more than the initial launch. It should be easier to present, easier to brand, easier to onboard, and easier to extend as client requirements change. That is why we treat implementation, documentation, support readiness, and deployment clarity as part of the same delivery conversation rather than separate follow-up tasks.`,
      ],
      bullets: [
        "White-label planning across features, onboarding, branding, and release readiness.",
        "Product UX, engineering, QA, and handoff support shaped around real operations.",
        "A practical delivery model for launches, demos, client deployments, and iteration.",
        "Clear documentation and rollout support for teams managing future customization and growth.",
      ],
    },
    generic: {
      title: `${headingText} with clearer scope, delivery, and long-term support`,
      paragraphs: [
        `Letsdo Creative approaches ${lowerHeading} work with a focus on practical delivery, stronger communication, and measurable business value. We help teams connect discovery, planning, design, development, review cycles, launch support, and future improvements so progress is easier to track and easier to maintain.`,
        `That matters because most product and service work breaks down when scope, ownership, or priorities become unclear. Our process is built to reduce that friction by aligning stakeholder expectations, implementation choices, and end-user goals early enough to prevent avoidable rework later.`,
        `Whether the requirement is a new launch, a refresh, or a support engagement, we focus on stable execution, clear feedback loops, and outcomes that can be improved after release. That combination helps teams move faster without sacrificing long-term quality.`,
      ],
      bullets: [
        "Clear planning, execution, QA, launch support, and iterative improvement.",
        "A workflow designed to reduce friction between idea, implementation, and rollout.",
        "Support that balances speed, maintainability, usability, and business goals.",
      ],
    },
  };

  const content = customPage || contentByGroup[group] || contentByGroup.generic;
  const listItems = content.bullets
    .map((item) => `                    <li>${item}</li>`)
    .join("\n");
  const paragraphs = content.paragraphs
    .map((paragraph) => `                <p class="mb-20">${paragraph}</p>`)
    .join("\n");

  return `
        <!-- ${BLOCK_MARKER}:start -->
        <section class="section-pt-120 section-pb-120">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-xl-10">
                        <div class="section__title text-center mb-40">
                            <span class="sub-title tg__animate-text">delivery, scope, and business fit</span>
                            <h3 class="title">${content.title}</h3>
                        </div>
                        <div class="seo-copy__content">
${paragraphs}
                            <ul class="mb-20">
${listItems}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- ${BLOCK_MARKER}:end -->
`;
}

function buildHomeBlock() {
  return `
        <!-- ${BLOCK_MARKER}:start -->
        <section class="section-pt-120 section-pb-120">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-xl-10">
                        <div class="section__title text-center mb-40">
                            <span class="sub-title tg__animate-text">company overview and delivery model</span>
                            <h3 class="title">A practical product and growth partner for modern digital teams</h3>
                        </div>
                        <div class="seo-copy__content">
                            <p class="mb-20">Letsdo Creative works with startups, founders, agencies, product teams, and established businesses that need digital execution with stronger structure behind it. Our work spans game development, AR and VR experiences, Web3 products, mobile apps, web platforms, ecommerce systems, design services, marketing assets, and white-label products that can be adapted for different customer or business needs. What ties these engagements together is not just the technology stack. It is the need for clear scoping, visible progress, launch readiness, and support that continues after the first version goes live.</p>
                            <p class="mb-20">We do not treat product delivery as a sequence of disconnected tasks. Discovery, planning, design, development, QA, optimization, launch preparation, and iteration all influence each other. When those steps are separated too late or handled by disconnected teams, businesses lose time, rebuild features, and struggle to keep product goals aligned with actual implementation. Our process is meant to reduce that risk. We help teams define requirements early, understand tradeoffs before engineering work expands, and move through production with better visibility into priorities, dependencies, and decision points.</p>
                            <p class="mb-20">Teams usually come to Letsdo Creative for one of three reasons. They are building something new and need an end-to-end delivery partner. They have an existing product or service that needs a sharper execution layer. Or they have multiple digital requirements across design, engineering, and growth and want one operating partner that can connect those pieces without creating extra management overhead. In each case, our role is to create a cleaner path from concept to production and from production to measurable improvement.</p>
                            <h4 class="mb-20">What we build and support</h4>
                            <p class="mb-20">On the product side, our capabilities cover mobile game development, browser-based experiences, multiplayer systems, AR and VR use cases, metaverse-related builds, blockchain-enabled experiences, token and wallet integrations, ecommerce storefronts, custom web apps, backend and API systems, landing pages, branding assets, trailers, motion content, and campaign execution support. We also build white-label products such as business tools and industry-focused software that need branding flexibility, product clarity, and reliable deployment support. This breadth is useful for clients because product decisions, launch content, design systems, and acquisition workflows often need to move together rather than in isolation.</p>
                            <ul class="mb-20">
                                <li>Game, immersive, and Web3 development aligned to product goals and production feasibility.</li>
                                <li>Web, mobile, ecommerce, and backend delivery that supports usability, growth, and maintainability.</li>
                                <li>Brand, creative, video, and marketing execution that strengthens launch quality and campaign continuity.</li>
                                <li>White-label systems built for onboarding, customization, demos, client deployment, and future iteration.</li>
                            </ul>
                            <h4 class="mb-20">Who we work with</h4>
                            <p class="mb-20">Our clients range from early-stage founders validating a new concept to established companies improving an existing product line, service experience, or marketing engine. Some need a technical partner that can also think through design and usability. Others need creative and launch support backed by product understanding. Many operate across India and international markets, which means delivery has to account for speed, communication, budget reality, and practical rollout planning. Because we are based in Coimbatore, India, we are also positioned to support businesses that want a local execution partner with broader digital delivery capabilities.</p>
                            <p class="mb-20">That local presence matters for SEO and business credibility, but it also matters operationally. A client looking for a game development company in Coimbatore, a web development company in India, or a mobile app partner that can manage white-label delivery often needs more than a vendor relationship. They need timely communication, scope clarity, and a delivery model that can scale from one project into an ongoing operating partnership. Our work is structured to support that kind of continuity.</p>
                            <h4 class="mb-20">How we deliver</h4>
                            <p class="mb-20">A typical engagement starts with discovery and scoping. We clarify the business objective, audience, product requirements, technical constraints, content needs, and delivery priorities. From there we move into a more concrete production plan that covers milestones, dependencies, review points, and the output expected at each stage. This is where many projects become easier to manage, because assumptions are documented earlier and stakeholders can see where a decision affects design, engineering, QA, or launch timing.</p>
                            <p class="mb-20">Once production begins, we work across the disciplines required for the outcome: design direction, visual systems, development, gameplay or feature implementation, integrations, QA, performance review, and deployment preparation. Our focus is not just on finishing a scope document. It is on getting the finished work into a state where the client can launch, operate, present, market, and iterate with confidence. That is why documentation, handoff clarity, and support planning remain part of the delivery conversation rather than an afterthought.</p>
                            <ul class="mb-20">
                                <li>Discovery that clarifies scope, business goals, user needs, and implementation constraints.</li>
                                <li>Milestone planning that makes progress visible and reduces rework during production.</li>
                                <li>Integrated design, development, QA, and launch support instead of fragmented handoffs.</li>
                                <li>Post-launch improvements focused on performance, clarity, usability, and growth readiness.</li>
                            </ul>
                            <p class="mb-20">We also pay attention to the practical side of growth. Search visibility, landing page clarity, internal linking, structured content, supporting creative, and launch assets all matter because even a strong product can struggle if its digital presentation is weak. The same is true in reverse: marketing can create attention, but the underlying product still has to support user expectations. Our advantage is that we work across both sides of that equation, which helps clients make better tradeoffs between experience quality, development effort, and commercial priorities.</p>
                            <p class="mb-0">For businesses evaluating Letsdo Creative, the key takeaway is straightforward. We are built to support digital teams that need dependable execution, not just isolated deliverables. Whether the requirement is a new game, an immersive product, a commerce platform, a mobile application, a campaign-ready creative system, or a white-label product that can be deployed under multiple brands, we focus on making the work usable, launchable, and easier to improve over time. That is the operating standard behind every page, service, and product represented on this site.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <!-- ${BLOCK_MARKER}:end -->
`;
}

function insertBeforeAnchor(html, block, anchors) {
  if (html.includes(BLOCK_MARKER)) {
    return html.replace(
      new RegExp(`<!-- ${BLOCK_MARKER}:start -->[\\s\\S]*?<!-- ${BLOCK_MARKER}:end -->`, "i"),
      block.trim()
    );
  }

  for (const anchor of anchors) {
    if (html.includes(anchor)) {
      return html.replace(anchor, `${block}\n${anchor}`);
    }
  }

  return html.replace("</main>", `${block}\n    </main>`);
}

function enhanceIndex() {
  let html = read(INDEX_FILE);
  const eol = html.includes("\r\n") ? "\r\n" : "\n";

  const styleMatch = html.match(/<style>\s*([\s\S]*?)\s*<\/style>/i);
  if (styleMatch) {
    write(INDEX_STYLE_FILE, styleMatch[1], "\n");
    html = html.replace(
      /<style>\s*[\s\S]*?\s*<\/style>/i,
      `    <link rel="stylesheet" href="${INDEX_STYLE_FILE}">`
    );
  }

  const plainScriptRegex = /<script>\s*([\s\S]*?)\s*<\/script>/g;
  const plainMatches = [...html.matchAll(plainScriptRegex)];
  if (plainMatches.length >= 6) {
    const headScripts = plainMatches.slice(0, 3).map((match) => match[1].trim()).join("\n\n");
    const footerScripts = plainMatches.slice(3).map((match) => match[1].trim()).join("\n\n");

    write(INDEX_HEAD_SCRIPT_FILE, headScripts, "\n");
    write(INDEX_FOOTER_SCRIPT_FILE, footerScripts, "\n");

    let matchIndex = 0;
    let headInserted = false;
    let footerInserted = false;
    html = html.replace(plainScriptRegex, () => {
      matchIndex += 1;
      if (matchIndex <= 3) {
        if (headInserted) return "";
        headInserted = true;
        return `    <script src="${INDEX_HEAD_SCRIPT_FILE}"></script>`;
      }
      if (footerInserted) return "";
      footerInserted = true;
      return `    <script src="${INDEX_FOOTER_SCRIPT_FILE}"></script>`;
    });
  }

  html = insertBeforeAnchor(html, buildHomeBlock(), [
    "<!-- faq-area -->",
    "<!-- contact-area -->",
  ]);

  write(INDEX_FILE, html, eol);
}

function improvePublicPages() {
  const files = fs
    .readdirSync(ROOT)
    .filter((file) => file.endsWith(".html") && file !== INDEX_FILE && !skipPages.has(file))
    .sort();

  for (const file of files) {
    let html = read(file);
    const eol = html.includes("\r\n") ? "\r\n" : "\n";
    const heading = extractHeading(html, file);
    const block = buildSharedBlock(file, heading);
    html = insertBeforeAnchor(html, block, [
      "<!-- contact-area -->",
      "<!-- social-area -->",
      "<!-- footer-area-start -->",
    ]);
    write(file, html, eol);
  }
}

function main() {
  enhanceIndex();
  improvePublicPages();
}

main();
