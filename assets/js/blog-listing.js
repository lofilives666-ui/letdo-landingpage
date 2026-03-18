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
    if (!element) return;
    element.setAttribute(attribute || "content", value);
  }

  function updateListingSeo() {
    var params = new URLSearchParams(window.location.search);
    var category = params.get("category");
    var tag = params.get("tag");
    var query = params.get("q");
    var title = "Letsdo Creative Blog | Game Development, Products and Growth Insights";
    var description = "Explore the Letsdo Creative blog for insights on white label products, game development, ecommerce solutions, mobile apps, design, and digital growth.";

    if (category) {
      var categoryLabel = category.replace(/-/g, " ");
      title = "Letsdo Creative Blog | " + categoryLabel;
      description = "Explore Letsdo Creative blog posts about " + categoryLabel + ", including product strategy, design, development, and launch insights.";
    } else if (tag) {
      var tagLabel = tag.replace(/-/g, " ");
      title = "Letsdo Creative Blog | " + tagLabel + " Insights";
      description = "Browse Letsdo Creative blog content tagged with " + tagLabel + " across white label products, development, and digital growth.";
    } else if (query) {
      title = 'Letsdo Creative Blog | Search: "' + query + '"';
      description = 'Search Letsdo Creative blog posts for "' + query + '" across services, products, case insights, and digital delivery topics.';
    }

    document.title = title;
    updateMeta('meta[name="description"]', description);
    updateMeta('meta[property="og:title"]', title);
    updateMeta('meta[property="og:description"]', description);
    updateMeta('meta[property="og:url"]', window.location.href);
    updateMeta('meta[name="twitter:title"]', title);
    updateMeta('meta[name="twitter:description"]', description);
    updateMeta('link[rel="canonical"]', window.location.origin + "/blog.html", "href");
  }

  function updateQuery(name, value) {
    var url = new URL(window.location.href);
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
    if (name !== "page") url.searchParams.delete("page");
    window.location.href = url.toString();
  }

  function renderPosts(posts) {
    var container = document.getElementById("blog-listing-container");
    if (!container) return;
    if (!posts.length) {
      container.innerHTML = '<div class="col-12"><div class="blog-post-item"><div class="blog-post-content"><h2 class="title">No posts found</h2><p>Try a different search term or category.</p></div></div></div>';
      return;
    }

    container.innerHTML = posts.map(function (post) {
      return '<div class="col-xl-4 col-md-6"><div class="blog-post-item h-100"><div class="blog-post-thumb"><a href="' + buildPostUrl(post.slug) + '"><img src="' + escapeHtml(post.coverImage) + '" alt="' + escapeHtml(post.title) + '"></a></div><div class="blog-post-content"><div class="blog-post-meta"><ul class="list-wrap"><li>By<a href="#">' + escapeHtml(post.author ? post.author.name : "Letsdo Team") + '</a></li><li><i class="far fa-calendar-alt"></i> ' + escapeHtml(post.publishedLabel || "") + '</li><li><i class="far fa-clock"></i> ' + escapeHtml(String(post.readingMinutes || 1)) + ' min read</li></ul></div><h2 class="title"><a href="' + buildPostUrl(post.slug) + '">' + escapeHtml(post.title) + '</a></h2><p>' + escapeHtml(post.excerpt) + '</p><div class="blog-post-bottom"><div class="blog-post-read"><a href="' + buildPostUrl(post.slug) + '">READ MORE <i class="fas fa-arrow-right"></i></a></div><div class="blog-post-share"><h5 class="share">category :</h5><ul class="list-wrap"><li><a href="javascript:void(0)">' + escapeHtml(post.category ? post.category.name : "General") + "</a></li></ul></div></div></div></div></div>";
    }).join("");
  }

  function renderSummary(pagination) {
    var container = document.getElementById("blog-results-summary");
    if (!container) return;
    var total = pagination && typeof pagination.total === "number" ? pagination.total : 0;
    container.textContent = total === 1 ? "1 published post" : String(total) + " published posts";
  }

  function renderPagination(pagination) {
    var container = document.getElementById("blog-pagination");
    if (!container) return;
    if (!pagination || pagination.totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    var links = [];
    for (var page = 1; page <= pagination.totalPages; page += 1) {
      if (page === pagination.page) links.push('<li><span class="page-numbers current">' + String(page).padStart(2, "0") + "</span></li>");
      else links.push('<li><a href="#" class="page-numbers" data-page="' + page + '">' + String(page).padStart(2, "0") + "</a></li>");
    }

    container.innerHTML = '<ul class="list-wrap d-flex flex-wrap justify-content-center">' + links.join("") + "</ul>";
    Array.prototype.forEach.call(container.querySelectorAll("[data-page]"), function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        updateQuery("page", link.getAttribute("data-page"));
      });
    });
  }

  function renderCategories(categories) {
    var container = document.getElementById("blog-category-filters");
    if (!container) return;
    var activeCategory = new URLSearchParams(window.location.search).get("category") || "";
    container.innerHTML = categories.map(function (category) {
      var activeClass = activeCategory === category.slug ? " is-active" : "";
      return '<a href="#" class="blog-taxonomy-chip' + activeClass + '" data-category="' + escapeHtml(category.slug) + '">' + escapeHtml(category.name) + ' <span>(' + escapeHtml(category.count) + ")</span></a>";
    }).join("");
    Array.prototype.forEach.call(container.querySelectorAll("[data-category]"), function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        updateQuery("category", link.getAttribute("data-category"));
      });
    });
  }

  function renderRecentPosts(posts) {
    var container = document.getElementById("blog-recent-posts");
    if (!container) return;
    container.innerHTML = posts.map(function (post) {
      return '<div class="rc__post-item"><div class="rc__post-thumb"><a href="' + buildPostUrl(post.slug) + '"><img src="' + escapeHtml(post.coverImage) + '" alt="' + escapeHtml(post.title) + '"></a></div><div class="rc__post-content"><h6 class="title"><a href="' + buildPostUrl(post.slug) + '">' + escapeHtml(post.title) + '</a></h6><span class="date">' + escapeHtml(post.publishedLabel || "") + "</span></div></div>";
    }).join("");
  }

  function renderTags(tags) {
    var container = document.getElementById("blog-tag-filters");
    if (!container) return;
    var activeTag = new URLSearchParams(window.location.search).get("tag") || "";
    container.innerHTML = tags.map(function (tag) {
      var activeClass = activeTag === tag.slug ? " is-active" : "";
      return '<a href="#" class="blog-taxonomy-chip' + activeClass + '" data-tag="' + escapeHtml(tag.slug) + '">' + escapeHtml(tag.name) + ' <span>(' + escapeHtml(tag.count || 0) + ")</span></a>";
    }).join("");
    Array.prototype.forEach.call(container.querySelectorAll("[data-tag]"), function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        updateQuery("tag", link.getAttribute("data-tag"));
      });
    });
  }

  function bindSearch() {
    var form = document.getElementById("blog-search-form");
    var input = document.getElementById("blog-search-input");
    if (!form || !input) return;
    input.value = new URLSearchParams(window.location.search).get("q") || "";
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      updateQuery("q", input.value.trim());
    });
  }

  function loadBlogListing() {
    var params = new URLSearchParams(window.location.search);
    fetch("/api/blog?" + params.toString())
      .then(function (response) { return response.json(); })
      .then(function (data) {
        renderPosts(data.posts || []);
        renderSummary(data.pagination || null);
        renderPagination(data.pagination || null);
        renderCategories((data.sidebar && data.sidebar.categories) || []);
        renderRecentPosts((data.sidebar && data.sidebar.recentPosts) || []);
        renderTags((data.sidebar && data.sidebar.tags) || []);
      })
      .catch(function () {
        var container = document.getElementById("blog-listing-container");
        if (container) container.innerHTML = '<div class="col-12"><div class="blog-post-item"><div class="blog-post-content"><h2 class="title">Unable to load posts</h2><p>Please try again in a moment.</p></div></div></div>';
      });
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateListingSeo();
    bindSearch();
    loadBlogListing();
  });
})();
