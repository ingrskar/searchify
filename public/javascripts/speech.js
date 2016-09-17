/**
 * Created by ingridskar on 16/08/16.
 */
var final_transcript = '';
var recognizing = false;

if (!('webkitSpeechRecognition' in window)) {
    result_span.value = 'Browser not supported';
} else {

    var recognition = new webkitSpeechRecognition();
    recognition.continuous = false; // single result
    recognition.interimResults = false; // results final

    recognition.lang = 'en-AU'; // Language: English AU

    recognition.onstart = function() {
        recognizing = true;
    };

    recognition.onerror = function(event) {

        if (event.error == 'no-speech') {
            result_span.value = 'No speech';
        }

        if (event.error == 'audio-capture') {
            result_span.value = 'No mic found';
        }
    };

    recognition.onresult = function(event) {

        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            }
        }
        result_span.value = final_transcript;
        console.log(final_transcript);
    };

    recognition.onend = function(event) {
        recognizing = false;
        result_span.value = final_transcript.toUpperCase();

    };
}

function startButton(event) {
    if (recognizing) {
        recognition.stop();
        return;
    };
    final_transcript = '';
    recognition.start();
    result_span.value = 'RECORDING...';
}



