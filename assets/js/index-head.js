(function () {
            var isMobileViewport = window.matchMedia('(max-width: 767.98px)').matches;
            var deferredStylesLoaded = false;
            var deferredStyleHrefs = [
                'assets/css/fontawesome-all.min.css',
                'assets/css/flaticon.min.css'
            ];
            var deferredInteractiveStyleHrefs = [
                'assets/css/magnific-popup.css',
                'assets/css/swiper-bundle.min.css',
                'assets/css/slick.css'
            ];

            function loadStyle(href) {
                if (document.querySelector("link[href='" + href + "']")) {
                    return;
                }

                var link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }

            function loadDeferredStyles() {
                if (deferredStylesLoaded) {
                    return;
                }

                deferredStylesLoaded = true;
                deferredStyleHrefs.forEach(loadStyle);
                if (!isMobileViewport) {
                    deferredInteractiveStyleHrefs.forEach(loadStyle);
                }
            }

            function loadInteractiveStyles() {
                loadDeferredStyles();
                deferredInteractiveStyleHrefs.forEach(loadStyle);
            }

            function loadDeferredStylesSoon() {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(loadDeferredStyles, { timeout: 2500 });
                    return;
                }

                window.setTimeout(loadDeferredStyles, 1200);
            }

            function observeDesktopInteractiveStyles() {
                if (isMobileViewport || !('IntersectionObserver' in window)) {
                    return;
                }

                var targets = document.querySelectorAll('.slider__area, .gallery__area, .video__area, .faq-area, .brand-area, .social__area, .trendingNft-area');

                if (!targets.length) {
                    return;
                }

                var observer = new IntersectionObserver(function (entries) {
                    if (!entries.some(function (entry) { return entry.isIntersecting; })) {
                        return;
                    }

                    loadInteractiveStyles();
                    observer.disconnect();
                }, { rootMargin: '200px 0px' });

                targets.forEach(function (target) {
                    observer.observe(target);
                });
            }

            window.loadDeferredStyles = loadDeferredStyles;
            window.loadInteractiveStyles = loadInteractiveStyles;
            ['pointerdown', 'touchstart', 'keydown'].forEach(function (eventName) {
                window.addEventListener(eventName, loadInteractiveStyles, { once: true, passive: true });
            });

            window.addEventListener('wheel', loadInteractiveStyles, { once: true, passive: true });

            if (isMobileViewport) {
                window.addEventListener('load', loadDeferredStylesSoon, { once: true });
                return;
            }

            document.addEventListener('DOMContentLoaded', observeDesktopInteractiveStyles, { once: true });
        })();

window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-17930320922');

        (function () {
            function loadGtag() {
                if (document.querySelector('script[data-gtag-loader]')) {
                    return;
                }
                var script = document.createElement('script');
                script.async = true;
                script.dataset.gtagLoader = 'true';
                script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17930320922';
                document.head.appendChild(script);
            }

            ['pointerdown', 'touchstart', 'keydown'].forEach(function (eventName) {
                window.addEventListener(eventName, loadGtag, { once: true, passive: true });
            });

            window.addEventListener('wheel', loadGtag, { once: true, passive: true });
        })();

(function () {
            if (window.matchMedia('(max-width: 767.98px)').matches) {
                document.documentElement.classList.add('is-mobile-lite');
                document.addEventListener('DOMContentLoaded', function () {
                    var heroSection = document.querySelector('.slider__area[data-background]');
                    var removableSections = document.querySelectorAll('.nft-item__area, .about__area, .gallery__area, .about__area-two, .team__area, .video__area, .roadMap__area, .trendingNft-area, .social__area');
                    if (heroSection) {
                        heroSection.removeAttribute('data-background');
                        heroSection.removeAttribute('data-bg-eager');
                    }
                    removableSections.forEach(function (section) {
                        section.remove();
                    });
                }, { once: true });
                return;
            }

            [
                { href: 'assets/img/slider/slider_bg.webp' },
                {
                    href: 'assets/img/slider/slider_img01-594.webp',
                    imagesrcset: 'assets/img/slider/slider_img01-420.webp 420w, assets/img/slider/slider_img01-594.webp 594w',
                    imagesizes: '(max-width: 767px) 382px, 495px'
                }
            ].forEach(function (config) {
                var link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = config.href;
                link.setAttribute('fetchpriority', 'high');
                if (config.imagesrcset) {
                    link.setAttribute('imagesrcset', config.imagesrcset);
                    link.setAttribute('imagesizes', config.imagesizes);
                }
                document.head.appendChild(link);
            });

            document.addEventListener('DOMContentLoaded', function () {
                document.querySelectorAll('[data-bg-eager][data-background]').forEach(function (element) {
                    element.style.backgroundImage = 'url(' + element.getAttribute('data-background') + ')';
                    element.dataset.bgLoaded = 'true';
                });
            }, { once: true });
        })();