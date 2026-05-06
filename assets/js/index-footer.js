(function () {
            var isMobileViewport = window.matchMedia('(max-width: 767.98px)').matches;
            var scriptsStarted = false;
            var scriptQueue = [
                'assets/js/vendor/jquery-3.6.0.min.js',
                'assets/js/bootstrap.min.js',
                'assets/js/jquery.magnific-popup.min.js',
                'assets/js/swiper-bundle.js',
                'assets/js/slick.min.js',
                'assets/js/ajax-form.js',
                'assets/js/main.js'
            ];

            function loadScript(src) {
                return new Promise(function (resolve, reject) {
                    if (document.querySelector('script[src="' + src + '"]')) {
                        resolve();
                        return;
                    }

                    var script = document.createElement('script');
                    script.src = src;
                    script.async = false;
                    script.defer = true;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });
            }

            function loadScriptsSequentially(list) {
                return list.reduce(function (promise, src) {
                    return promise.then(function () {
                        return loadScript(src);
                    });
                }, Promise.resolve());
            }

            function startScriptLoading() {
                if (scriptsStarted) {
                    return;
                }

                scriptsStarted = true;
                if (typeof window.loadInteractiveStyles === 'function') {
                    window.loadInteractiveStyles();
                }
                loadScriptsSequentially(scriptQueue);
            }

            function observeDesktopInteractiveSections() {
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

                    startScriptLoading();
                    observer.disconnect();
                }, { rootMargin: '200px 0px' });

                targets.forEach(function (target) {
                    observer.observe(target);
                });
            }

            ['pointerdown', 'touchstart', 'keydown'].forEach(function (eventName) {
                window.addEventListener(eventName, startScriptLoading, { once: true, passive: true });
            });

            window.addEventListener('wheel', startScriptLoading, { once: true, passive: true });

            if (!isMobileViewport) {
                document.addEventListener('DOMContentLoaded', observeDesktopInteractiveSections, { once: true });
            }
        })();

(function () {
            if (!window.matchMedia('(max-width: 767.98px)').matches) {
                return;
            }

            function setupMobileHeroSlider() {
                var track = document.querySelector('.slider-active');
                var slides = track ? Array.prototype.slice.call(track.querySelectorAll('.single-slider')) : [];
                var dotsWrap = document.querySelector('.mobile-hero-dots');
                var prevButton = document.querySelector('.mobile-hero-prev');
                var nextButton = document.querySelector('.mobile-hero-next');

                if (!track || slides.length < 2 || !dotsWrap || !prevButton || !nextButton) {
                    return;
                }

                dotsWrap.innerHTML = '';
                slides.forEach(function (_, index) {
                    var dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'mobile-hero-dot';
                    dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
                    dot.addEventListener('click', function () {
                        track.scrollTo({ left: index * track.clientWidth, behavior: 'smooth' });
                    });
                    dotsWrap.appendChild(dot);
                });

                var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.mobile-hero-dot'));

                function getActiveIndex() {
                    return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1))));
                }

                function updateState() {
                    var activeIndex = getActiveIndex();

                    dots.forEach(function (dot, index) {
                        dot.classList.toggle('is-active', index === activeIndex);
                    });

                    prevButton.disabled = activeIndex === 0;
                    nextButton.disabled = activeIndex === slides.length - 1;
                }

                function scrollToIndex(index) {
                    track.scrollTo({
                        left: Math.max(0, Math.min(slides.length - 1, index)) * track.clientWidth,
                        behavior: 'smooth'
                    });
                }

                prevButton.addEventListener('click', function () {
                    scrollToIndex(getActiveIndex() - 1);
                });

                nextButton.addEventListener('click', function () {
                    scrollToIndex(getActiveIndex() + 1);
                });

                track.addEventListener('scroll', function () {
                    window.requestAnimationFrame(updateState);
                }, { passive: true });

                window.addEventListener('resize', updateState);
                updateState();
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', setupMobileHeroSlider, { once: true });
                return;
            }

            setupMobileHeroSlider();
        })();

(function () {
            if (!window.matchMedia('(max-width: 767.98px)').matches) {
                return;
            }

            function onReady(callback) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', callback, { once: true });
                    return;
                }
                callback();
            }

            onReady(function () {
                var body = document.body;
                var menuOuter = document.querySelector('.tgmobile__menu-outer');
                var menuSource = document.querySelector('.tgmenu__wrap .tgmenu__main-menu');
                var openButton = document.querySelector('.mobile-nav-toggler');
                var closeButton = document.querySelector('.tgmobile__menu .close-btn');
                var backdrop = document.querySelector('.tgmobile__menu-backdrop');
                var scrollButton = document.querySelector('.scroll-to-target');

                if (menuOuter && menuSource && !menuOuter.children.length) {
                    menuOuter.innerHTML = menuSource.innerHTML;
                }

                function dedupeMobileMenu() {
                    if (!menuOuter) {
                        return;
                    }

                    var navigationLists = menuOuter.querySelectorAll('.navigation');

                    if (navigationLists.length > 1) {
                        Array.prototype.forEach.call(navigationLists, function (list, index) {
                            if (index > 0) {
                                list.remove();
                            }
                        });
                    }
                }

                dedupeMobileMenu();

                if (menuOuter) {
                    Array.prototype.forEach.call(menuOuter.querySelectorAll('li.menu-item-has-children'), function (item) {
                        var existingButton = null;
                        var submenu = null;

                        Array.prototype.forEach.call(item.children, function (child) {
                            if (!existingButton && child.classList && child.classList.contains('dropdown-btn')) {
                                existingButton = child;
                            }
                            if (!submenu && child.tagName === 'UL') {
                                submenu = child;
                            }
                        });

                        if (existingButton) {
                            return;
                        }

                        var button = document.createElement('button');

                        button.type = 'button';
                        button.className = 'dropdown-btn';
                        button.setAttribute('aria-label', 'Toggle submenu');
                        button.innerHTML = '<span class="plus-line"></span>';
                        item.appendChild(button);

                        if (submenu) {
                            submenu.style.display = 'none';
                            button.addEventListener('click', function () {
                                var isOpen = button.classList.toggle('open');
                                submenu.style.display = isOpen ? 'block' : 'none';
                            });
                        }
                    });
                }

                function openMenu() {
                    body.classList.add('mobile-menu-visible');
                }

                function closeMenu() {
                    body.classList.remove('mobile-menu-visible');
                }

                if (openButton) {
                    openButton.addEventListener('click', openMenu);
                }
                if (closeButton) {
                    closeButton.addEventListener('click', closeMenu);
                }
                if (backdrop) {
                    backdrop.addEventListener('click', closeMenu);
                }

                function updateScrollButton() {
                    if (!scrollButton) {
                        return;
                    }
                    scrollButton.classList.toggle('open', window.scrollY >= 245);
                }

                if (scrollButton) {
                    scrollButton.addEventListener('click', function (event) {
                        event.preventDefault();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    });
                    updateScrollButton();
                    window.addEventListener('scroll', updateScrollButton, { passive: true });
                }

                window.setTimeout(dedupeMobileMenu, 1500);
            });
        })();