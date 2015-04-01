var context;
var source, sourceJs;
var analyser;
var buffer;
var url = '../sample-stump.mp3';
var array = new Array();

var request = new XMLHttpRequest();
request.open('GET', url, true);
request.responseType = "arraybuffer";

request.onload = function() {
    context.decodeAudioData(
        request.response,
        function(buffer) {
            if(!buffer) {
                // Error decoding file data
                return;
            }

            sourceJs = context.createJavaScriptNode(2048);
            sourceJs.buffer = buffer;
            sourceJs.connect(context.destination);
            analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.6;
            analyser.fftSize = 512;

            source = context.createBufferSource();
            source.buffer = buffer;

            source.connect(analyser);
            analyser.connect(sourceJs);
            source.connect(context.destination);

            sourceJs.onaudioprocess = function(e) {
                array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
            };

            source.start(0);
        },

        function(error) {
            // Decoding error
        }
    );
};