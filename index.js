'use strict';

var gutil = require('gulp-util');
var through = require('through2');

module.exports = function(inDevelopmentMode) {
  return through.obj(function (file, enc, cb) {
    //pass through
    if(file.isNull()) {
      this.push(file);
      return cb();
    }

    //streams not supported
    if(file.isStream()) {
      this.emit('error', new gutil.PluginError('gulp-dev', 'streaming not supported'));
      return cb();
    }

    var fileContents = file.contents.toString('utf-8');
    file.contents = processFileContents(fileContents, inDevelopmentMode);

    this.push(file);
    return cb();
  });
};

function processFileContents(fileContents, inDevelopmentMode) {
  var data = fileContents;

  data = processFileContentsForBlock(
    data,
    '<!-- dev -->',
    '<!-- /dev -->',
    !inDevelopmentMode);

  data = processFileContentsForBlock(
    data,
    '<!-- !dev -->',
    '<!-- /!dev -->',
    inDevelopmentMode);

  return new Buffer(data, 'utf-8');
}

function processFileContentsForBlock(
  fileContents,
  startBlockComment,
  endBlockComment,
  shouldBeCommented) {
  var i;

  var stripHtmlCommentRegex = /<!--(.*)-->/;
  var spacesRegex = /[\t\s]/;

  var inBlock = false;
  var lines = fileContents.split('\n');

  for(i = 0; i < lines.length; i++) {
    var line = lines[i];

    if (line.indexOf(startBlockComment) > -1) {
      inBlock = true;
    }

    else if (line.indexOf(endBlockComment) > -1) {
      inBlock = false;
    }

    else if(inBlock) {
      var match = line.match(stripHtmlCommentRegex);

      if(!shouldBeCommented) {
        if(match) {
          lines[i] = line.replace(match[0], match[1]);
        }
      } else if(!match) {
          lines[i] = (line.match(spacesRegex) + '<!-- {0} -->').replace('{0}', line.trim());
      }
    }
  }

  return lines.join('\n');
}
