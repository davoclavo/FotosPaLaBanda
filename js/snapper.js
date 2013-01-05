var Snapper = (function() {

  // Legacy stuff
  navigator.getUserMedia = navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia;

  window.URL = window.URL ||
               window.webkitURL;

  // Private variables
  var events = {};

  var self = null;

  // Constructor
  var Snapper = function Snapper(settings) {
    self = this;

    settings = settings || {};
    this.video         = settings.video         || document.createElement('video');
    this.stream        = null;

    this.inputCanvas   = settings.inputCanvas   || document.createElement('canvas');
    this.overlayCanvas = settings.overlayCanvas || document.createElement('canvas');
    this.outputCanvas  = settings.outputCanvas  || document.createElement('canvas');

    this.downloadLink  = settings.downloadLink  || document.createElement('a');

    this.inputImg      = settings.inputImg      || document.createElement('img');
    this.outputImg     = settings.outputImg     || document.createElement('img');

    this.settings = {
      inputWidth:   170,
      inputHeight:  0,
      offsetX:      0,
      offsetY:      0,
      inputFormat:  {w:25,h:25},
      outputFormat: {w:100,h:100},
      filetype:     'jpeg', //'jpeg', 'png', 'webp'
      imgur: {
        clientID: '78efd24716370d8',
        key: '8c78586d699eb1ee78db85b146053996eccf1eff'
      },
      fps: 30
    };

    // Extend settings
    for(var s in settings) {
      this.settings[s] = settings[s];
    }
    this.init();
    return this;
  };

  Snapper.prototype.on = function(evnt, handler) {
    if (!events.hasOwnProperty(evnt)) {
      events[evnt] = [];
    }
    events[evnt].push(handler);
  };

  Snapper.prototype.off = function(evnt, handler) {
    events = events[evnt].filter(function(h) {
      if (h !== handler) {
        return h;
      }
    });
  };

  Snapper.prototype.trigger = function(evnt, args) {
    console.info('Event triggered: ' + evnt);
    if (events.hasOwnProperty(evnt)) {
      for (var i = 0, l = events[evnt].length; i < l; ++i) {
        try {
          events[evnt][i].call(null, args);
        } catch (error) {
          self.trigger('error');
          if (console && console.error) {
              console.error(error);
          }
        }
      }
    }
  };

  Snapper.prototype.init = function() {
    // Autoplay to avoid just showing the first frame, as the controls are hidden
    self.video.setAttribute('autoplay','');

    self.input = self.inputCanvas.getContext('2d');
    self.overlay = self.overlayCanvas.getContext('2d');
    self.output = self.outputCanvas.getContext('2d');
    self.settings.aspectratio = self.settings.inputFormat.w/self.settings.inputFormat.h;
    console.log(this);

  };

  Snapper.prototype.start = function start() {
    console.log(this);

    if(navigator.getUserMedia){
      if(!self.stream || self.stream.readyState == 2){
        navigator.getUserMedia(
          {video: true},
          getUserMediaSuccess,
          getUserMediaError
        );
      } else {
        // Video is already started, but may be paused with video.pause()
        // so it forces to play
        self.video.play();
      }
    } else {
      getUserMediaError();
    }
  };

  Snapper.prototype.snap = function() {
    if (self.stream) {
      var dataURI = self.input.canvas.toDataURL('image/' + self.settings.filetype);
      self.inputImg.src = dataURI;
      self.trigger('snap', dataURI);
      // on.('snapshot', mergeSnapshots)
    }
  };

  Snapper.prototype.overlay = function(settings) {
    // TODO:
    // Extend overlay settings
    // Minimal API to draw lines

    overlay.globalAlpha = 0.8;
    overlay.beginPath();
    overlay.moveTo(inputWidth/2,0);
    overlay.lineTo(inputWidth/2,inputHeight);
    overlay.moveTo(0,newHeight/2);
    overlay.lineTo(inputWidth,inputHeight/2);
    overlay.strokeStyle = '#00FF00';
    overlay.stroke();
  };

  Snapper.prototype.share = function(filename) {
    self.imgur(self.output.canvas, filename);
  };

  Snapper.prototype.imgur = function(canvas, name, caption) {
    var base64img = canvas.toDataURL('image/' + self.settings.filetype).split(',')[1];
    $.ajax({
        url: 'https://api.imgur.com/3/upload.json',
        type: 'POST',
        headers: {
          Authorization: 'Client-ID '+ self.settings.imgur.clientID
        },
        data: {
            type: 'base64',
            key: self.settings.imgur.key,
            name:  (name || 'fotopalabanda') + '.' + self.settings.filetype,
            title: (name || 'fotopalabanda') + '.' + self.settings.filetype,
            caption: caption || 'Created with FotosPaLaBanda by @davoclavo',
            image: base64img
        },
        dataType: 'json'
    }).success(function(response) {
      self.trigger('share', response);
    }).error(function() {
        alert('Could not reach api.imgur.com. Sorry :(');
    });
  };

  Snapper.prototype.download = function(filename) {
    self.downloadLink.href = self.outputImg.src;
    self.downloadLink.download = 'le_photo.' + self.settings.filetype;
    self.downloadLink.click();
  };

  // Convert dataURI to Blob so large images do not crash the browser
  // Based on: http://stackoverflow.com/questions/10412299
  //           http://stackoverflow.com/questions/6850276
  dataURItoBlob = function(dataURI) {
    // convert base64 to raw binary data held in a string
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var arrayBuffer = new ArrayBuffer(byteString.length);
    var _ia = new Uint8Array(arrayBuffer);
    for (var i = 0, l = byteString.length; i < l; i++) {
        _ia[i] = byteString.charCodeAt(i);
    }

    var dataView = new DataView(arrayBuffer);
    var blob = new Blob([dataView], { type: mimeString });
    return blob;
  };

  Snapper.prototype.setFormat = function(type, format) {
    if(typeof format.w === 'number' && typeof format.h === 'number'){
      if(type === 'input'){
        self.settings.inputFormat = format;
        self.settings.aspectratio = format.w/format.h;
      } else if(type === 'output'){
        self.settings.outputFormat = format;
      } else {
        self.trigger('error', 'You must specify type of format [input|output]');
      }
    } else {
      self.trigger('error', 'Format must have w: [int], h:[int] properties');
    }
  };


  // --------***********************--------
  // --------** Private functions **--------
  // --------***********************--------


   function getUserMediaSuccess(stream){
    // self.video.src = stream;
    if(navigator.mozGetUserMedia){
      // Firefox
      self.video.mozSrcObject = stream;
      self.video.play();
    } else {
      // Chrome

      self.video.src = window.URL.createObjectURL(stream);
    }
    self.stream = stream;

    resizeCanvas();
    self.trigger('start');
  }

  // Error handler for getUserMedia
  function getUserMediaError(error) {
    if (error.code == 1) {
      self.trigger('error', 'User denied access to their camera');
    } else {
      self.trigger('error', error);
    }
  }

  // Resize canvas to fit the largest possible rectangle, with
  // inputFormat aspect ratio, inside the video
  function resizeCanvas() {
    if(self.video.videoWidth > 0 && self.video.videoHeight > 0) {
      if (self.video.videoHeight < self.video.videoWidth) {
        // Horizontal
        self.offsetX = (self.video.videoWidth - (self.video.videoHeight*self.settings.aspectratio)) / 2;
        self.offsetY = 0;
      } else {
        // Vertical
        self.offsetX = 0;
        self.offsetY = (self.video.videoHeight - (self.video.videoWidth*self.settings.aspectratio)) / 2;
      }

      self.outputWidth = self.video.videoHeight*self.settings.aspectratio;
      self.outputHeight = self.video.videoHeight;

      self.input.canvas.width = self.outputWidth;
      self.input.canvas.height = self.outputHeight;
      self.overlay.canvas.width = self.outputWidth;
      self.overlay.canvas.height = self.outputHeight;

      $('#start-camera').hide();
      $('#capture-camera').show();
      styleCanvas(); // Placed here for old browsers?
      renderVideoInCanvas();
      self.trigger('ready', null);
    } else {
      // Call until video has been loaded
      // Fix with an event, maybe `self.video.addEventListener('canplay',callback)`
      setTimeout(function () {
        resizeCanvas();
      }, 100);
    }
  }
  
  function styleCanvas() {
    // Display style
    self.settings.styleHeigth = self.settings.inputWidth/self.settings.aspectratio;

    self.input.canvas.style.width    = self.settings.inputWidth  + 'px';
    self.input.canvas.style.height   = self.settings.styleHeigth + 'px';
    self.overlay.canvas.style.width  = self.settings.inputWidth  + 'px';
    self.overlay.canvas.style.height = self.settings.styleHeigth + 'px';
    // self.inputImg.style.width             = styleWidth  + 'px';
    // self.inputImg.style.height            = styleHeigth + 'px';
  }

  function renderVideoInCanvas() {
    // drawImage(video, x clipping, y clipping, w clipping, h clipping, x destination, y destination, w destination, h destination)
    self.input.drawImage(self.video, self.offsetX, self.offsetY, self.outputWidth, self.outputHeight, 0, 0, self.outputWidth, self.outputHeight);
    setTimeout(renderVideoInCanvas, 1000 / self.settings.fps);
  }

  Snapper.prototype.mergeSnapshots = function() {
    // TODO: Calculate which orientation is better [Horizontal|Vertical]
    // Amount of possible pictures, both x and y axis.
    var timesX = self.settings.outputFormat.w/self.settings.inputFormat.w;
    var timesY = self.settings.outputFormat.h/self.settings.inputFormat.h;

    // Reduce resolution factor
    // ** Check that reduction factor is more than 1
    var reduction = 1;
    var cw = self.input.canvas.width/reduction;
    var ch = self.input.canvas.height/reduction;

    self.output.canvas.width = timesX*cw;
    self.output.canvas.height = timesY*ch;

    for(var y=0; y+ch<self.output.canvas.height;y+=ch){
      for(var x=0; x+cw<self.output.canvas.width;x+=cw){
        self.output.drawImage(self.input.canvas, 0, 0, self.input.canvas.width, self.input.canvas.height, x, y, cw, ch);
      }
    }

    var dataURI = self.output.canvas.toDataURL('image/' + self.settings.filetype);

    // Set the output image source as dataURL
    // *Crashes the browser if the image is too big
    // self.outputImg.src = dataURI;
    // $(_downloadLink).attr('href', dataURI).attr('download','le_photo.' + self.settings.filetype);

    // Set the output image source as a blob
    var blob = dataURItoBlob(dataURI);
    var blobURL = window.URL.createObjectURL(blob);
    self.trigger('merge', blobURL);


    // $(_downloadLink).attr('href', blobURL).attr('download','le_photo.' + self.settings.filetype);
    // self.outputImg.src = blobURL;
    // self.outputImg.setAttribute('download','le_photo.' + self.settings.filetype);
  };

  return Snapper;
})();
