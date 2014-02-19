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
 */

var request = require('request');
var format = require('util').format;

var Promise = require('es6-promise').Promise;


module.exports = function(corsica) {

  corsica.on('content', function(content) {
    var match = /xkcd.com\/(\d+)?/.exec(content.url);
    if (content.type === 'url' && /xkcd.com/.exec(content.url)) {
      return new Promise(function(resolve, reject) {
        var jsonUrl = content.url;
        if (jsonUrl.charAt(jsonUrl.length - 1) !== '/') {
          jsonUrl += '/';
        }
        jsonUrl += '/info.0.json';

        var opts = {
          url: jsonUrl,
          json: true,
        };

        request(opts, function (err, res, data) {
          if (err || res.statusCode >= 400) {
            console.warn('[xkcd]', 'Could not get info for comic at', jsonUrl);
            resolve(content);
          } else {
            resolve(makeXkcdPage(content, data));
          }
        });
      })
      .catch(function(err) {
        console.error('error', err);
        throw err;
      });
    } else {
      return content;
    }
  });
};

var pageTemplate = '<body style="margin:0;height:100%;background:url(%s) ' +
                   'no-repeat center #000;background-size:contain;"></body>';

function makeXkcdPage(content, data) {
  var html = format(pageTemplate, data.img);
  var res = {
    screen: content.screen,
    type: 'html',
    content: html,
  };
  console.log('res:', res);
  return res;
}
