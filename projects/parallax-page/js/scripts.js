$(document).ready(function(){
    $('section[data-type="background"]').each(function(){
        var $currentBackground = $(this);
        var window = self;
        $(window).scroll(function() {
            var yAxis = -($(window).scrollTop() / $currentBackground.data('speed'));

            var coordinates = '50% '+ yAxis + 'px';

            $currentBackground.css({ backgroundPosition: coordinates });
        });
    });
});