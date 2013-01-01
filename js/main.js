populateSelect('input-format', _.keys(photoFormats.inputs));
populateSelect('output-format',_.keys(photoFormats.outputs));

function populateSelect(id, array) {
  var list = '<% _.each(options, function(item){ %> <option val="<%= item %>"><%= item %></option>  <% }); %> ';
  var listHTML = _.template(list, {options: array});
  $('#'+id).append(listHTML);
}

setInputFormat(photoFormats.inputs[$('#input-format').val()]);
setOutputFormat(photoFormats.outputs[$('#output-format').val()]);

initializeCanvas();


$('#start-camera').on('click', startVideo);


$('#capture-camera, #video-canvas').on('click', function (e) {
    if (localMediaStream) {
        snapshot();
        return;
    }
});
