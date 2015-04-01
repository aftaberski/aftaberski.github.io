$(document).ready(function() {
    var firebase = new Firebase("https://saysong.firebaseio.com");
    $('#messageInput').keypress(function(e) {
        if (e.keyCode == 13) {
            var name = $('#nameInput').val();
            var text = $('#messageInput').val();
            firebase.push({
                name: name,
                text: text
            });
            $('#messageInput').val('');
        }
    });
    firebase.on('child_added', function(snapshot) {
        var message = snapshot.val();
        displayChatMessage(message.name, message.text);
    });

    function displayChatMessage(name, text) {
        $('<div class="message row"/>')
            .prepend('<p class="col-lg-7">' + text + '</p>')
            .prepend($('<em class="name col-lg-2 col-lg-offset-1"/>')
                .text(name + ': '))
            .append('<i class="fa fa-music col-lg-1"></i>')
            .appendTo($('#messagesDiv'));
        $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
    };
    // setInterval(function() {firebase.remove()}, 300000)
    setTimeout(function() {
        $('i').on('click', function() {
            var $clickedText = $(this).parent('div').children('p').text()
            frequencyArray = strToFreqs($clickedText)
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

          var message_text = $(this).parent('div').children('p').text();
          var message_arr = message_text.split('');
          message_arr.forEach(function(ele, index, array){
            console.log(ele);
          })

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
              setTimeout(iterator, 1000);
            }
          })();
        });
    }, 1000)
});

