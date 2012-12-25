var initialize = function(){
  initializeCanvas();
};

var video = document.getElementById('video-stream');
var canvas = document.getElementById('video-canvas');
var ctx = canvas.getContext('2d');
var img = document.getElementById('video-snapshot');
var localMediaStream = null;

// No funciona en chrome
// video.onloadedmetadata = function(e) {
//   var width = this.videoWidth,
//       height = this.videoHeight;
//   console.log('boomtown!');
// };
// 
// video.addEventListener( "loadedmetadata", function (e) {
//     var width = this.videoWidth,
//         height = this.videoHeight;
//         console.log('boomtown!');
// }, false );


var vw, vh, newWidth, newHeight, offsetX, offsetY;
var tamanoInfantil = 2.5/3;

function sizeCanvas() {
  // console.log(video.videoWidth);
  if(video.videoWidth > 0 && video.videoHeight > 0) {
    vw = video.videoWidth;
    vh = video.videoHeight;
    offsetX = (vw-(vh*tamanoInfantil))/2;
    offsetY = 0;
    newWidth = vh*tamanoInfantil;
    newHeight = vh;

    canvas.width = newWidth;
    canvas.height = newHeight;
    img.height = newWidth;
    img.width = newHeight;
    $('#start-camera').hide();
    $('#capture-camera').show();
    initializeCanvas(); // Placed here for old browsers?
    renderVideoInCanvas();
  } else {
    setTimeout(function () {
      sizeCanvas();
    }, 100);
  }
}

function initializeCanvas(){
  // Display style
  var styleWidth = 160;
  var styleHeigth = styleWidth/tamanoInfantil;

  canvas.style.height = styleHeigth + 'px';
  canvas.style.width  = styleWidth + 'px';
  img.style.height    = styleHeigth + 'px';
  img.style.width     = styleWidth + 'px';

  // Hide Video
  video.style.height = 0 + 'px';
  video.style.width  = 0 + 'px';
}

function renderVideoInCanvas(){
  ctx.drawImage(video, offsetX, offsetY, newWidth, newHeight, 0, 0, newWidth, newHeight);
  setTimeout(renderVideoInCanvas, 1000 / 30); // 30fps
}

function snapshot(){
  // img.src = canvas.toDataURL('image/webp');
  img.src = canvas.toDataURL('image/png');
}

function onFailSoHard(e) {
  if (e.code == 1) {
    alert('User denied access to their camera');
  } else {
    alert(e);
  }
}

$('#start-camera').on('click', function (e) {
  navigator.gUM = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  if(navigator.gUM){
    window.URL = window.URL || window.webkitURL;

    if(!localMediaStream || localMediaStream.readyState == 2){
      // if (navigator.webkitGetUserMedia) {
      //   console.log('navigator.webkitGetUserMedia');
      //   navigator.webkitGetUserMedia(
      //     {video: true},
      //     function (stream) {
      //       video.src = window.webkitURL.createObjectURL(stream);
      //       localMediaStream = stream;
      //       sizeCanvas();
      //     },
      //     onFailSoHard
      //   );
      // } else if (navigator.getUserMedia || navigator.mozGetUserMedia) {
    navigator.gUM(
      {video: true},
      function (stream) {
        // video.src = stream;
        if(navigator.mozGetUserMedia){
          // Firefox
          video.mozSrcObject = stream;
          video.play();
        } else {
          // Chrome
          video.src = window.URL.createObjectURL(stream);
        }
        localMediaStream = stream;
        sizeCanvas();
      },
      onFailSoHard
    );
    } else {
      video.play();
    }
  } else {
    onFailSoHard();
  }

});

$('#capture-camera, #video-canvas').on('click', function (e) {
    if (localMediaStream) {
        snapshot();
        return;
    }
});
