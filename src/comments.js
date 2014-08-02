/**
 * Comments factory
 */
;(function () {
  'use strict';

  var IS_DEBUG_MODE = false;


  // parents cache
  var parents = {};

  // comments cache
  var _comments = {};

  // pages top comments cache
  var _pages = {};

  function __key(comment) {
    if ( comment.dtalkid ) {
      return comment.dtalkid;
    }

    // for MORE comment
    return Number( comment.data.split(':')[0] );
  }

  var params;
  function setUrl(url) {
    var regexp = /^http:\/\/([^\.]+)\.livejournal\.com\/(\d+)\.html/;
    var pageRegexp = /page=(\d+)/;

    params = {};

    var matchUrl = url.match(regexp);
    var matchPage = url.match(pageRegexp);

    if ( matchUrl ) {
      params.journal = matchUrl[1];
      params.itemid = Number( matchUrl[2] );
    }

    if ( matchPage ) {
      params.page = Number( matchPage[1] );
    }
  }

  function fetchPage(page) {
    var defer = $.Deferred();

    fetch({
      itemid: params.itemid,
      journal: params.journal,
      page: page || 1
    }).then(function (response) {
      savePage(response.comments, page);

      defer.resolve({
        replies: response.replycount,
        comments: getTree(page)
      });
    }, defer.reject);

    return defer.promise();
  }

  function fetch(params) {
    var endpoint = 'http://' + params.journal + '.livejournal.com/' +
                    params.journal + '/__rpc_get_thread';

    var query = '';
    $.each(params, function (key, value) {
      if (query.length === 0) {
        query = '?';
      } else {
        query += '&';
      }

      query += key + '=' + value;
    });

    var url = 'http://jsonp.jit.su/?url=' + encodeURIComponent(endpoint + query) + '&callback=?';

    var defer = $.Deferred();
    console.log('fetch url:', url);
    console.time('fetch');
    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function (response) {
        console.timeEnd('fetch');

        if ( response.error ) {
          console.error('date error', response);
          return;
        }

        // parse levels and add margins
        parse( response.comments );

        defer.resolve(response);
      },
      error: defer.reject
    });

    return defer.promise();
  }

  /**
   * Cache top level comment ids
   * @param  {Array} comments  Page comments
   * @param  {Number} page     Page number
   */
  function savePage(comments, page) {
    _pages[page] = comments.filter(function (comment) {
      return comment.level === 1;
    }).map(function (comment) {
      return __key(comment);
    });
  }

  function parse(comments) {
    // save parents
    comments.forEach(function (comment) {
      var parent = comment.parent;
      var key = __key(comment);

      // save comment
      _comments[ key ] = comment;

      if ( parent ) {
        // MORE comments do not have dtalkid, but have data field
        // data field contains some dtalkid => dtalkid:dtalkid:dtalkid
        parents[ key ] = parent;
      }
    });

    // add margin
    console.time('add margin');
    comments.forEach(function (comment) {
      if ( comment.hasOwnProperty('margin') ) {
        return;
      }

      if ( !comment.hasOwnProperty('level') ) {
        comment.level = getLevel(comment.dtalkid);
      }

      comment.margin = (comment.level - 1) * 30;
    });
    console.timeEnd('add margin');
  }

  function getLevel(dtalkid) {
    var level = 1;

    while ( dtalkid = parents[dtalkid] ) {
      level += 1;
    }

    return level;
  }

  /**
   * Get child comments
   * @param  {Number} dtalkid Talk id
   * @return {Array}          Array of childs
   */
  function _getChilds(dtalkid) {
    var result = [];

    $.each(parents, function (key, value) {
      if ( value === dtalkid ) {
        result.push( Number(key) );
      }
    });

    return result.sort(function (a, b) {
      return a - b;
    });
  }

  /**
   * Get thread comments ordered for view
   * @param  {Number} dtalkid Talk id
   * @return {Array}         Array of comments that are in thread
   */
  function getThread(dtalkid) {
    var result = [dtalkid];
    var i = 0;

    while ( i < result.length ) {
      // push i-th element childs into array
      Array.prototype.splice.apply(
        result,
        [i + 1, 0].concat( _getChilds(result[i]) )
      );

      i += 1;
    }

    return result;
  }

  function getTree(page) {
    console.time('tree');
    var topLevel = [];

    if ( page && _pages[page] ) {
      topLevel = _pages[page];
    } else {

      // whole top level comments
      $.each(_comments, function (key, value) {
        if ( !value.parent ) {
          topLevel.push( __key(value) );
        }
      });
    }

    var tree = [];
    topLevel.forEach(function (key) {
      Array.prototype.push.apply(tree, getThread(key));
    });

    tree = tree.map(function (key) {
      return _comments[key];
    });

    console.log(tree.length);
    console.timeEnd('tree');

    return tree;
  }

  /**
   * Expand provided comment
   * @param  {Object} comment Comment
   * @return {Promise}        Promise that will be resolved when comment fetched
   *
   * @todo
   *   Do not perform fetch if it (or it's parent) has been expanded before
   *   Flag loaded: 1
   */
  function expand(comment) {
    // request params
    var _params = {
      thread: __key(comment),
      expand_all: 1,
      journal: params.journal,
      itemid: params.itemid
    };

    return fetch(_params).then(function () {
      LJ.Event.trigger('comments:update');
    });
  }

  /**
   * Collapse thread comment is the root of
   * @param  {Object} comment Comment
   */
  function collapse(comment) {
    var key = __key(comment);

    getThread(key).forEach(function (key) {
      _comments[key].collapsed = 1;
    });

    LJ.Event.trigger('comments:update');
  }

  function debugInfo(comment) {
    if ( !IS_DEBUG_MODE ) {
      return;
    }

    var obj = {};

    obj.key   = __key(comment);
    obj.above = comment.above || false;
    obj.below = comment.below || false;
    obj.level = comment.level || false;

    return JSON.stringify(obj);
  }

  window.Comments = {
    parse: parse,
    getThread: getThread,

    getTree: getTree,

    setUrl:    setUrl,
    fetchPage: fetchPage,

    expand: expand,
    collapse: collapse,

    debugInfo: debugInfo
  };
}());
