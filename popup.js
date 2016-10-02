// Thanks to the following StackOverflow users: Shadow Wizard, ThinkingStiff, Peanut
// Smaller image for testing
var imageAddr = "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png";
var downloadSize = 5969; //bytes

// Larger image for more accurate results 
// var imageAddr = "https://upload.wikimedia.org/wikipedia/commons/4/4b/Catedral_de_Toledo.Altar_Mayor_%28huge%29.jpg";
// var downloadSize = 75797288; //bytes

var longitude, latitude, accuracy, speed, speedMbps;

function ShowProgressMessage(msg) {
    if (console) {
        if (typeof msg == "string") {
            // console.log(msg);
        } else {
            for (var i = 0; i < msg.length; i++) {
                // console.log(msg[i]);
            }
        }
    }

    var oProgress = document.getElementById("progress");
    if (oProgress) {
        var actualHTML = (typeof msg == "string") ? msg : msg.join("<br />");
        oProgress.innerHTML = actualHTML;
    }
}

function InitiateSpeedDetection() {
    ShowProgressMessage("Testing speed...");
    window.setTimeout(MeasureConnectionSpeed, 1);
}

if (window.addEventListener) {
    window.addEventListener('load', InitiateSpeedDetection, false);
} else if (window.attachEvent) {
    window.attachEvent('onload', InitiateSpeedDetection);
}

function MeasureConnectionSpeed() {
    var startTime, endTime;
    var download = new Image();
    download.onload = function() {
        endTime = (new Date()).getTime();
        showResults();
    }

    download.onerror = function(err, msg) {
        ShowProgressMessage("Error testing download");
    }

    startTime = (new Date()).getTime();
    var cacheBuster = "?nnn=" + startTime;
    download.src = imageAddr + cacheBuster;

    function showResults() {
        var duration = (endTime - startTime) / 1000;
        var bitsLoaded = downloadSize * 8;
        var speedBps = (bitsLoaded / duration).toFixed(2);
        var speedKbps = (speedBps / 1024).toFixed(2);
        speedMbps = (speedKbps / 1024).toFixed(2);
        ShowProgressMessage([
            "Your connection speed is:",
            // speedBps + " bps", 
            // speedKbps + " kbps", 
            speedMbps + " Mbps"
        ]);
    }
}

function checkUploadSpeed(iterations, update) {
    var index = 0,
        timer = window.setInterval(check, 5000); //check every 5 seconds
    check();

    function check() {
        var xhr = new XMLHttpRequest(),
            url = '?cache=' + Math.floor(Math.random() * 10000), //random number prevents url caching
            data = getRandomString(1), // 1 meg POST size handled by all servers
            startTime,
            speed = 0;
        xhr.onreadystatechange = function(event) {
            if (xhr.readyState == 4) {
                speed = Math.round(1024 / ((new Date() - startTime) / 1000));
                update(speed);
                index++;
                if (index == iterations) {
                    window.clearInterval(timer);
                };
            };
        };
        xhr.open('POST', url, true);
        startTime = new Date();
        xhr.send(data);
    };

    function getRandomString(sizeInMb) {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]\{}|;':,./<>?", //random data prevents gzip effect
            iterations = sizeInMb * 1024 * 1024, //get byte count
            result = '';
        for (var index = 0; index < iterations; index++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        };
        return result;
    };
};

checkUploadSpeed(1, function(speed) {
    speed = speed / 1000;
    document.getElementById('speed').textContent = 'Upload speed: ' + speed + 'Mbps';
});

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

if (!navigator.geolocation) {
    document.getElementById('location').textContent = 'Geolocation is not supported by your browser';
} else {
    var optn = {
        enableHighAccuracy: true,
        timeout: Infinity,
        maximumAge: 0
    };
    var geoloc;

    var successful = function(position) {
        geoloc = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: position.coords.accuracy
        };
    };
    var getLocation = function(callback) {
        navigator.geolocation.getCurrentPosition(function(pos) {
            successful(pos);
            typeof callback === 'function' && callback(geoloc);
        }, showError, optn);
    };
    getLocation(function(pos) {

        document.getElementById('location').innerHTML = 'Latitude: ' + pos.latitude + '<br />Longitude: ' + pos.longitude + '<br />Accuracy: ' + pos.accuracy;

        chrome.storage.sync.set({
            "download": speedMbps,
            "upload": speed,
            "latitude": pos.latitude,
            "longitude": pos.longitude,
            "accuracy": pos.accuracy
        }, function() {
            var location = document.getElementById('location');
            location.innerHTML = location.innerHTML + '<hr />Saved!';
        });

    });
}