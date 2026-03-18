(function () {
  var slugTouched = false;
  var aiProgressTimer = null;
  var aiProgressValue = 0;
  var cropper = {
    image: null,
    zoom: 1,
    minZoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    originX: 0,
    originY: 0,
  };

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

  function showFeedback(message, type) {
    var feedback = document.getElementById("blog-editor-feedback");
    feedback.className = "blog-admin-feedback " + type;
    feedback.textContent = message;
  }

  function renderAdminProfile(admin) {
    var name = document.getElementById("blog-admin-operator-name");
    var email = document.getElementById("blog-admin-operator-email");
    if (name) name.textContent = admin && admin.name ? admin.name : "Letsdo Admin";
    if (email) email.textContent = admin && admin.email ? admin.email : "admin@letsdocreative.com";
  }

  function getPostId() {
    return new URLSearchParams(window.location.search).get("id");
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function loadLookups() {
    return Promise.all([
      request("/api/blog-admin/session"),
      request("/api/blog-admin/categories"),
      request("/api/blog-admin/tags")
    ]).catch(function () {
      window.location.href = "blog-admin-login.html";
      throw new Error("Unauthorized");
    });
  }

  function populateCategories(categories) {
    var select = document.getElementById("blog-post-category");
    select.innerHTML = categories.map(function (category) {
      return '<option value="' + category.id + '">' + category.name + "</option>";
    }).join("");
  }

  function populateTags(tags, selectedTagIds) {
    var container = document.getElementById("blog-post-tag-grid");
    container.innerHTML = tags.map(function (tag) {
      var checked = selectedTagIds.indexOf(tag.id) >= 0 ? "checked" : "";
      return '<label class="blog-admin-tag-pill"><input type="checkbox" name="tagIds" value="' + tag.id + '" ' + checked + '><span>' + tag.name + "</span></label>";
    }).join("");
  }

  function updateCoverPreview(url) {
    var preview = document.getElementById("blog-cover-preview");
    var image = document.getElementById("blog-cover-preview-image");
    if (!preview || !image) return;
    if (!url) {
      preview.classList.add("d-none");
      image.removeAttribute("src");
      return;
    }
    preview.classList.remove("d-none");
    image.src = url;
  }

  function fillForm(post) {
    document.getElementById("blog-editor-heading").textContent = "Edit blog post";
    document.getElementById("blog-post-title").value = post.title || "";
    document.getElementById("blog-post-slug").value = post.slug || "";
    document.getElementById("blog-post-excerpt").value = post.excerpt || "";
    document.getElementById("blog-post-content").value = post.content || "";
    document.getElementById("blog-post-category").value = post.categoryId || "";
    document.getElementById("blog-post-status").value = post.status || "DRAFT";
    document.getElementById("blog-post-cover-image").value = post.coverImage || "";
    document.getElementById("blog-post-seo-title").value = post.seoTitle || "";
    document.getElementById("blog-post-seo-description").value = post.seoDescription || "";
    document.getElementById("blog-post-featured").checked = Boolean(post.featured);
    updateCoverPreview(post.coverImage || "");
    slugTouched = true;
  }

  function getSelectedTagIds() {
    return Array.prototype.slice.call(document.querySelectorAll('input[name="tagIds"]:checked')).map(function (input) {
      return input.value;
    });
  }

  function getPayload() {
    return {
      title: document.getElementById("blog-post-title").value.trim(),
      slug: document.getElementById("blog-post-slug").value.trim(),
      excerpt: document.getElementById("blog-post-excerpt").value.trim(),
      content: document.getElementById("blog-post-content").value.trim(),
      categoryId: document.getElementById("blog-post-category").value,
      status: document.getElementById("blog-post-status").value,
      coverImage: document.getElementById("blog-post-cover-image").value.trim(),
      seoTitle: document.getElementById("blog-post-seo-title").value.trim(),
      seoDescription: document.getElementById("blog-post-seo-description").value.trim(),
      featured: document.getElementById("blog-post-featured").checked,
      tagIds: getSelectedTagIds(),
    };
  }

  function setProgress(value, label) {
    var progress = document.getElementById("blog-ai-progress");
    var fill = document.getElementById("blog-ai-progress-fill");
    var text = document.getElementById("blog-ai-progress-value");
    var status = document.getElementById("blog-ai-progress-label");
    if (progress) progress.classList.remove("d-none");
    if (fill) fill.style.width = value + "%";
    if (text) text.textContent = value + "%";
    if (status && label) status.textContent = label;
  }

  function startAiProgress() {
    aiProgressValue = 6;
    setProgress(aiProgressValue, "Generating full draft...");
    if (aiProgressTimer) window.clearInterval(aiProgressTimer);
    aiProgressTimer = window.setInterval(function () {
      aiProgressValue = Math.min(aiProgressValue + (aiProgressValue < 70 ? 9 : 3), 92);
      setProgress(aiProgressValue, aiProgressValue < 55 ? "Building content structure..." : "Drafting SEO and body copy...");
    }, 380);
  }

  function finishAiProgress() {
    if (aiProgressTimer) window.clearInterval(aiProgressTimer);
    aiProgressTimer = null;
    setProgress(100, "Draft ready");
  }

  function resetAiProgress() {
    if (aiProgressTimer) window.clearInterval(aiProgressTimer);
    aiProgressTimer = null;
    aiProgressValue = 0;
    var progress = document.getElementById("blog-ai-progress");
    if (progress) progress.classList.add("d-none");
  }

  function validateAiInputs() {
    var category = document.getElementById("blog-post-category").value;
    var title = document.getElementById("blog-post-title").value.trim();
    if (!category) throw new Error("Select a category before generating the draft.");
    if (!title) throw new Error("Enter a title before generating the draft.");
  }

  function generateAi(target) {
    validateAiInputs();
    var payload = getPayload();
    var select = document.getElementById("blog-post-category");
    return request("/api/blog-admin/ai-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: target,
        category: select.selectedOptions[0] ? select.selectedOptions[0].text : "",
        title: payload.title,
        excerpt: payload.excerpt,
        wordCount: 900,
      }),
    });
  }

  function savePost(statusOverride) {
    var postId = getPostId();
    var method = postId ? "PATCH" : "POST";
    var url = postId ? "/api/blog-admin/post?id=" + encodeURIComponent(postId) : "/api/blog-admin/posts";
    var payload = getPayload();
    if (statusOverride) {
      payload.status = statusOverride;
      document.getElementById("blog-post-status").value = statusOverride;
    }

    return request(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  function getCanvas() {
    return document.getElementById("blog-image-crop-canvas");
  }

  function renderCropCanvas() {
    var canvas = getCanvas();
    if (!canvas || !cropper.image) return;
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0d151e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    var width = cropper.image.width * cropper.zoom;
    var height = cropper.image.height * cropper.zoom;
    ctx.drawImage(cropper.image, cropper.offsetX, cropper.offsetY, width, height);
  }

  function resetCropper() {
    var canvas = getCanvas();
    if (!canvas || !cropper.image) return;
    cropper.minZoom = Math.max(canvas.width / cropper.image.width, canvas.height / cropper.image.height);
    cropper.zoom = cropper.minZoom;
    cropper.offsetX = (canvas.width - cropper.image.width * cropper.zoom) / 2;
    cropper.offsetY = (canvas.height - cropper.image.height * cropper.zoom) / 2;
    var zoomInput = document.getElementById("blog-image-zoom");
    if (zoomInput) zoomInput.value = "100";
    renderCropCanvas();
  }

  function openImageModal(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var image = new Image();
      image.onload = function () {
        cropper.image = image;
        document.getElementById("blog-image-modal").classList.remove("d-none");
        resetCropper();
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function closeImageModal() {
    document.getElementById("blog-image-modal").classList.add("d-none");
    cropper.image = null;
    cropper.dragging = false;
  }

  function uploadCroppedImage() {
    var canvas = getCanvas();
    return canvas.toDataURL("image/webp", 0.9);
  }

  document.getElementById("blog-post-title").addEventListener("input", function (event) {
    if (slugTouched) return;
    document.getElementById("blog-post-slug").value = slugify(event.target.value);
  });

  document.getElementById("blog-post-slug").addEventListener("input", function () {
    slugTouched = true;
  });

  document.getElementById("blog-post-cover-image").addEventListener("input", function (event) {
    updateCoverPreview(event.target.value.trim());
  });

  document.getElementById("blog-cover-upload-trigger").addEventListener("click", function () {
    document.getElementById("blog-cover-upload-input").click();
  });

  document.getElementById("blog-cover-upload-input").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    openImageModal(file);
    event.target.value = "";
  });

  document.getElementById("blog-image-modal-close").addEventListener("click", closeImageModal);
  document.querySelector(".blog-image-modal-backdrop").addEventListener("click", closeImageModal);
  document.getElementById("blog-image-reset").addEventListener("click", resetCropper);

  document.getElementById("blog-image-zoom").addEventListener("input", function (event) {
    if (!cropper.image) return;
    var ratio = Number(event.target.value) / 100;
    cropper.zoom = cropper.minZoom * ratio;
    renderCropCanvas();
  });

  (function bindCanvasDrag() {
    var canvas = getCanvas();
    if (!canvas) return;

    canvas.addEventListener("mousedown", function (event) {
      if (!cropper.image) return;
      cropper.dragging = true;
      cropper.dragStartX = event.clientX;
      cropper.dragStartY = event.clientY;
      cropper.originX = cropper.offsetX;
      cropper.originY = cropper.offsetY;
    });

    window.addEventListener("mousemove", function (event) {
      if (!cropper.dragging) return;
      cropper.offsetX = cropper.originX + (event.clientX - cropper.dragStartX);
      cropper.offsetY = cropper.originY + (event.clientY - cropper.dragStartY);
      renderCropCanvas();
    });

    window.addEventListener("mouseup", function () {
      cropper.dragging = false;
    });
  })();

  document.getElementById("blog-image-save").addEventListener("click", function () {
    if (!cropper.image) return;
    showFeedback("Uploading cropped image...", "success");
    var croppedDataUrl = uploadCroppedImage();
    request("/api/blog-admin/upload-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: document.getElementById("blog-post-title").value.trim() || "blog-cover",
        dataUrl: croppedDataUrl,
      }),
    }).then(function (result) {
      document.getElementById("blog-post-cover-image").value = result.imageUrl;
      updateCoverPreview(croppedDataUrl);
      closeImageModal();
      showFeedback("Cover image uploaded and converted to WebP.", "success");
    }).catch(function (error) {
      showFeedback(error.message, "error");
    });
  });

  loadLookups().then(function (results) {
    renderAdminProfile(results[0].admin);
    var categories = results[1].categories;
    var tags = results[2].tags;
    populateCategories(categories);
    populateTags(tags, []);

    var postId = getPostId();
    if (postId) {
      request("/api/blog-admin/post?id=" + encodeURIComponent(postId)).then(function (data) {
        fillForm(data.post);
        populateTags(tags, data.post.tags.map(function (item) { return item.tagId; }));
      }).catch(function (error) {
        showFeedback(error.message, "error");
      });
    }
  });

  document.getElementById("blog-editor-form").addEventListener("submit", function (event) {
    event.preventDefault();
    savePost("DRAFT").then(function () {
      showFeedback("Draft saved successfully.", "success");
      setTimeout(function () {
        window.location.href = "blog-admin.html";
      }, 700);
    }).catch(function (error) {
      showFeedback(error.message, "error");
    });
  });

  document.getElementById("blog-publish-post").addEventListener("click", function () {
    savePost("PUBLISHED").then(function () {
      showFeedback("Post published successfully.", "success");
      setTimeout(function () {
        window.location.href = "blog-admin.html";
      }, 700);
    }).catch(function (error) {
      showFeedback(error.message, "error");
    });
  });

  document.getElementById("blog-ai-generate-all").addEventListener("click", function () {
    try {
      startAiProgress();
      showFeedback("Generating AI full draft...", "success");
      generateAi("all").then(function (result) {
        document.getElementById("blog-post-excerpt").value = result.content.excerpt || "";
        document.getElementById("blog-post-content").value = result.content.content || "";
        document.getElementById("blog-post-seo-title").value = result.content.seoTitle || "";
        document.getElementById("blog-post-seo-description").value = result.content.seoDescription || "";
        if (!slugTouched && !document.getElementById("blog-post-slug").value.trim()) {
          document.getElementById("blog-post-slug").value = slugify(document.getElementById("blog-post-title").value);
        }
        finishAiProgress();
        showFeedback("AI draft inserted into the editor.", "success");
      }).catch(function (error) {
        resetAiProgress();
        showFeedback(error.message, "error");
      });
    } catch (error) {
      resetAiProgress();
      showFeedback(error.message, "error");
    }
  });

  document.getElementById("blog-admin-logout").addEventListener("click", function () {
    request("/api/blog-admin/logout", { method: "POST" }).finally(function () {
      window.location.href = "blog-admin-login.html";
    });
  });
})();
