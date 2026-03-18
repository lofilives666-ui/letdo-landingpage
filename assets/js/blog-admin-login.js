(function () {
  var form = document.getElementById("blog-admin-login-form");
  var feedback = document.getElementById("blog-admin-login-feedback");

  function showFeedback(message, type) {
    feedback.className = "blog-admin-feedback " + type;
    feedback.textContent = message;
  }

  fetch("/api/blog-admin?action=session")
    .then(function (response) {
      if (response.ok) {
        window.location.href = "blog-admin.html";
      }
    })
    .catch(function () {});

  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    showFeedback("Signing in...", "success");

    fetch("/api/blog-admin?action=login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email.value.trim(),
        password: form.password.value,
      }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          throw new Error(result.data.error || "Login failed.");
        }
        window.location.href = "blog-admin.html";
      })
      .catch(function (error) {
        showFeedback(error.message, "error");
      });
  });
})();
