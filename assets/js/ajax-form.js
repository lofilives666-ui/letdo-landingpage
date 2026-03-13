$(function () {

	var form = $('#contact-form');
	var formMessages = $('.ajax-response');
	var recaptchaSiteKey = '';
	var recaptchaReadyPromise = null;
	var recaptchaTokenInput = form.find('input[name="g-recaptcha-response"]');

	function refreshFormStartedAt() {
		form.find('input[name="form_started_at"]').val(String(Date.now()));
	}

	function setFormMessage(type, message) {
		$(formMessages)
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

	if (!form.length) {
		return;
	}

	refreshFormStartedAt();
	prepareRecaptcha();

	$(form).submit(function (e) {
		var useEmailJs = $(form).data('emailjs') === true || $(form).data('emailjs') === 'true';
		e.preventDefault();
		if (!recaptchaSiteKey) {
			setFormMessage('error', 'Spam protection is not ready yet. Please refresh and try again.');
			return;
		}
		e.preventDefault();
		setFormMessage('', 'Sending...');
		executeRecaptcha()
			.then(function (token) {
				if (!token) {
					throw new Error('Missing reCAPTCHA token.');
				}
				recaptchaTokenInput.val(token);

				if (!useEmailJs) {
					return $.ajax({
						type: $(form).attr('method') || 'POST',
						url: $(form).attr('action'),
						data: $(form).serialize()
					}).done(function (response) {
						setFormMessage('success', response || 'Thank You! Your message has been sent.');
						$('#contact-form input[type!="hidden"], #contact-form textarea').val('');
						recaptchaTokenInput.val('');
						refreshFormStartedAt();
					});
				}

				if (typeof emailjs === 'undefined') {
					throw new Error('Email service is not configured.');
				}

				return emailjs.sendForm(
					'service_4vm6rme',
					'template_0n7v7vu',
					'#contact-form'
				).then(function () {
					setFormMessage('success', 'We received your message and will get back to you shortly.');
					$('#contact-form input, #contact-form textarea').val('');
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
