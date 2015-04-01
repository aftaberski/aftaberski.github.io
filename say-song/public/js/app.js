var strToFreqs = function(string) {
    return mapCharToFreq(mapStringToChar(string));
}
var mapStringToChar = function(string) {
    var arr = [];
    for (var i = 0; i < string.length; i++) {
        arr.push(string.toUpperCase().charCodeAt(i));
    }
    return arr;
}
var mapCharToFreq = function(arr) {
    var codeArray = [];
    for (var i = 0; i < arr.length; i++) {
        codeArray.push(charToFrequency(arr[i]));
    }

    return codeArray;
}

function charToFrequency(char) {
    return (char - 31) * 10 + 200;
}