var photoFormats = {
  inputs: {
    'infantil': {
      w: 25,
      h: 30
    },
    'pasaporte': {
      w: 35,
      h: 45
    },
    'credencial': {
      w: 35,
      h: 50
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

populateSelect('input-format', _.keys(photoFormats.inputs));
populateSelect('output-format',_.keys(photoFormats.outputs));

function populateSelect(id, array) {
  var list = '<% _.each(options, function(item){ %> <option val="<%= item %>"><%= item %></option>  <% }); %> ';
  var listHTML = _.template(list, {options: array});
  $('#'+id).append(listHTML);
}

