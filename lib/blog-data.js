const { prisma } = require("./blog-prisma");
const { toPublicPost } = require("./blog-utils");
const { getBuyerIntentPosts } = require("./buyer-intent-posts");

const postInclude = {
  author: true,
  category: true,
  tags: {
    include: {
      tag: true,
    },
  },
};

function sortPosts(posts) {
  return [...posts].sort((left, right) => {
    if (Boolean(left.featured) !== Boolean(right.featured)) {
      return left.featured ? -1 : 1;
    }

    return new Date(right.publishedAt || 0).getTime() - new Date(left.publishedAt || 0).getTime();
  });
}

function mergePostsBySlug(...groups) {
  const merged = new Map();

  groups.flat().forEach((post) => {
    if (!post || !post.slug || merged.has(post.slug)) {
      return;
    }

    merged.set(post.slug, post);
  });

  return sortPosts([...merged.values()]);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesSearch(post, search) {
  if (!search) return true;

  const haystack = normalize([
    post.title,
    post.excerpt,
    post.content,
    post.category && post.category.name,
    ...(post.tags || []).map((tag) => tag.name),
  ].join(" "));

  return haystack.includes(normalize(search));
}

function filterPosts(posts, { category, tag, search }) {
  return posts.filter((post) => {
    if (category && (!post.category || post.category.slug !== category)) {
      return false;
    }

    if (tag && !(post.tags || []).some((item) => item.slug === tag)) {
      return false;
    }

    if (!matchesSearch(post, search)) {
      return false;
    }

    return true;
  });
}

function buildSidebarData(posts) {
  const categoryCounts = new Map();
  const tagCounts = new Map();

  posts.forEach((post) => {
    if (post.category && post.category.slug) {
      const key = post.category.slug;
      const current = categoryCounts.get(key) || {
        name: post.category.name,
        slug: post.category.slug,
        count: 0,
      };
      current.count += 1;
      categoryCounts.set(key, current);
    }

    (post.tags || []).forEach((tag) => {
      const key = tag.slug;
      const current = tagCounts.get(key) || {
        name: tag.name,
        slug: tag.slug,
        count: 0,
      };
      current.count += 1;
      tagCounts.set(key, current);
    });
  });

  return {
    categories: [...categoryCounts.values()].sort((left, right) => left.name.localeCompare(right.name)),
    tags: [...tagCounts.values()].sort((left, right) => left.name.localeCompare(right.name)),
    recentPosts: sortPosts(posts).slice(0, 4),
  };
}

async function getDatabasePosts() {
  if (!process.env.BLOG_DATABASE_URL) {
    return [];
  }

  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      include: postInclude,
    });

    return posts.map((post) => toPublicPost(post));
  } catch (error) {
    console.warn("Falling back to static buyer-intent blog posts.", error.message);
    return [];
  }
}

async function getAllPublicPosts() {
  const [databasePosts, staticPosts] = await Promise.all([
    getDatabasePosts(),
    Promise.resolve(getBuyerIntentPosts()),
  ]);

  return mergePostsBySlug(databasePosts, staticPosts);
}

async function getSidebarData() {
  const posts = await getAllPublicPosts();
  return buildSidebarData(posts);
}

async function getBlogListing({ page = 1, pageSize = 6, category, tag, search }) {
  const posts = await getAllPublicPosts();
  const filteredPosts = filterPosts(posts, { category, tag, search });
  const sidebar = buildSidebarData(posts);
  const safePage = Math.max(1, Number(page || 1));
  const safePageSize = Math.max(1, Number(pageSize || 6));
  const total = filteredPosts.length;
  const totalPages = Math.max(1, Math.ceil(total / safePageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safePageSize;

  return {
    posts: filteredPosts.slice(start, start + safePageSize),
    sidebar,
    pagination: {
      page: currentPage,
      pageSize: safePageSize,
      total,
      totalPages,
    },
  };
}

async function getBlogPostBySlug(slug) {
  const posts = await getAllPublicPosts();
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return null;
  }

  const sidebar = buildSidebarData(posts);
  const relatedPosts = sortPosts(
    posts.filter((candidate) => {
      if (candidate.slug === post.slug) {
        return false;
      }

      if (candidate.category && post.category && candidate.category.slug === post.category.slug) {
        return true;
      }

      const postTagSlugs = new Set((post.tags || []).map((tag) => tag.slug));
      return (candidate.tags || []).some((tag) => postTagSlugs.has(tag.slug));
    }),
  ).slice(0, 3);

  return {
    post,
    sidebar,
    relatedPosts,
  };
}

module.exports = {
  getSidebarData,
  getBlogListing,
  getBlogPostBySlug,
  postInclude,
};
