/* Description:
 *   Transforms links to XKCD to a 10-foot friendly format.
 *
 * Dependencies:
 *   none
 *
 * Configuration:
 *   none
 *
 * Author:
 *    mythmon
 *
 * Compatible with the command plugin
 *   "xkcd comic=123" or "xkcd 123"
 */

var format = require('util').format;

var Promise = require('es6-promise').Promise;

var log = console.log.bind(console, '[xkcd]');
var corsica;

module.exports = function(corsica_) {
  corsica = corsica_;

  corsica.on('content', function(content) {
    var match = /xkcd.com\/?(\d+)?/.exec(content.url);
    if (content.type === 'url' && match) {
      return makeComicContent(match[1])
        .then(function(comicContent) {
          return corsica.utils.merge(content, comicContent);
        }, function (err) {
          log('Could not get info for comic at', content.url);
          return content;
        });
    } else {
      return content;
    }
  });

  // command-compatible short code.
  corsica.on('xkcd', function(content) {
    var comic = content.comic || content._args[0];
    makeComicContent(comic)
      .then(function(comicContent) {
        var c = corsica.utils.merge(content, comicContent);
        corsica.sendMessage('content', c);
      }, function(err) {
        log('[xkcd]', err);
      });
    return content;
  });
};

function makeComicContent(comicNum) {
  return new Promise(function (resolve, reject) {
    if (!comicNum) {
      comicNum = 'latest';
    }

    if (comicNum === 'random') {
      corsica.http('http://xkcd.com/info.0.json')
        .then(function(data) {
          var latestNum = data.num;
          var randomNum = Math.floor(Math.random() * latestNum) + 1;
          resolve('http://xkcd.com/' + randomNum + '/info.0.json');
        });
    } else if (comicNum === 'latest') {
      resolve('http://xkcd.com/info.0.json');
    } else {
      resolve('http://xkcd.com/' + comicNum + '/info.0.json');
    }
  }).then(function(comicUrl) {
    return corsica.http(comicUrl);
  })
  .then(makeXkcdPage)
  .catch(function(err) {
    console.error('[xkcd]', 'Error:', err.stack || err);
  });
}

var pageTemplate = '<body style="margin:0;height:100%;background:url(%s) ' +
                   'no-repeat center #000;background-size:contain;"></body>';

function makeXkcdPage(data) {
  var html = format(pageTemplate, data.img);
  var res = {
    type: 'html',
    content: html,
  };
  return res;
}
