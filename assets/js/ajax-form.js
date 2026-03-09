$(function () {

	var form = $('#contact-form');
	var formMessages = $('.ajax-response');

	if (!form.length) {
		return;
	}

	$(form).submit(function (e) {
		var useEmailJs = $(form).data('emailjs') === true || $(form).data('emailjs') === 'true';
		if (!useEmailJs) {
			e.preventDefault();
			$(formMessages)
				.removeClass('success error')
				.text('Sending...');

			$.ajax({
				type: $(form).attr('method') || 'POST',
				url: $(form).attr('action'),
				data: $(form).serialize()
			})
				.done(function (response) {
					$(formMessages)
						.removeClass('error')
						.addClass('success')
						.text(response || 'Thank You! Your message has been sent.');

					$('#contact-form input[type!="hidden"], #contact-form textarea').val('');
				})
				.fail(function (xhr) {
					$(formMessages)
						.removeClass('success')
						.addClass('error')
						.text((xhr && xhr.responseText) || 'Oops! An error occurred and your message could not be sent.');
				});
			return;
		}

		if (typeof emailjs === 'undefined') {
			$(formMessages)
				.removeClass('success')
				.addClass('error')
				.text('Email service is not configured.');
			return;
		}

		e.preventDefault();

		// Optional: show sending state
		$(formMessages)
			.removeClass('success error')
			.text('Sending...');

		emailjs.sendForm(
			'service_4vm6rme',   // e.g. service_xxx
			'template_0n7v7vu',  // e.g. template_xxx
			'#contact-form'
		)
			.then(function () {
				$(formMessages)
					.removeClass('error')
					.addClass('success')
					.text('We received your message and will get back to you shortly.');

				$('#contact-form input, #contact-form textarea').val('');
			})
			.catch(function (error) {
				console.error(error);
				$(formMessages)
					.removeClass('success')
					.addClass('error')
					.text('Oops! An error occurred and your message could not be sent.');
			});
	});

});
