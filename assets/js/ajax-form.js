$(function () {

	var form = $('#contact-form');
	var formMessages = $('.ajax-response');
	var recaptchaSiteKey = '';
	var recaptchaReadyPromise = null;
	var recaptchaPrepared = false;

	if (!form.length) {
		return;
	}

	var recaptchaTokenInput = form.find('input[name="g-recaptcha-response"]');

	function refreshFormStartedAt() {
		form.find('input[name="form_started_at"]').val(String(Date.now()));
	}

	function setFormMessage(type, message) {
		formMessages
			.removeClass('success error')
			.addClass(type || '')
			.text(message || '');
	}

	function loadRecaptchaScript() {
		if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
			return Promise.resolve(window.grecaptcha);
		}
		if (recaptchaReadyPromise) {
			return recaptchaReadyPromise;
		}

		recaptchaReadyPromise = new Promise(function (resolve, reject) {
			window.__letsdoRecaptchaOnload = function () {
				resolve(window.grecaptcha);
			};

			var script = document.createElement('script');
			script.src = 'https://www.google.com/recaptcha/api.js?onload=__letsdoRecaptchaOnload&render=' + encodeURIComponent(recaptchaSiteKey);
			script.async = true;
			script.defer = true;
			script.onerror = function () {
				reject(new Error('Unable to load reCAPTCHA.'));
			};
			document.head.appendChild(script);
		});

		return recaptchaReadyPromise;
	}

	function prepareRecaptcha() {
		if (recaptchaPrepared) {
			return recaptchaReadyPromise || Promise.resolve();
		}

		recaptchaPrepared = true;
		return new Promise(function (resolve) {
			$.getJSON('/api/recaptcha-config')
				.done(function (config) {
					recaptchaSiteKey = config && config.siteKey ? String(config.siteKey) : '';
					resolve();
				})
				.fail(function () {
					recaptchaSiteKey = '';
					resolve();
				});
		}).then(function () {
			if (!recaptchaSiteKey) {
				setFormMessage('error', 'Spam protection is not configured. Set RECAPTCHA_SITE_KEY.');
				return;
			}
			return loadRecaptchaScript();
		}).catch(function () {
			setFormMessage('error', 'Unable to load spam protection. Please refresh and try again.');
		});
	}

	function executeRecaptcha() {
		if (!recaptchaSiteKey || !window.grecaptcha) {
			return Promise.resolve('');
		}
		return new Promise(function (resolve, reject) {
			window.grecaptcha.ready(function () {
				window.grecaptcha.execute(recaptchaSiteKey, { action: 'contact_form' })
					.then(resolve)
					.catch(reject);
			});
		});
	}

	refreshFormStartedAt();
	form.one('focusin mouseenter touchstart', function () {
		prepareRecaptcha();
	});

	form.on('submit', function (e) {
		e.preventDefault();
		setFormMessage('', 'Sending...');
		prepareRecaptcha()
			.then(function () {
				if (!recaptchaSiteKey) {
					throw new Error('Spam protection is not ready yet. Please try again.');
				}
				return executeRecaptcha();
			})
			.then(function (token) {
				if (!token) {
					throw new Error('Missing reCAPTCHA token.');
				}
				recaptchaTokenInput.val(token);

				return $.ajax({
					type: form.attr('method') || 'POST',
					url: form.attr('action'),
					data: form.serialize()
				}).done(function (response) {
					setFormMessage('success', response || 'Thank You! Your message has been sent.');
					form.find('input[type!="hidden"], textarea').val('');
					recaptchaTokenInput.val('');
					refreshFormStartedAt();
				});
			})
			.catch(function (error) {
				console.error(error);
				setFormMessage('error', (error && error.responseText) || error.message || 'Oops! An error occurred and your message could not be sent.');
			});
	});

});
