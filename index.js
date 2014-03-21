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

var request;
var log = console.log.bind(console, '[xkcd]');

module.exports = function(corsica) {
  request = corsica.request;

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
    log('on xkcd', content);
    var comic = content.comic || content._args[0];
    makeComicContent(comic)
      .then(function(comicContent) {
        var c = corsica.utils.merge(content, comicContent);
        corsica.sendMessage('content', c);
      }, function(err) {
        console.warn('[xkcd]', err);
      });
    return content;
  });
};

function makeComicContent(comicNum) {
  log('makeComicContent', 'comicNum =', comicNum);
  return new Promise(function (resolve, reject) {
    var url;

    if (!comicNum) {
      url = 'http://xkcd.com/info.0.json';
    } else {
      url = 'http://xkcd.com/' + comicNum + '/info.0.json';
    }

    request({url: url, json: true}, function(err, res, data) {
      if (err || res.statusCode >= 400) {
        reject(err || {statusCode: res.statusCode});
      } else {
        resolve(makeXkcdPage(data));
      }
    });
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
