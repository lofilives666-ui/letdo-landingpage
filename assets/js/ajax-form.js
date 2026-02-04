$(function () {

	var form = $('#contact-form');
	var formMessages = $('.ajax-response');

	$(form).submit(function (e) {
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
