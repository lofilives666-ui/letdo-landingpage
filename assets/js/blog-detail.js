(function () {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildPostUrl(slug) {
    return "blog-details.html?slug=" + encodeURIComponent(slug);
  }

  function updateMeta(selector, value, attribute) {
    var element = document.querySelector(selector);
    if (!element || !value) return;
    element.setAttribute(attribute || "content", value);
  }

  function stripHtml(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  function updateDetailSeo(post) {
    var title = (post.seoTitle || post.title || "Blog Details") + " | Letsdo Creative";
    var description = post.seoDescription || post.excerpt || stripHtml(post.contentHtml).slice(0, 160) || "Read detailed Letsdo Creative articles on products, services, design, and development.";
    var canonicalUrl = window.location.origin + "/blog-details.html?slug=" + encodeURIComponent(post.slug || "");

    document.title = title;
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[name="robots"]', "index,follow");
    updateMeta('link[rel="canonical"]', canonicalUrl, "href");
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:url"]', canonicalUrl);
    updateMeta('meta[property="og:image"]', post.coverImage || "");
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);
    updateMeta('meta[name="twitter:image"]', post.coverImage || "");
  }

  function updateText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value || "";
  }

  function renderCategory(category) {
    var link = document.getElementById("blog-detail-category-link");
    if (!link) return;
    if (!category) {
      link.textContent = "General";
      link.href = "blog.html";
      return;
    }
    link.textContent = category.name || "General";
    link.href = "blog.html?category=" + encodeURIComponent(category.slug || "");
  }

  function renderRecentPosts(posts) {
    var container = document.getElementById("blog-detail-recent-list");
    if (!container) return;
    if (!posts || !posts.length) {
      container.innerHTML = '<li class="blog-detail-recent-item"><span class="blog-admin-muted">No recent posts found.</span></li>';
      return;
    }
    container.innerHTML = posts.map(function (post) {
      return '<li class="blog-detail-recent-item"><a href="' + buildPostUrl(post.slug) + '"><strong>' + escapeHtml(post.title) + '</strong><span>' + escapeHtml(post.publishedLabel || "") + "</span></a></li>";
    }).join("");
  }

  function loadBlogDetail() {
    var slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) {
      updateText("blog-detail-title", "Post not found");
      return;
    }

    fetch("/api/blog?action=post&slug=" + encodeURIComponent(slug))
      .then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        return response.json();
      })
      .then(function (data) {
        var post = data.post;
        if (!post) throw new Error("Missing post");

        updateDetailSeo(post);
        updateText("blog-detail-title", post.title);
        updateText("blog-detail-author", post.author ? post.author.name : "Letsdo Team");
        updateText("blog-detail-date", post.publishedLabel || "");
        updateText("blog-detail-reading", String(post.readingMinutes || 1) + " min read");
        var heroImage = document.getElementById("blog-detail-hero-image");
        if (heroImage) {
          heroImage.src = post.coverImage;
          heroImage.alt = post.title;
        }

        var content = document.getElementById("blog-detail-content");
        if (content) content.innerHTML = post.contentHtml || "";
        renderCategory(post.category || null);
        renderRecentPosts((data.relatedPosts && data.relatedPosts.length ? data.relatedPosts : (data.sidebar && data.sidebar.recentPosts) || []));
      })
      .catch(function () {
        updateText("blog-detail-title", "Post not found");
        var content = document.getElementById("blog-detail-content");
        if (content) content.innerHTML = "<p>The requested post could not be loaded.</p>";
      });
  }

  document.addEventListener("DOMContentLoaded", loadBlogDetail);
})();
