$(function () {

	var form = $('#contact-form');
	var formMessages = $('.ajax-response');
	var recaptchaSiteKey = '';
	var recaptchaWidgetId = null;
	var recaptchaReadyPromise = null;

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
		if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
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
			script.src = 'https://www.google.com/recaptcha/api.js?onload=__letsdoRecaptchaOnload&render=explicit';
			script.async = true;
			script.defer = true;
			script.onerror = function () {
				reject(new Error('Unable to load reCAPTCHA.'));
			};
			document.head.appendChild(script);
		});

		return recaptchaReadyPromise;
	}

	function renderRecaptcha() {
		var slot = form.find('.g-recaptcha-slot')[0];
		if (!slot || !recaptchaSiteKey) {
			return Promise.resolve();
		}

		return loadRecaptchaScript().then(function (grecaptcha) {
			if (recaptchaWidgetId !== null) {
				return;
			}
			slot.setAttribute('data-sitekey', recaptchaSiteKey);
			recaptchaWidgetId = grecaptcha.render(slot, {
				sitekey: recaptchaSiteKey,
				theme: 'light'
			});
		});
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
			return renderRecaptcha();
		}).catch(function () {
			setFormMessage('error', 'Unable to load spam protection. Please refresh and try again.');
		});
	}

	function getRecaptchaResponse() {
		if (recaptchaWidgetId === null || !window.grecaptcha) {
			return '';
		}
		return window.grecaptcha.getResponse(recaptchaWidgetId);
	}

	function resetRecaptcha() {
		if (recaptchaWidgetId !== null && window.grecaptcha) {
			window.grecaptcha.reset(recaptchaWidgetId);
		}
	}

	if (!form.length) {
		return;
	}

	refreshFormStartedAt();
	prepareRecaptcha();

	$(form).submit(function (e) {
		var useEmailJs = $(form).data('emailjs') === true || $(form).data('emailjs') === 'true';
		var recaptchaResponse = getRecaptchaResponse();
		if (!recaptchaSiteKey) {
			e.preventDefault();
			setFormMessage('error', 'Spam protection is not ready yet. Please refresh and try again.');
			return;
		}
		if (!recaptchaResponse) {
			e.preventDefault();
			setFormMessage('error', 'Please complete the reCAPTCHA challenge.');
			return;
		}

		if (!useEmailJs) {
			e.preventDefault();
			setFormMessage('', 'Sending...');

			$.ajax({
				type: $(form).attr('method') || 'POST',
				url: $(form).attr('action'),
				data: $(form).serialize()
			})
				.done(function (response) {
					setFormMessage('success', response || 'Thank You! Your message has been sent.');

					$('#contact-form input[type!="hidden"], #contact-form textarea').val('');
					refreshFormStartedAt();
					resetRecaptcha();
				})
				.fail(function (xhr) {
					setFormMessage('error', (xhr && xhr.responseText) || 'Oops! An error occurred and your message could not be sent.');
					resetRecaptcha();
				});
			return;
		}

		if (typeof emailjs === 'undefined') {
			setFormMessage('error', 'Email service is not configured.');
			return;
		}

		e.preventDefault();

		setFormMessage('', 'Sending...');

		emailjs.sendForm(
			'service_4vm6rme',   // e.g. service_xxx
			'template_0n7v7vu',  // e.g. template_xxx
			'#contact-form'
		)
			.then(function () {
				setFormMessage('success', 'We received your message and will get back to you shortly.');

				$('#contact-form input, #contact-form textarea').val('');
				refreshFormStartedAt();
				resetRecaptcha();
			})
			.catch(function (error) {
				console.error(error);
				setFormMessage('error', 'Oops! An error occurred and your message could not be sent.');
				resetRecaptcha();
			});
	});

});
