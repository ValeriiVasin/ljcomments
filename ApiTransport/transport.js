;(function ($) {
  'use strict';

  // api response timeout
  var TIMEOUT = 10000;
  var INIT_TIMEOUT = 30000;

  var initDefer = $.Deferred(),
      initPromise = initDefer.promise(),
      isInitialized = false;

  console.time('ApiTransport initialization');
  setTimeout(function () {
    var error = new Error('ApiTransport was not initialized. Check that you installed and enabled userscript.');

    if ( !isInitialized ) {
      initDefer.reject(error);
      throw error;
    }
  }, INIT_TIMEOUT);

  /**
   * Define a namespace.
   *
   * @param {String} path         The String with namespace to be created.
   * @param {Object} [top=window] An optional object. If set then the namespace will be built relative to it.
   *                              Defaults to the window.
   */
  function define(path, top) {
    var ns = path.split('.'),
        name;

    if ( typeof top === 'undefined' ) {
      top = window;
    }

    while ( name = ns.shift() ) {
      top[name] = top[name] || {};
      top = top[name];
    }
  }

  $(window).on('message', function (event) {
    event = event.originalEvent;

    if ( event.origin !== 'http://www.livejournal.com' ) {
      console.error('[Transport] Origin mismatched...', event.origin);
      return;
    }

    var data = event.data;

    if (data.type === 'init') {

      // initialization finished
      console.info('[Transport] Initialization finished');
      console.timeEnd('ApiTransport initialization');
      isInitialized = true;
      initDefer.resolve();
      return;
    }

    if ( typeof data.id !== 'undefined' ) {
      if ( data.message.error ) {
        defers[data.id].reject(data.message.error);
      } else {
        defers[data.id].resolve( data.message );
      }

      // cleanup
      delete defers[data.id];
    }

  });

  var iframe;
  $(function () {
    iframe = $('<iframe />', {
      src: 'http://www.livejournal.com/about/?origin=' + location.origin,
      css: {
        display: 'none'
      }
    }).appendTo('body').get(0);
  });

  function api(method, params, callback) {
    return initPromise.then(function () {
      return sendMessage({
        type: 'api',
        message: {
          method: method,
          params: params
        }
      }).then(function (response) {
        if ( typeof callback === 'function' ) {
          callback(response);
        }

        return response;
      });
    });
  }

  function rpc(method, params, type) {
    return initPromise.then(function () {
      return sendMessage({
        type: 'rpc',
        requestType: type || 'GET',
        message: {
          method: method,
          params: params
        }
      });
    });
  }

  var requestId = 0;
  var defers = {};
  /**
   * Send message to livejournal
   * @param  {Object}  msg         Message object
   * @param  {String}  msg.type    Type of request
   * @params {*}       msg.message Everything that will be stringified and send
   *                               to livejournal.com
   * @return {Promise}     Promise that will be resolved when request received
   */
  function sendMessage(msg) {
    var defer = $.Deferred();
    var id = requestId;

    msg.id = id;
    iframe.contentWindow.postMessage(msg, 'http://www.livejournal.com');

    defers[id] = defer;

    // cleanup by timeout
    setTimeout(function () {
      if ( defers[id] ) {
        defers[id].reject({ message: 'Timeout error' });
        delete defers[id];
      }
    }, TIMEOUT);

    requestId += 1;
    return defer.promise();
  }

  var _original;
  /**
   * Patch LJ.Api.call
   */
  function patch() {
    define('LJ.Api');

    _original = LJ.Api.call;
    LJ.Api.call = api;
  }

  function patchBack() {
    LJ.Api.call = _original;
    _original = null;
  }

  window.ApiTransport = {
    patch: patch,
    patchBack: patchBack,

    api: api,
    rpc: rpc
  };
}(jQuery));
