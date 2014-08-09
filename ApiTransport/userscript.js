// ==UserScript==
// @name       LJ Api Transport
// @namespace  http://use.i.E.your.homepage/
// @version    0.1
// @description  enter something useful
// @match      http://www.livejournal.com/*
// @copyright  2012+, You
// ==/UserScript==

;(function ($) {

  // Transport should be in iframe
  if (window.parent === window) {
    console.log('[userscript] Transport should work in iframe');
    return;
  }

  // iframe url should looks like
  // http://livejournal.com/?origin=localhost:8000
  var origin = LiveJournal.parseGetArgs().origin;

  console.log('[Userscript] Origin:', origin);

  $(window).on('message', function (event) {
    event = event.originalEvent;

    if (event.origin !== origin) {
      console.warn('[Userscript] Origin mismatched...', event.origin);
      return;
    }

    var data = event.data;
    var request;

    if (data.type === 'api') {
      request = data.message;
      console.log('[Userscript] Api request received...', request);

      LJ.Api.call(request.method, request.params, function (response) {
        console.log('[Userscript] Api request processed... ', response);

        sendMessage({
          type: 'api',
          id: data.id,
          message: response
        });
      });
    }

    if (data.type === 'rpc') {
      request = data.message;
      console.log('[Userscript] Rpc request received', request);

      $.ajax({
        url: LiveJournal.getAjaxUrl(request.method),
        data: request.params,
        dataType: 'json'
      }).then(function (response) {
        console.log('[Userscript] Rpc request processed... ', response);

        sendMessage({
          type: 'rpc',
          id: data.id,
          message: response
        });
      });
    }
  });

  function sendMessage(message) {
    window.parent.postMessage(message, origin);
  }

  sendMessage({ type: 'init' });
}(jQuery));
