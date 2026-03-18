(function () {
  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function request(url, options) {
    return fetch(url, options).then(function (response) {
      return response.json().then(function (data) {
        if (!response.ok) {
          throw new Error(data.error || "Request failed.");
        }
        return data;
      });
    });
  }

  function ensureSession() {
    return request("/api/blog-admin?action=session").catch(function () {
      window.location.href = "blog-admin-login.html";
      throw new Error("Unauthorized");
    });
  }

  function setLoading(isLoading, message) {
    var loader = document.getElementById("blog-admin-loader");
    if (!loader) return;
    var text = loader.querySelector("span");
    if (text && message) {
      text.textContent = message;
    }
    loader.classList.toggle("is-visible", !!isLoading);
    loader.setAttribute("aria-hidden", isLoading ? "false" : "true");
  }

  function showError(error) {
    var feedback = document.getElementById("blog-admin-dashboard-feedback");
    if (!feedback) return;
    feedback.className = "blog-admin-feedback error";
    feedback.textContent = error.message || "Something went wrong.";
  }

  function showSuccess(message) {
    var feedback = document.getElementById("blog-admin-dashboard-feedback");
    if (!feedback) return;
    feedback.className = "blog-admin-feedback success";
    feedback.textContent = message;
  }

  function renderMetrics(metrics, categories, tags, posts) {
    var container = document.getElementById("blog-admin-metrics");
    if (!container) return;
    container.innerHTML = [
      { label: "Published Posts", value: metrics.publishedPosts, detail: "Live on the public blog" },
      { label: "Draft Pipeline", value: metrics.draftPosts, detail: "Articles waiting for publish" },
      { label: "Categories", value: metrics.categories, detail: "Editorial content groups" },
      { label: "Tag Topics", value: tags.length, detail: "Reusable topics across " + posts.length + " recent posts" }
    ].map(function (metric) {
      return '<article class="blog-admin-metric"><span class="blog-admin-metric-label">' + escapeHtml(metric.label) + '</span><strong>' + escapeHtml(metric.value) + '</strong><small>' + escapeHtml(metric.detail) + "</small></article>";
    }).join("");
  }

  function renderPosts(posts) {
    var container = document.getElementById("blog-admin-post-list");
    if (!container) return;
    if (!posts.length) {
      container.innerHTML = '<article class="blog-admin-post-card"><h4>No posts yet</h4><p class="blog-admin-muted mb-0">Create your first article to start filling the Letsdo blog pipeline.</p></article>';
      return;
    }
    container.innerHTML = posts.map(function (post) {
      return [
        '<article class="blog-admin-post-card">',
        '  <div class="blog-admin-post-row">',
        "    <div>",
        '      <div class="blog-admin-inline-meta">',
        '        <span class="blog-admin-badge ' + (post.status === "PUBLISHED" ? "" : "draft") + '">' + escapeHtml(post.status) + "</span>",
        "      </div>",
        '      <h4 class="mt-3">' + escapeHtml(post.title) + "</h4>",
        '      <div class="blog-admin-post-meta">',
        "        <span>" + escapeHtml(post.category ? post.category.name : "General") + "</span>",
        "        <span>" + escapeHtml(post.slug) + "</span>",
        "        <span>" + escapeHtml(post.updatedAt ? new Date(post.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "") + "</span>",
        "      </div>",
        "    </div>",
        '    <div class="blog-admin-actions">',
        '      <a class="blog-admin-button secondary" href="blog-admin-editor.html?id=' + encodeURIComponent(post.id) + '">Edit</a>',
        '      <button class="blog-admin-button danger" type="button" data-delete="' + encodeURIComponent(post.id) + '">Delete</button>',
        "    </div>",
        "  </div>",
        "</article>"
      ].join("");
    }).join("");

    Array.prototype.forEach.call(container.querySelectorAll("[data-delete]"), function (button) {
      button.addEventListener("click", function () {
        if (!window.confirm("Delete this post permanently?")) return;
        request("/api/blog-admin?action=post&id=" + encodeURIComponent(button.getAttribute("data-delete")), {
          method: "DELETE",
        }).then(loadDashboard).catch(showError);
      });
    });
  }

  function renderCategories(categories) {
    var select = document.getElementById("blog-admin-category-select");
    if (!select) return;
    if (!categories.length) {
      select.innerHTML = '<option value="">No categories available</option>';
      return;
    }
    select.innerHTML = categories.map(function (category, index) {
      return '<option value="' + escapeHtml(category.id) + '"' + (index === 0 ? " selected" : "") + ">" + escapeHtml(category.name) + " (" + escapeHtml(category._count.posts) + ")</option>";
    }).join("");
    var selected = document.getElementById("blog-admin-selected-category");
    if (selected) {
      selected.value = categories[0].name;
    }
  }

  function renderTags(tags) {
    var select = document.getElementById("blog-admin-tag-select");
    if (!select) return;
    if (!tags.length) {
      select.innerHTML = '<option value="">No tags available</option>';
      return;
    }
    select.innerHTML = tags.map(function (tag, index) {
      return '<option value="' + escapeHtml(tag.id) + '"' + (index === 0 ? " selected" : "") + ">" + escapeHtml(tag.name) + " (" + escapeHtml(tag._count.posts) + ")</option>";
    }).join("");
    var selected = document.getElementById("blog-admin-selected-tag");
    if (selected) {
      selected.value = tags[0].name;
    }
  }

  function renderAdminProfile(admin) {
    var name = document.getElementById("blog-admin-operator-name");
    var email = document.getElementById("blog-admin-operator-email");
    if (name) name.textContent = admin && admin.name ? admin.name : "Letsdo Admin";
    if (email) email.textContent = admin && admin.email ? admin.email : "admin@letsdocreative.com";
  }

  function syncNavState() {
    var links = document.querySelectorAll(".blog-admin-nav-link[href^='#']");
    var sections = Array.prototype.map.call(links, function (link) {
      var target = document.querySelector(link.getAttribute("href"));
      return target ? { link: link, target: target } : null;
    }).filter(Boolean);

    function update() {
      var active = sections[0];
      Array.prototype.forEach.call(sections, function (item) {
        if (window.scrollY >= item.target.offsetTop - 140) active = item;
      });
      Array.prototype.forEach.call(links, function (link) {
        link.classList.toggle("is-active", active && active.link === link);
      });
    }

    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  var currentAdmin = null;

  function loadDashboard(admin) {
    if (admin) currentAdmin = admin;
    setLoading(true, "Loading dashboard data...");
    Promise.all([
      request("/api/blog-admin?action=dashboard"),
      request("/api/blog-admin?action=categories"),
      request("/api/blog-admin?action=tags")
    ])
      .then(function (results) {
        renderAdminProfile(currentAdmin);
        renderMetrics(results[0].metrics, results[1].categories, results[2].tags, results[0].posts);
        renderPosts(results[0].posts);
        renderCategories(results[1].categories);
        renderTags(results[2].tags);
      })
      .catch(showError)
      .finally(function () {
        setLoading(false);
      });
  }

  document.getElementById("blog-admin-logout").addEventListener("click", function () {
    request("/api/blog-admin?action=logout", { method: "POST" }).finally(function () {
      window.location.href = "blog-admin-login.html";
    });
  });

  document.getElementById("blog-admin-category-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    request("/api/blog-admin?action=categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.value.trim(),
        description: "",
      }),
    }).then(function () {
      form.reset();
      showSuccess("Category added.");
      loadDashboard();
    }).catch(showError);
  });

  document.getElementById("blog-admin-tag-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var form = event.currentTarget;
    request("/api/blog-admin?action=tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.value.trim(),
      }),
    }).then(function () {
      form.reset();
      showSuccess("Tag added.");
      loadDashboard();
    }).catch(showError);
  });

  document.getElementById("blog-admin-category-select").addEventListener("change", function (event) {
    var label = event.currentTarget.options[event.currentTarget.selectedIndex];
    var selected = document.getElementById("blog-admin-selected-category");
    if (selected && label) {
      selected.value = label.textContent.replace(/\s+\(\d+\)$/, "");
    }
  });

  document.getElementById("blog-admin-tag-select").addEventListener("change", function (event) {
    var label = event.currentTarget.options[event.currentTarget.selectedIndex];
    var selected = document.getElementById("blog-admin-selected-tag");
    if (selected && label) {
      selected.value = label.textContent.replace(/\s+\(\d+\)$/, "");
    }
  });

  syncNavState();
  setLoading(true, "Checking admin session...");
  ensureSession().then(function (session) {
    loadDashboard(session.admin);
  }).catch(function () {
    setLoading(false);
  });
})();
