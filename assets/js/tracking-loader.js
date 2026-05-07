(function (window, document, measurementId) {
  if (!measurementId) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };

  window.gtag("js", new Date());
  window.gtag("config", measurementId);

  function loadTag() {
    if (document.querySelector('script[data-gtag-loader="' + measurementId + '"]')) {
      return;
    }

    var script = document.createElement("script");
    script.async = true;
    script.dataset.gtagLoader = measurementId;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
    document.head.appendChild(script);
  }

  ["pointerdown", "touchstart", "keydown"].forEach(function (eventName) {
    window.addEventListener(eventName, loadTag, { once: true, passive: true });
  });

  window.addEventListener("wheel", loadTag, { once: true, passive: true });
  window.addEventListener("load", function () {
    window.setTimeout(loadTag, 1500);
  }, { once: true });
})(window, document, "AW-17930320922");
