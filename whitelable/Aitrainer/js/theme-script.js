(function(jQuery) {

"use strict";

/*------------------------------------
  HT Predefined Variables
--------------------------------------*/
var jQuerywindow = jQuery(window),
    jQuerydocument = jQuery(document),
    jQuerybody = jQuery('body');

//Check if function exists
jQuery.fn.exists = function () {
  return this.length > 0;
};


/*------------------------------------
  HT PreLoader
--------------------------------------*/
function preloader() {
   jQuery('#ht-preloader').fadeOut();
};


/*------------------------------------
  HT menu
--------------------------------------*/
function menu() {  
 jQuery('.dropdown-menu a.dropdown-toggle').on('click', function(e) {
  if (!jQuery(this).next().hasClass('show')) {
    jQuery(this).parents('.dropdown-menu').first().find('.show').removeClass("show");
  }
  var jQuerysubMenu = jQuery(this).next(".dropdown-menu");
  jQuerysubMenu.toggleClass('show');

  jQuery(this).parents('li.nav-item.dropdown.show').on('hidden.bs.dropdown', function(e) {
    jQuery('.dropdown-submenu .show').removeClass("show");
  });

  return false;
});
};



/*------------------------------------
  HT Counter
--------------------------------------*/
function counter() {  
  var elementSelector = jQuery('.count-number');
    elementSelector.each(function(){
        elementSelector.appear(function(e) {
            var el = this;
            var updateData = jQuery(el).attr("data-count");
            var od = new Odometer({
                el: el,
                format: 'd',
                duration: 2000
            });
            od.update(updateData);
        });
    });
};


/*------------------------------------
  HT Owl Carousel
--------------------------------------*/
function owlcarousel() {
jQuery('.owl-carousel').each( function() {
  var jQuerycarousel = jQuery(this);
  jQuerycarousel.owlCarousel({
      items : jQuerycarousel.data("items"),
      slideBy : jQuerycarousel.data("slideby"),
      center : jQuerycarousel.data("center"),
      loop : true,
      margin : jQuerycarousel.data("margin"),
      dots : jQuerycarousel.data("dots"),
      nav : jQuerycarousel.data("nav"),      
      autoplay : jQuerycarousel.data("autoplay"),
      autoplayTimeout : jQuerycarousel.data("autoplay-timeout"),
      navText : [ '<span class="bi bi-arrow-left"><span>', '<span class="bi bi-arrow-right"></span>' ],
      responsive: {
        0:{items: jQuerycarousel.data('xs-items') ? jQuerycarousel.data('xs-items') : 1},
        576:{items: jQuerycarousel.data('sm-items')},
        768:{items: jQuerycarousel.data('md-items')},
        1024:{items: jQuerycarousel.data('lg-items')},
        1200:{items: jQuerycarousel.data("items")}
      },
  });
});
};


/*------------------------------------
  HT Magnific Popup
--------------------------------------*/
function magnificpopup() {
jQuery('.popup-gallery').magnificPopup({
    delegate: 'a.popup-img',
    type: 'image',
    tLoading: 'Loading image #%curr%...',
    mainClass: 'mfp-img-mobile',
    gallery: {
      enabled: true,
      navigateByImgClick: true,
      preload: [0,1] // Will preload 0 - before current, and 1 after the current image
    },
    image: {
      tError: '<a href="%url%">The image #%curr%</a> could not be loaded.',
      titleSrc: function(item) {
        return item.el.attr('title') + '<small>by Marsel Van Oosten</small>';
      }
    }
  });
if (jQuery(".popup-youtube, .popup-vimeo, .popup-gmaps").exists()) {
     jQuery('.popup-youtube, .popup-vimeo, .popup-gmaps').magnificPopup({
          disableOn: 700,
          type: 'iframe',
          mainClass: 'mfp-fade',
          removalDelay: 160,
          preloader: false,
          fixedContentPos: false
    });
  }

};     

/*------------------------------------
  HT Scroll to top
--------------------------------------*/
function scrolltop() {
//Scroll back to top
        
        var progressPath = document.querySelector('.scroll-top path');
        var pathLength = progressPath.getTotalLength();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'none';
        progressPath.style.strokeDasharray = pathLength + ' ' + pathLength;
        progressPath.style.strokeDashoffset = pathLength;
        progressPath.getBoundingClientRect();
        progressPath.style.transition = progressPath.style.WebkitTransition = 'stroke-dashoffset 10ms linear';      
        var updateProgress = function () {
            var scroll = jQuery(window).scrollTop();
            var height = jQuery(document).height() - jQuery(window).height();
            var progress = pathLength - (scroll * pathLength / height);
            progressPath.style.strokeDashoffset = progress;
        }
        updateProgress();
        jQuery(window).scroll(updateProgress);  
        var offset = 50;
        var duration = 550;
        jQuery(window).on('scroll', function() {
            if (jQuery(this).scrollTop() > offset) {
                jQuery('.scroll-top').addClass('active-progress');
            } else {
                jQuery('.scroll-top').removeClass('active-progress');
            }
        });             
        jQuery('.scroll-top').on('click', function(event) {
            event.preventDefault();
            jQuery('html, body').animate({scrollTop: 0}, duration);
            return false;
        })
};



/*------------------------------------
  HT Fixed Header
--------------------------------------*/
function fxheader() {
  jQuery(window).on('scroll', function () {
    if (jQuery(window).scrollTop() >= 100) {
      jQuery('#header-wrap').addClass('fixed-header');
    } else {
      jQuery('#header-wrap').removeClass('fixed-header');
    }
  });
};


/*------------------------------------------
  HT Text Color, Background Color And Image
---------------------------------------------*/
function databgcolor() {
    jQuery('[data-bg-color]').each(function(index, el) {
     jQuery(el).css('background-color', jQuery(el).data('bg-color'));  
    });
    jQuery('[data-text-color]').each(function(index, el) {
     jQuery(el).css('color', jQuery(el).data('text-color'));  
    });
    jQuery('[data-bg-img]').each(function() {
     jQuery(this).css('background-image', 'url(' + jQuery(this).data("bg-img") + ')');
    });
};


/*------------------------------------
  HT Contact Form
--------------------------------------*/
function contactform() { 
    // when the form is submitted
    jQuery('#contact-form, #main-form').on('submit', function (e) {
    e.preventDefault();
    var jQueryform = jQuery(this);
    var name = jQuery.trim(jQueryform.find('input[name="name"]').val() || '');
    var email = jQuery.trim(jQueryform.find('input[name="email"]').val() || '');
    var message = jQuery.trim(jQueryform.find('textarea[name="message"]').val() || '');
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !message) {
        jQueryform.find('.messages').html('<div class="alert alert-danger alert-dismissable">Please fill in name, email, and message.</div>').show().delay(3000).fadeOut('slow');
        return false;
    }

    if (!emailRegex.test(email)) {
        jQueryform.find('.messages').html('<div class="alert alert-danger alert-dismissable">Please enter a valid email address.</div>').show().delay(3000).fadeOut('slow');
        return false;
    }

    // if the validator does not prevent form submit
    if (!e.isDefaultPrevented()) {
        var url = "php/contact.php";

        // POST values in the background the the script URL
        jQuery.ajax({
            type: "POST",
            url: url,
            data: jQueryform.serialize(),
            success: function (data) {
              // Handle string responses from non-JSON servers gracefully
              if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (err) {}
              }

              var type = (data && data.type) ? data.type : 'danger';
              var message = (data && data.message) ? data.message : 'Something went wrong. Please try again.';
              var messageAlert = 'alert-' + type;
              var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable">' + message + '</div>';

              jQueryform.find('.messages').html(alertBox).show().delay(3000).fadeOut('slow');

              if (type === 'success') {
                jQueryform[0].reset();
              }
            },
            error: function () {
              var alertBox = '<div class="alert alert-danger alert-dismissable">Unable to send message right now. Please try again later.</div>';
              jQueryform.find('.messages').html(alertBox).show().delay(3000).fadeOut('slow');
            }
        });
        return false;
    }
 })   
};


/*------------------------------------
  HT ProgressBar
--------------------------------------*/
  function progressbar () {
    var progressBar = jQuery('.progress');
    if(progressBar.length) {
      progressBar.each(function () {
        var Self = jQuery(this);
        Self.appear(function () {
          var progressValue = Self.data('value');

          Self.find('.progress-bar').animate({
            width:progressValue+'%'           
          }, 1000);
        });
      })
    }
};


/*------------------------------------
  HT Countdown
--------------------------------------*/
function countdown() {
  jQuery('.countdown').each(function () {
    var jQuerythis = jQuery(this),
      finalDate = jQuery(this).data('countdown');
    jQuerythis.countdown(finalDate, function (event) {
      jQuery(this).html(event.strftime('<li><span>%-D</span><p>Days</p></li>' + '<li><span>%-H</span><p>Hours</p></li>' + '<li><span>%-M</span><p>Minutes</p></li>' + '<li><span>%S</span><p>Seconds</p></li>'));
    });
  });
};

/*------------------------------------
  HT btnproduct
--------------------------------------*/
function btnproduct() {
  jQuery('.btn-product-up').on('click', function (e) {
    e.preventDefault();
    var numProduct = Number(jQuery(this).next().val());
    if (numProduct > 1) jQuery(this).next().val(numProduct - 1);
  });
  jQuery('.btn-product-down').on('click', function (e) {
    e.preventDefault();
    var numProduct = Number(jQuery(this).prev().val());
    jQuery(this).prev().val(numProduct + 1);
  }); 
};

/*------------------------------------
  HT Wow Animation
--------------------------------------*/
function wowanimation() {
    var wow = new WOW({
        boxClass: 'wow',
        animateClass: 'animate__animated',
        offset: 0,
        mobile: false,
        live: true
    });
    wow.init();
}


/*------------------------------------
  HT Window load and functions
--------------------------------------*/
jQuery(document).ready(function() {
    menu(),
    owlcarousel(),
    counter(),
    magnificpopup(),
    scrolltop(),
    fxheader(),
    databgcolor(),  
    contactform(),
    progressbar(),
    countdown(),
    btnproduct();
});

jQuery(window).on('load', function() {
    preloader(),
    wowanimation();
});

})(jQuery);
