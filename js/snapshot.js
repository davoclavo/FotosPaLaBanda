//$(function(){
  var video = document.createElement('video');
  // Autoplay to avoid just showing the first frame, as the controls are hidden
  video.setAttribute('autoplay','');

  var _inputCanvas = document.getElementById('video-canvas');
  var input = _inputCanvas.getContext('2d');
  var _overlayCanvas = document.getElementById('video-canvas-overlay');
  var overlay = _overlayCanvas.getContext('2d');
  var _outputCanvas = document.createElement('canvas');
  var output = _outputCanvas.getContext('2d');

  var _downloadLink = document.createElement('a');

  var inputImg = document.getElementById('video-photo');
  var outputImg = document.getElementById('output-photo');

  var localMediaStream = null;

  var vw, vh, newWidth, newHeight, offsetX, offsetY;

  var photoFormats = {
    // In millimeters
    inputs: {
      'infantil': {
        w: 25,
        h: 30,
        label: 'Infantil - 2.5x3 cm'
      },
      'pasaporte': {
        w: 35,
        h: 45,
        label: 'Pasaporte - 3.5x4.5 cm'
      },
      'credencial': {
        w: 35,
        h: 50,
        label: 'Credencial - 3.5x5 cm'
      }
    },
    outputs: {
      '4x6': {
        w: 102,
        h: 152
      },
      '5x7': {
        w: 127,
        h: 178
      },
      '6x8': {
        w: 152,
        h: 203
      }
    }
  };

  var filetype = 'jpeg'; // 'png', 'webp'

  var inputFormat, outputFormat;

  function setInputFormat (format) {
    inputFormat = format;
  }

  function setOutputFormat (format) {
    outputFormat = format;
  }


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

  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

  window.URL = window.URL ||
               window.webkitURL;
  
  // Draw on overlay canvas
  function updateOverlay(){
    overlay.globalAlpha = 0.8;
    overlay.beginPath();
    overlay.moveTo(newWidth/2,0);
    overlay.lineTo(newWidth/2,newHeight);
    overlay.moveTo(0,newHeight/2);
    overlay.lineTo(newWidth,newHeight/2);
    overlay.strokeStyle = '#00FF00';
    overlay.stroke();
  }

  // Resize canvas to fit the largest possible rectangle, with
  // inputFormat aspect ratio, inside the video
  function sizeCanvas() {
    if(video.videoWidth > 0 && video.videoHeight > 0) {
      vw = video.videoWidth;
      vh = video.videoHeight;
      var aspectratio = inputFormat.w/inputFormat.h;

      if (vh < vw) {
        offsetX = (vw - (vh*aspectratio)) / 2;
        offsetY = 0;
        xSize = ySize = vh;
      } else {
        offsetX = 0;
        offsetY = (vh - (vw*aspectratio)) / 2;
        xSize = ySize = vw;
      }

      newWidth = vh*aspectratio;
      newHeight = vh;

      input.canvas.width = newWidth;
      input.canvas.height = newHeight;
      overlay.canvas.width = newWidth;
      overlay.canvas.height = newHeight;

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

  // Fixed width, variable height
  var styleWidth = 170;
  function initializeCanvas(){
    // Display style

    var aspectratio = inputFormat.w/inputFormat.h;
    var styleHeigth = styleWidth/aspectratio;

    input.canvas.style.width    = styleWidth  + 'px';
    input.canvas.style.height   = styleHeigth + 'px';
    overlay.canvas.style.width  = styleWidth  + 'px';
    overlay.canvas.style.height = styleHeigth + 'px';
    // inputImg.style.width             = styleWidth  + 'px';
    // inputImg.style.height            = styleHeigth + 'px';
  }

  var fps = 30;
  function renderVideoInCanvas(){
    input.drawImage(video, offsetX, offsetY, newWidth, newHeight, 0, 0, newWidth, newHeight);
    setTimeout(renderVideoInCanvas, 1000 / fps);
  }

  function snapshot(){
    if (localMediaStream) {
      inputImg.src = input.canvas.toDataURL('image/' + filetype);
      mergeSnapshots();
    }
  }

  function mergeSnapshots(){
    // Amount of possible pictures, both x and y axis.
    // TODO: Calculate which orientation is better [Horizontal|Vertical]
    var timesX = outputFormat.w/inputFormat.w;
    var timesY = outputFormat.h/inputFormat.h;

    // Reduce resolution factor
    var reduction = 1;
    var cw = input.canvas.width/reduction;
    var ch = input.canvas.height/reduction;

    output.canvas.width = timesX*cw;
    output.canvas.height = timesY*ch;

    for(var y=0; y+ch<output.canvas.height;y+=ch){
      for(var x=0; x+cw<output.canvas.width;x+=cw){
        output.drawImage(input.canvas, 0, 0, input.canvas.width, input.canvas.height, x, y, cw, ch);
      }
    }

    var dataURI = output.canvas.toDataURL('image/' + filetype);

    // Set the output image source as dataURL
    // *Crashes the browser if the image is too big
    // outputImg.src = dataURI;
    // $(_downloadLink).attr('href', dataURI).attr('download','le_photo.' + filetype);

    // Set the output image source as a blob
    var blob = dataURItoBlob(dataURI);
    var blobURL = window.URL.createObjectURL(blob);
    $(_downloadLink).attr('href', blobURL).attr('download','le_photo.' + filetype);
    outputImg.src = blobURL;

    outputImg.setAttribute('download','le_photo.' + filetype);
  }

  function getUserMediaError(e) {
    if (e.code == 1) {
      alert('User denied access to their camera');
    } else {
      alert(e);
    }
  }

  function startVideo(){
    if(navigator.getUserMedia){
      if(!localMediaStream || localMediaStream.readyState == 2){
        navigator.getUserMedia(
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
          getUserMediaError
        );
      } else {
        // Video is already started, but may be paused with video.pause()
        // so it forces to play
        video.play();
      }
    } else {
      getUserMediaError();
    }
  }

  function exportPhoto(callback){
    return imgur(output.canvas, callback);
  }

  function imgur(canvas, callback){
      var base64img = canvas.toDataURL('image/' + filetype).split(',')[1];
      $.ajax({
          url: 'https://api.imgur.com/3/upload.json',
          type: 'POST',
          headers: {
            Authorization: 'Client-ID 78efd24716370d8'
          },
          data: {
              type: 'base64',
              // get your key http://imgur.com/register/api_anon
              key: '8c78586d699eb1ee78db85b146053996eccf1eff',
              name: 'le_photo.' + filetype,
              title: 'le_photo.' + filetype,
              caption: 'Created with FotosPaLaBanda by @davoclavo',
              image: base64img
          },
          dataType: 'json'
      }).success(function(response) {
          callback(response);
      }).error(function() {
          alert('Could not reach api.imgur.com. Sorry :(');
      });
  }
//});


  // Convert dataURI to Blob so large images do not crash the browser
  // Based on: http://stackoverflow.com/questions/10412299
  //           http://stackoverflow.com/questions/6850276
  function dataURItoBlob(dataURI) {
      // convert base64 to raw binary data held in a string
      var byteString = atob(dataURI.split(',')[1]);

      // separate out the mime component
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // write the bytes of the string to an ArrayBuffer
      var arrayBuffer = new ArrayBuffer(byteString.length);
      var _ia = new Uint8Array(arrayBuffer);
      for (var i = 0; i < byteString.length; i++) {
          _ia[i] = byteString.charCodeAt(i);
      }

      var dataView = new DataView(arrayBuffer);
      var blob = new Blob([dataView], { type: mimeString });
      return blob;
  }
