const { prisma } = require("../lib/blog-prisma");
const { hashPassword } = require("../lib/blog-auth");
const { slugify, calculateReadingMinutes } = require("../lib/blog-utils");
const {
  letsdoCategoryDefinitions,
  letsdoTagDefinitions,
  ensureDefaultBlogCategories,
  ensureDefaultBlogTags,
} = require("../lib/blog-taxonomy");

const samplePosts = [
  {
    title: "How White Label Casino Products Reduce Time to Market",
    category: "White Label Products",
    tags: ["white-label", "casino-games", "growth-marketing"],
    featured: true,
    excerpt:
      "White label casino products help operators launch faster with proven game flows, wallet integrations, and branded frontend experiences.",
    seoTitle: "White Label Casino Products for Faster Launches",
    seoDescription:
      "See how white label casino products reduce build time and help brands launch faster with proven systems and flexible customization.",
    content:
      "Introduction\n\nWhite label casino products help teams avoid rebuilding common game and wallet systems from scratch.\n\nWhy teams choose white label\n\nOperators save time on infrastructure, reduce production risk, and focus more on branding, acquisition, and retention.\n\nWhat matters before launch\n\nThe product should support compliance, payment flexibility, responsive frontends, and clear content operations.\n\nHow Letsdo approaches launch readiness\n\nLetsdo combines product setup, visual customization, and marketing support so brands can move from concept to release with less friction.\n\nConclusion\n\nA strong white label foundation shortens delivery cycles and creates more room for differentiated growth.",
  },
  {
    title: "Building a Better Casino Lobby Experience for Retention",
    category: "Casino Game Development",
    tags: ["casino-lobby", "casino-games", "ui-ux"],
    excerpt:
      "A strong casino lobby improves discovery, promotes games intelligently, and helps operators retain players through smoother navigation.",
    seoTitle: "Casino Lobby UX Strategies for Better Retention",
    seoDescription:
      "Learn how smart casino lobby design can improve discovery, retention, and revenue across white label and custom gaming products.",
    content:
      "Introduction\n\nThe casino lobby is where first impressions are made.\n\nWhy lobby design matters\n\nPlayers need fast access to categories, promotions, favorites, and live experiences without friction.\n\nOperational benefits\n\nA well-structured lobby improves session depth, campaign visibility, and cross-sell performance.\n\nLetsdo perspective\n\nWe design lobbies around retention data, content placement, and branded navigation patterns.\n\nConclusion\n\nLobby design is not decoration. It directly shapes conversion and long-term player engagement.",
  },
  {
    title: "Retention Loops That Power Casual and Hyper Casual Games",
    category: "Casual and Hyper Casual Games",
    tags: ["casual-games", "hyper-casual", "growth-marketing"],
    excerpt:
      "The best casual games combine fast onboarding with smart retention loops that keep players coming back every day.",
    seoTitle: "Casual Game Retention Loops That Increase Replay",
    seoDescription:
      "Explore the retention systems and progression hooks used to improve replay value in casual and hyper casual games.",
    content:
      "Introduction\n\nCasual and hyper casual products live or die on session quality.\n\nKey retention loops\n\nReward timing, progression systems, light competition, and event-based re-engagement all shape replay value.\n\nDesign considerations\n\nThe loop must feel rewarding without overwhelming new players.\n\nLetsdo approach\n\nWe align gameplay, UI feedback, and marketing beats to maximize short-session retention.\n\nConclusion\n\nStrong retention comes from small decisions repeated consistently throughout the player journey.",
  },
  {
    title: "What Brands Need Before Launching AR and VR Experiences",
    category: "AR VR and Metaverse",
    tags: ["ar-apps", "vr-games", "metaverse"],
    excerpt:
      "AR and VR products succeed when creative vision is matched with performance, usability, and clear launch goals.",
    seoTitle: "AR and VR Launch Requirements for Product Teams",
    seoDescription:
      "See the technical and creative foundations brands should validate before launching AR or VR experiences.",
    content:
      "Introduction\n\nImmersive products demand more than visual spectacle.\n\nPre-launch foundations\n\nTeams need hardware planning, performance testing, interaction design, and content scope clarity.\n\nUser experience factors\n\nComfort, onboarding, and intuitive controls are essential to adoption.\n\nLetsdo approach\n\nWe treat AR and VR as real product systems, not just visual demos.\n\nConclusion\n\nWhen immersive experiences are grounded in usability, they are easier to launch and scale.",
  },
  {
    title: "Web3 Game Planning Without Overcomplicating the Product",
    category: "Blockchain and Web3",
    tags: ["web3", "blockchain", "smart-contracts"],
    excerpt:
      "The best Web3 products choose practical token, wallet, and ownership systems instead of adding complexity for its own sake.",
    seoTitle: "Practical Web3 Game Planning for Launch Teams",
    seoDescription:
      "A practical guide to planning wallets, smart contracts, and ownership flows for launch-ready Web3 game products.",
    content:
      "Introduction\n\nWeb3 features should strengthen the player experience, not distract from it.\n\nWhere teams go wrong\n\nMany products overbuild token logic before validating core gameplay and utility.\n\nSmarter planning\n\nStart with simple ownership, clear wallet flows, and specific value for the player.\n\nLetsdo approach\n\nWe design blockchain features around product fit, monetization clarity, and operational readiness.\n\nConclusion\n\nA focused Web3 roadmap beats a complicated one that users do not understand.",
  },
  {
    title: "Why Strong Game Art Direction Improves Product Perception",
    category: "Game Art and Design",
    tags: ["2d-art", "3d-art", "character-design"],
    excerpt:
      "Art direction shapes how a product is understood before users ever read a feature list or marketing message.",
    seoTitle: "Game Art Direction and Product Perception",
    seoDescription:
      "Learn how visual direction, character work, and environment design influence product perception and market appeal.",
    content:
      "Introduction\n\nUsers judge product quality visually long before they evaluate systems or features.\n\nWhy art direction matters\n\nConsistent visual language improves recognition, trust, and audience fit.\n\nCreative production needs\n\nTeams need cohesion across character design, environment work, and UI.\n\nLetsdo approach\n\nWe connect brand intent with production-ready art pipelines.\n\nConclusion\n\nGood art direction is a strategic decision, not just a finishing layer.",
  },
  {
    title: "Choosing the Right CMS and Backend Stack for Scalable Websites",
    category: "Web and CMS Development",
    tags: ["cms", "backend-api", "ecommerce-dev"],
    excerpt:
      "A scalable website starts with a CMS and backend setup that supports editors, integrations, and future growth.",
    seoTitle: "CMS and Backend Choices for Scalable Web Projects",
    seoDescription:
      "Compare the practical factors that matter when choosing a CMS and backend stack for scalable web delivery.",
    content:
      "Introduction\n\nScalable websites need more than a polished frontend.\n\nPlatform decisions\n\nThe CMS should support editorial workflows, while the backend must handle integrations and performance demands.\n\nBusiness fit\n\nStack choices should reflect team skill, roadmap complexity, and expected content volume.\n\nLetsdo approach\n\nWe choose tools based on operations, not trend value.\n\nConclusion\n\nA practical architecture reduces rework and keeps web delivery efficient over time.",
  },
  {
    title: "Cross Platform Mobile Apps That Balance Speed and Quality",
    category: "Mobile App Development",
    tags: ["android", "ios", "cross-platform"],
    excerpt:
      "Cross-platform delivery works best when teams protect user experience while still moving quickly across Android and iOS.",
    seoTitle: "Cross Platform App Delivery Without UX Compromise",
    seoDescription:
      "See how mobile teams can balance build speed and user experience when launching cross-platform apps.",
    content:
      "Introduction\n\nCross-platform apps can move quickly when the product is scoped correctly.\n\nWhat teams should protect\n\nPerformance, native-feeling UX, and maintainable architecture matter more than short-term speed alone.\n\nDelivery strategy\n\nShared code helps, but teams must still design around platform realities.\n\nLetsdo approach\n\nWe focus on product consistency, launch stability, and measurable delivery tradeoffs.\n\nConclusion\n\nFast mobile delivery only works when quality is protected at the same time.",
  },
  {
    title: "How Branding and Paid Campaigns Work Better Together",
    category: "Marketing and Creative Services",
    tags: ["branding", "paid-ads", "social-media"],
    excerpt:
      "Brands perform better when creative systems and paid campaigns are planned as one connected growth engine.",
    seoTitle: "Branding and Paid Ads Alignment for Better Growth",
    seoDescription:
      "Understand how branding, creative systems, and paid campaigns work together to improve marketing performance.",
    content:
      "Introduction\n\nBrand and performance teams often work in separate tracks.\n\nWhy alignment matters\n\nA stronger visual and messaging system improves ad efficiency, landing page trust, and campaign recall.\n\nExecution model\n\nCreative templates, campaign variants, and editorial consistency all reinforce results.\n\nLetsdo approach\n\nWe connect design, content, and campaign execution into one growth workflow.\n\nConclusion\n\nBetter performance usually starts with better creative alignment.",
  },
];

async function main() {
  const adminEmail = process.env.BLOG_ADMIN_EMAIL || "admin@letsdocreative.com";
  const adminPassword = process.env.BLOG_ADMIN_PASSWORD || "Letsdo@123";
  const adminName = process.env.BLOG_ADMIN_NAME || "Letsdo Blog Admin";

  const admin = await prisma.blogAdmin.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash: hashPassword(adminPassword),
    },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: hashPassword(adminPassword),
    },
  });

  await ensureDefaultBlogCategories(prisma);
  await ensureDefaultBlogTags(prisma);

  for (const post of samplePosts) {
    const category = await prisma.blogCategory.findUnique({
      where: { slug: slugify(post.category) },
    });

    const tagRecords = await prisma.blogTag.findMany({
      where: {
        slug: {
          in: post.tags.map((tag) => slugify(tag)),
        },
      },
    });

    if (!category || !tagRecords.length) {
      continue;
    }

    const postData = {
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
      status: "PUBLISHED",
      publishedAt: new Date(),
      featured: Boolean(post.featured),
      readingMinutes: calculateReadingMinutes(post.content),
      authorId: admin.id,
      categoryId: category.id,
    };

    await prisma.blogPost.upsert({
      where: { slug: slugify(post.title) },
      update: {
        ...postData,
        tags: {
          deleteMany: {},
          create: tagRecords.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
      create: {
        ...postData,
        slug: slugify(post.title),
        tags: {
          create: tagRecords.map((tag) => ({
            tagId: tag.id,
          })),
        },
      },
    });
  }

  console.log(`Letsdo blog seed complete. Admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
