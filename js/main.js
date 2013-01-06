$(function() {
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

  snapper = new Snapper({
    inputCanvas: document.getElementById('video-canvas'),
    overlayCanvas: document.getElementById('video-canvas-overlay'),
    inputImg: document.getElementById('video-photo'),
    outputImg: document.getElementById('output-photo')
  });

  populateSelect('input-format',  photoFormats.inputs);
  populateSelect('output-format', photoFormats.outputs);

  function populateSelect(id, objects) {
    var list = '<% _.each(keys, function(key){ %> <option value="<%= key %>"><%= key +" - "+ objects[key].w/10 + "x" + objects[key].h/10 + "cm" %></option>  <% }); %> ';
    var listHTML = _.template(list, {keys: _.keys(objects), objects: objects});
    $('#'+id).append(listHTML);
  }

  snapper.setFormat('input', photoFormats.inputs[$('#input-format').val()]);
  snapper.setFormat('output', photoFormats.outputs[$('#output-format').val()]);

  snapper.on('ready', function(){
    $('#start-camera').hide();

    $('.allow').hide();
    $('#capture-camera').show();
  });

  snapper.on('merge', function(url){
    snapper.outputImg.src = url;
  });

  snapper.on('snap', function(){
    snapper.mergeSnapshots();
  });

  snapper.on('upload', function(response){
    $('#upload-btn').find('i').attr('class','icon-cloud-upload');
    console.log('Image successfully exported to imgur\n'+ response.data.link);
    alert('Image successfully exported to imgur\n'+ response.data.link);
  });

  snapper.on('error', function(message){
    console.error('Snapper error: ' + message);
  });
  
  $('.btn').tooltip();

  $('#start-camera').on('click', function(){
    snapper.start();
    
    var $allow = $('.allow');
    var left = window.location.origin.length*7+95;
    
    $allow.find('span').css('position','relative').css('left', left + 'px');
    $('.allow').show();
  });

  $('#capture-camera, #video-canvas, #video-canvas-overlay').on('click', function (e) {
      snapper.snap();
  });

  $('#upload-btn').on('click', function (evnt){
    $(this).find('i').attr('class','icon-spinner icon-spin');
    snapper.upload();
  });

  $('#download-btn').on('click', function (evnt){
    snapper.download();
  });


});
