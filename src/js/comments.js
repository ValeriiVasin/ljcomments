/*global ApiTransport*/
/**
 * Comments factory
 */
;(function () {
  'use strict';

  var IS_DEBUG_MODE = false;

  var rpc = ApiTransport.rpc;

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
    page = page || 1;

    var defer = $.Deferred();

    if ( _pages[page] ) {
      defer.resolve({
        replycount: 0,
        threads: getThreadsForPage(page)
      });

      return defer.promise();
    }

    fetch({
      page: page
    }).then(function (response) {
      savePage(response.comments, page);

      defer.resolve({
        replies: response.replycount,
        threads: getThreadsForPage(page)
      });
    }, defer.reject);

    return defer.promise();
  }

  function fetch(_params) {
    console.time('fetch');

    _params = $.extend({
      itemid: params.itemid,
      journal: params.journal
    }, _params);

    return rpc('get_thread', _params).then(function (response) {
      console.timeEnd('fetch');
      parse( response.comments );
      return response;
    });
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

  function getThreadsForPage(page) {
    return _pages[page];
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
  function getChildren(dtalkid) {
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
   * Get parent comments ids
   * @param  {Number} dtalkid Talk id
   * @return {Array}          Array of parents ids
   */
  function _getParents(dtalkid) {
    var result = [];

    while (dtalkid = parents[dtalkid]) {
      result.push(dtalkid);
    }

    return result;
  }

  function getComment(dtalkid) {
    return _comments[dtalkid];
  }

  var _threads = {};

  /**
   * Invalidate thread cache
   * Notice: all parents/childen threads should be invalidated as well
   * @param  {Number} key Talk id
   */
  function _invalidateThread(key) {
    delete _threads[key];

    _getParents(key).forEach(function (key) {
      delete _threads[key];
    });

    getChildren(key).forEach(function (key) {
      delete _threads[key];
    });
  }

  /**
   * Get thread comments ordered for view
   * @param  {Number} dtalkid Talk id
   * @return {Array}         Array of comments that are in thread
   */
  function getThread(dtalkid) {
    if ( _threads[dtalkid] ) {
      return _threads[dtalkid];
    }

    var result = [dtalkid];

    getChildren(dtalkid).forEach(function (child) {
      Array.prototype.push.apply(
        result, getThread(child)
      );
    });

    // cache whole thread
    _threads[dtalkid] = result;

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

    console.log('Tree length: %d', tree.length);
    console.timeEnd('tree');

    return tree;
  }

  /**
   * Comment index between same level childrens
   * @param  {Number} key Dtalkid
   * @return {Number}     Index
   */
  function getIndex(key) {
    var parent = parents[key];

    return getChildren(parent).indexOf(key);
  }

  /**
   * Expand comment MORE type
   * @param  {Object} comment Comment object
   * @return {Promise}        Promise that will be resolved when comment fetched
   */
  function _expandMore(comment) {
    var key    = __key(comment);
    var index  = getIndex(key);
    var parent = parents[key];

    // request params
    var _params = {
      thread:     parent,
      expand_all: 1,
      journal:    params.journal,
      itemid:     params.itemid,
      skip:       index + 1
    };

    return fetch(_params).then(function () {
      LJ.Event.trigger('thread:update', parent);
    });
  }

  /**
   * Expand provided comment
   * @param  {Object} comment Comment
   * @return {Promise}        Promise that will be resolved when comment fetched
   */
  function expand(comment) {
    if ( comment.more ) {
      return _expandMore(comment);
    }

    var key = __key(comment);

    // request params
    var _params = {
      thread: key,
      expand_all: 1
    };

    var thread = getThread( key );

    // Check if we need to load the thread from server or we have already loaded
    // it (or it's parent)
    var isAllLoaded = thread.every(function (key) {
      return _comments[key].loaded;
    });

    if ( isAllLoaded ) {

      // return resolved promise
      console.info('All comments has been expanded before. Performing expansion without server request.');

      // keep model up-to-date
      thread.forEach(function (key) {
        _comments[key].collapsed = 0;
      });

      LJ.Event.trigger('thread:update', key);
      return $.Deferred().resolve().promise();
    }

    // if there is a MORE comment in the thread we are going to expand -
    // invalidate threads cache
    var hasMoreComment = thread.some(function (key){
      return _comments[key].more;
    });

    if ( hasMoreComment ) {
      _invalidateThread( key );
    }

    return fetch(_params).then(function () {
      LJ.Event.trigger('thread:update', key);
    });
  }

  /**
   * Collapse thread comment is the root of
   * @param  {Object} comment Comment
   */
  function collapse(comment) {
    var key = __key(comment);

    // keep model up-to-date
    getThread(key).forEach(function (key) {
      _comments[key].collapsed = 1;
    });

    LJ.Event.trigger('thread:update', key);
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
    obj.loaded = comment.loaded || false;

    return JSON.stringify(obj);
  }

  /**
   * Screen/unscreen comment
   * @param  {Number} dtalkid Comment dtalkid
   * @param  {Boolean} state  State of screening: true - screen, false - unscreen
   * @return {Promise}        Promise that will be resolved when action completed
   */
  function screen(dtalkid, state) {
    return rpc('talkscreen', {
      mode: state ? 'screen' : 'unscreen',
      talkid: dtalkid,
      journal: params.journal,
      format: 'json',

      // crazy param that is needed to confirm auth
      confirm: 'Y'
    }, 'POST').then(function () {
      // because of current architecture - we should fetch single comment for update
      // Note: we could not update controls array at the moment
      return fetch({
        // fetch single comment
        flat: 1,
        thread: dtalkid
      }).then(function () {
        LJ.Event.trigger('comment:update', dtalkid);
      });
    });
  }

  /**
   * Freeze/unfreeze the comment
   * @param  {Number} dtalkid Dtalkid of the comments
   * @param  {Boolean} state  State of freezing
   * @return {Promise}        Promise that will be resolved when action comleted
   */
  function freeze(dtalkid, state) {
    return rpc('talkscreen', {
      mode: state ? 'freeze' : 'unfreeze',
      talkid: dtalkid,
      journal: params.journal,
      format: 'json',

      // crazy param that is needed to confirm auth
      confirm: 'Y'
    }, 'POST').then(function () {
      // because of current architecture - we should fetch whole thread for update
      var expanded = getThread(dtalkid).filter(function (key) {
        var comment = getComment(key);

        // MORE comments do not have collapsed prop
        return comment.hasOwnProperty('collapsed') && !comment.collapsed;
      });

      return fetch({
        // fetch single comment
        thread: dtalkid,
        expand_all: 1
      }).then(function () {
        // mark all comments as collapsed, besides previously expanded
        _invalidateThread(dtalkid);

        getThread(dtalkid).forEach(function (key) {
          updateComment(key, { collapsed: expanded.indexOf(key) === -1 ? 1 : 0 });
          console.log(getComment(key).collapsed);
        });

        LJ.Event.trigger('thread:update', dtalkid);
      });
    });
  }

  function updateComment(dtalkid, props) {
    _comments[dtalkid] = $.extend(_comments[dtalkid] || {}, props);
  }

  window.Comments = {
    key: __key,

    parse: parse,

    getComment: getComment,
    getThread:  getThread,
    getTree:    getTree,
    getChildren: getChildren,

    getThreadsForPage: getThreadsForPage,

    setUrl:    setUrl,
    fetchPage: fetchPage,

    expand: expand,
    collapse: collapse,

    // controls actions
    screen: screen,
    freeze: freeze,

    debugInfo: debugInfo
  };
}());
