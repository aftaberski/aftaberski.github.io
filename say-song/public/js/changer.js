$(document).ready(function(){

  // var chat_text = "Here is some text";
  // var text_arr = chat_text.split('');




  $("#play").on('click', function(){


    var message_text = $('.message.row').children('p').text();
    var message_arr = message_text.split('');
    console.log(message_arr);
            frequencyArray = strToFreqs(message_text)
            counter = 0;
            frequencyArray.forEach(function(element) {
                setTimeout(function() {
                 a = T('sin', {freq: element})
                 a.play();
                }, 500 * counter)
                 setTimeout(function(){
                  a.pause();
                }, 600 * counter);
                counter++;
            });
    var color_changer = function(index){
      var hue = Math.floor(Math.random() * 360);
      var pastel = 'hsl(' + hue + ', 100%, 87.5%)';
      document.body.style.backgroundColor = pastel;
    }

    var i = 0, l = message_arr.length;
      (function iterator() {
      console.log(message_arr[i]);
        color_changer(i);
        $('#letter-view').text(message_arr[i]);

      if(++i<message_arr.length) {
          setTimeout(iterator, 600);
      }
    })();


  });

});