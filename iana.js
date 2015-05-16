var http = require('http');
var IANAUrl =
  'http://www.iana.org/assignments/language-subtag-registry/language-subtag-registry';
http.get(IANAUrl, function(res) {
  res.setEncoding('utf8');
  var data = '';
  var result = '';
  res.on('data', function(d) {
    data += d;
  });
  res.on('end', function() {
    result = processIANARegistry(data);
    console.log(result);
  });

}).on('error', function(e) {
  throw new Error("Network Error: " + e.message);
});

function processIANARegistry(data) {
  //Replace line breaks for long comments and descriptions
  data = data.replace(/\n\s\s/mg, ' ');
  var entries = data.split(/%%\n/).splice(1);
  var jsonEntries = [];
  for (var entry of entries) {
    //split on "label" or "label-label", ": ", + remaining value
    //Filter white space entries
    var fields = entry.split(/(^\w+|\w+\-\w+):\s+(.+)/gim)
      .filter(function(item) {
        return !!item.trim()
      });
    var obj = {};
    while (fields.length) {
      var nameValue = fields.splice(0, 2);
      var name = nameValue[0];
      var value = nameValue[1];
      switch (name) {
        case 'Description':
          name = 'Descriptions';
          appendValueList(obj, name, value);
          break;
        case 'Prefix':
          name = 'Prefixes';
          appendValueList(obj, name, value);
          break;
        default:
          if (obj[name]) {
            var msg = 'Fatal Error! Unexpected duplicate name (' + name +
              ') ';
            msg += 'in IANA registry. See error console for more context.';
            console.warn('Error processing entry. Duplicate value. Entry:',
              entry, 'name: ' + name);
            throw new Error(msg);
          }
          obj[name] = value;
          break;
      }
    }
    jsonEntries.push(obj);
  }
  return JSON.stringify(jsonEntries, 2, 2);

  // Appends values to lists of known duplicates (i.e., description, prefix)
  function appendValueList(obj, name, value) {
    if (!obj.hasOwnProperty(name)) {
      obj[name] = [];
    }
    obj[name].push(value)
  }
}
