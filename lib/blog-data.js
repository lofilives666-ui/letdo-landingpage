const { prisma } = require("./blog-prisma");
const { toPublicPost } = require("./blog-utils");

function buildWhereClause({ category, tag, search, status = "PUBLISHED" }) {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = {
      slug: category,
    };
  }

  if (tag) {
    where.tags = {
      some: {
        tag: {
          slug: tag,
        },
      },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "PUBLISHED") {
    where.publishedAt = {
      lte: new Date(),
    };
  }

  return where;
}

const postInclude = {
  author: true,
  category: true,
  tags: {
    include: {
      tag: true,
    },
  },
};

async function getSidebarData() {
  const [categories, tags, recentPosts] = await Promise.all([
    prisma.blogCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.blogTag.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    }),
    prisma.blogPost.findMany({
      where: {
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
      },
      include: postInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 4,
    }),
  ]);

  return {
    categories: categories.map((item) => ({
      name: item.name,
      slug: item.slug,
      count: item._count.posts,
    })),
    tags: tags.map((item) => ({
      name: item.name,
      slug: item.slug,
      count: item._count.posts,
    })),
    recentPosts: recentPosts.map((item) => toPublicPost(item)),
  };
}

async function getBlogListing({ page = 1, pageSize = 6, category, tag, search }) {
  const where = buildWhereClause({ category, tag, search, status: "PUBLISHED" });
  const skip = Math.max(0, (page - 1) * pageSize);

  const [total, posts, sidebar] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      include: postInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      skip,
      take: pageSize,
    }),
    getSidebarData(),
  ]);

  return {
    posts: posts.map((post) => toPublicPost(post)),
    sidebar,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

async function getBlogPostBySlug(slug) {
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      publishedAt: { lte: new Date() },
    },
    include: postInclude,
  });

  if (!post) {
    return null;
  }

  const [sidebar, relatedPosts] = await Promise.all([
    getSidebarData(),
    prisma.blogPost.findMany({
      where: {
        id: { not: post.id },
        status: "PUBLISHED",
        publishedAt: { lte: new Date() },
        OR: [
          { categoryId: post.categoryId },
          {
            tags: {
              some: {
                tagId: {
                  in: post.tags.map((item) => item.tagId),
                },
              },
            },
          },
        ],
      },
      include: postInclude,
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      take: 3,
    }),
  ]);

  return {
    post: toPublicPost(post),
    sidebar,
    relatedPosts: relatedPosts.map((item) => toPublicPost(item)),
  };
}

module.exports = {
  getSidebarData,
  getBlogListing,
  getBlogPostBySlug,
  postInclude,
};
