populateSelect('input-format',  photoFormats.inputs);
populateSelect('output-format', photoFormats.outputs);

function populateSelect(id, objects) {
  var list = '<% _.each(keys, function(key){ %> <option value="<%= key %>"><%= key +" - "+ objects[key].w/10 + "x" + objects[key].h/10 + "cm" %></option>  <% }); %> ';
  var listHTML = _.template(list, {keys: _.keys(objects), objects: objects});
  $('#'+id).append(listHTML);
}

setInputFormat(photoFormats.inputs[$('#input-format').val()]);
setOutputFormat(photoFormats.outputs[$('#output-format').val()]);

initializeCanvas();

$('.btn').tooltip();

$('#start-camera').on('click', startVideo);

$('#capture-camera, #video-canvas').on('click', function (e) {
    if (localMediaStream) {
        snapshot();
        return;
    }
});

$('#export-btn').on('click', function (e){
  exportPhoto(function(response){
    alert('Image exported to: ' + response.data.link);
  });
});

$('#download-btn').on('click', function (e){
  _downloadLink.click();
});
