/** @jsx React.DOM **/

var STAT_PREFIX = 'http://stat.livejournal.com';
var IS_REMOTE_SUP = true;
var cx = React.addons.classSet;

/**
 * <CommentList threads={threads} />
 */
var CommentList = React.createClass({displayName: 'CommentList',
  render: function() {
    var threads = this.props.threads.map(function (dtalkid) {
      return Thread({dtalkid: dtalkid, key: dtalkid});
    }, this);

    return (
      React.DOM.div({className: "b-tree b-tree-root"}, threads)
    );
  }
});

var CommentBox = React.createClass({displayName: 'CommentBox',
  getInitialState: function () {
    return {
      replies:  0,
      threads: [],
      page: 1,
      loading: true
    };
  },

  componentDidMount: function () {
    Comments.setUrl( this.props.url );

    this.loadCommentsFromServer();

    LJ.Event.on('comments:update', function () {
      if ( !this.isMounted() ) {
        return;
      }

      this.setState({
        threads: Comments.getThreadsForPage(this.state.page)
      });
    }, this);
  },

  loadCommentsFromServer: function(page) {
    var that = this;

    if ( typeof page === 'undefined' ) {
      page = 1;
    }

    this.setState({ loading: true });
    Comments.fetchPage(page).then(function (result) {
        if ( !that.isMounted() ) {
          return;
        }

        that.setState({
          loading: false,
          threads: result.threads,
          replies: result.replies
        });
    });
  },

  changePage: function (page) {
    this.setState({ page: page });
    this.loadCommentsFromServer(page);
  },

  render: function() {
    var comments = '';

    var classes = cx({
      'b-grove': true,
      'b-grove-loading': this.state.loading
    });

    return (
      React.DOM.div({id: "comments", className: classes}, 
        CommentPaginator({pages: 10, count: this.state.replies, change: this.changePage}), 
        CommentList({threads: this.state.threads})
      )
    );
  }
});

/**
 * <Thread dtalkid={dtalkid} />
 */
var Thread = React.createClass({displayName: 'Thread',
  getInitialState: function () {
    return {
      comment:  Comments.getComment(this.props.dtalkid),
      children: Comments.getChildren(this.props.dtalkid)
    };
  },

  updateThread: function (dtalkid) {
    if ( this.props.dtalkid !== dtalkid ) {
      return;
    }

    this.setState({
      comment:  Comments.getComment(this.props.dtalkid),
      children: Comments.getChildren(this.props.dtalkid)
    });

    // because children threads props did not change - we should trigger update for
    // each children thread as well
    this.state.children.forEach(function (dtalkid) {
      LJ.Event.trigger('thread:update', dtalkid);
    });
  },

  componentDidMount: function () {
    LJ.Event.on('thread:update', this.updateThread);
  },

  componentWillUnmount: function () {
    LJ.Event.off('thread:update', this.updateThread);
  },

  render: function () {
    var childrenThreads = this.state.children.map(function (dtalkid) {
      return Thread({dtalkid: dtalkid, key: dtalkid});
    });

    return (
      React.DOM.div({className: "b-tree-thread"}, 
        Twig({comment: this.state.comment}), 
        childrenThreads 
      )
    );
  }
});

/**
 * <Twig comment={comment} />
 */
var Twig = React.createClass({displayName: 'Twig',
  getInitialState: function () {
    return {
      comment: this.props.comment
    };
  },

  updateComment: function (commentIdsObj) {
    var key = Comments.key(this.state.comment);

    if ( commentIdsObj[ key ] ) {
      this.setState({
        comment: Comments.getComment(key)
      });
    }
  },

  componentDidMount: function () {
    LJ.Event.on('comment:update', this.updateComment);
  },

  componentWillUnmount: function () {
    LJ.Event.off('comment:update', this.updateComment);
  },

  componentWillReceiveProps: function (nextProps) {
    this.setState({
      comment: nextProps.comment
    });
  },

  render: function () {
    var comment = this.state.comment;
    var key = Comments.key(comment);

    var twigClass = {
      'b-tree-twig': true
    };
    twigClass['b-tree-twig-' + comment.level] = comment.level;

    // comment
    var commentHtml;
    if ( comment.html ) {
      commentHtml = comment.html;
    } else {
      if (comment.more) {
        commentHtml = CommentMore({comment: comment, key: key})
      } else if ( comment.deleted || !comment.shown ) {
        commentHtml = CommentClipped({comment: comment, key: key})
      } else {
        commentHtml = CommentNormal({comment: comment, key: key})
      }
    }

    return (
      React.DOM.div({
          className:  cx(twigClass), 
          style: {marginLeft: comment.margin}, 
          'data-tid': 't' + comment.dtalkid
          }, 
          commentHtml
      )
    );
  }
});

/**
 * Comment with more users
 * Statement: comment.more
 */
var CommentMore = React.createClass({displayName: 'CommentMore',
  render: function () {
    var comment = this.props.comment;

    var leafClass = {
      'b-leaf': true,
      'b-leaf-seemore': true
    };
    leafClass['b-leaf-seemore-' + comment.moreclass] = comment.moreclass;

    // actions
    if ( comment.actions ) {
      var actions = comment.actions.map(function (action) {
        var href = action.href ? action.href : '#';

        return (
          React.DOM.span({className: "b-leaf-seemore-more"}, 
            React.DOM.a({
              href: href, 
              rel: "nofollow", 
              className: "b-pseudo"
              }, action.title)
          )
        );
      });

      // expand action
      var href = comment.actions[0].href;
      href = href || '#';

      var expand = [
        React.DOM.span({className: "b-leaf-seemore-expand"}, 
          React.DOM.a({
            href: href, 
            rel: "nofollow", 
            className: "b-pseudo"
            }, "ml('talk.expandlink')")
        )
      ];
    }

    // ljusers block
    if (IS_REMOTE_SUP && comment.ljusers) {
      var users = comment.ljusers.map(function (user) {
        return (
          user.anonymous ?
            React.DOM.span(null, "ml('talk.anonuser')") :
            LJUser({user: user, key: user.journal})
        );
      });

      var moreusers = comment.moreusers ? '&hellip;' : '';

      var ljusers = [
        React.DOM.span({className: "b-leaf-seemore-from"}, "ml('talk.from')"),
        React.DOM.span({className: "b-leaf-seemore-users"}, 
          users, 
          moreusers
        )
      ];
    }

    return (
      React.DOM.div({
          className:  cx(leafClass), 
          'data-parent': comment.parent, 
          'data-dtalkids': comment.data, 
          'data-updated-ts': comment.touched, 
          'data-count': comment.more
          }, 
          React.DOM.div({className: "b-leaf-inner"}, 
            React.DOM.div({className: "comment-debug"},  Comments.debugInfo(comment) ), 
            actions, 
            ljusers, 
            expand
          )
     )
    );
  }
});

/**
 * <ClippedComment comment={comment} />
 * Statement: comment.deleted || !comment.shown
 */
var CommentClipped = React.createClass({displayName: 'CommentClipped',
  render: function () {
    var comment = this.props.comment;

    var controls = this.props.comment.controls ?
                   CommentControls({controls: this.props.comment.controls}) :
                   React.DOM.span({className: "null"});

    var leafClass = {
      'b-leaf': true,
      'b-leaf-clipped': true
    };

    leafClass[comment.leafclass] = comment.leafclass;

    var statuses = {
      deleted: 'ml(\'talk.deletedpost\')',
      screened: 'ml(\'talk.screenedpost\')',
      spammed: 'ml(\'talk.spammedpost\')',
      suspended: 'ml(\'talk.suspendedpost\')'
    };

    var status = statuses[comment.leafclass];

    return (
        React.DOM.div({
            className:  cx(leafClass), 
            id: 't' + this.props.comment.dtalkid
            }, 
            React.DOM.div({className: "b-leaf-inner"}, 
                React.DOM.div({className: "comment-debug"},  Comments.debugInfo(comment) ), 
                React.DOM.div({className: "b-leaf-cheader"}, 
                    React.DOM.p({className: "b-leaf-status"}, status), 
                    controls, 
                    CommentActions({comment: comment, isFooter: false})
                ), 

                React.DOM.div({className: "b-leaf-footer"}, 
                  CommentActions({comment: comment, isFooter: true})
                )
            )
        )
    );
  }
});

var CommentNormal = React.createClass({displayName: 'CommentNormal',
  getInitialState: function () {
    return {
      hovered: false,

      // loading comment
      expanding: false
    };
  },

  expandStart: function (comment) {
    if ( Comments.key(this.props.comment) !== Comments.key(comment) ) {
      return;
    }

    this.setState({ expanding: true });
  },

  expandEnd: function (comment) {
    if ( Comments.key(this.props.comment) !== Comments.key(comment) ) {
      return;
    }

    this.setState({ expanding: false });
  },

  componentDidMount: function () {
    LJ.Event.on('comment:expand:start', this.expandStart);
    LJ.Event.on('comment:expand:end', this.expandEnd);
  },

  componentWillUnmount: function () {
    LJ.Event.off('comment:expand:start', this.expandStart);
    LJ.Event.off('comment:expand:end', this.expandEnd);
  },

  onMouseEnter: function () {
    this.setState({ hovered: true });
  },

  onMouseLeave: function () {
    this.setState({ hovered: false });
  },

  render: function () {
    var comment = this.props.comment;

    // leaf classes
    var leafClasses = {
      'b-leaf':                true,
      'b-leaf-hover':          this.state.hovered,
      'b-leaf-expanding':      this.state.expanding,
      'b-leaf-collapsed':      comment.collapsed,
      'b-leaf-suspended':      comment.suspended,
      'b-leaf-tracked':        comment.tracked,
      'b-leaf-tracked-parent': comment.p_tracked,
      'b-leaf-modereply':      comment.modereply,
      'b-leaf-poster':         comment.uname === comment.poster,
      'b-leaf-withsubject':    comment.subject
    };

    leafClasses['b-leaf-' + comment.leafclass] = comment.leafclass;
    leafClasses['b-leaf-' + comment.subclass]  = comment.subclass;

    // subject
    var subject = '';
    if (comment.subject) {
      React.DOM.h4({className: "b-leaf-subject"}, 
        React.DOM.a({
            href: comment.thread_url, 
            className: "b-leaf-subject-link"
            }, comment.subject)
      )
    }

    // username
    var username = '';
    if (comment.username) {
      if ( comment.deleted_poster ) {
        username = comment.deleted_poster;
      } else {
        username = LJUser({user: comment.username})
      }
    } else {
      username = 'ml("talk.anonuser")';
    }

    // details
    var details = [];

    if ( comment.shown ) {
      details.push(subject);
      details.push(
        React.DOM.p({className: "b-leaf-username"}, 
            React.DOM.span({className: "b-leaf-username-name"}, username), 
            comment.ipaddr ? React.DOM.span({className: "b-leaf-ipaddr"}, comment.ipaddr) : ''
        )
      );
      details.push(
        React.DOM.p({className: "b-leaf-meta"}, 
          comment.ctime ? React.DOM.span({className: "b-leaf-createdtime"}, comment.ctime) : '', 
          comment.stime ? React.DOM.span({className: "b-leaf-shorttime"}, comment.stime) : '', 
          comment.etime ? React.DOM.span({className: "b-leaf-edittime"}, comment.ctime) : ''
        )
      );
      details.push(CommentActions({comment: comment, isFooter: false}));
    }

    if ( comment.loaded ) {
      details.push(CommentControls({controls: comment.controls}));
    }

    return (
      React.DOM.div({
          id: 't' + comment.dtalkid, 
          className:  cx(leafClasses), 
          'data-username': comment.uname, 
          'data-displayname': comment.dname, 
          'data-updated-ts': comment.ctime_ts, 
          'data-full': comment.loaded ? 1 : 0, 
          'data-subject': comment.subject ? comment.subject : '', 
          onMouseEnter: this.onMouseEnter, 
          onMouseLeave: this.onMouseLeave
          }, 
          React.DOM.div({className: "b-leaf-inner"}, 
              React.DOM.div({className: "comment-debug"},  Comments.debugInfo(comment) ), 
              React.DOM.div({className: "b-leaf-header"}, 
                  CommentUserpic({comment: comment}), 
                  React.DOM.div({className: "b-leaf-details"}, details)
              ), 

              comment.article ? React.DOM.div({className: "b-leaf-article", dangerouslySetInnerHTML: {__html: comment.article}}) : '', 

              React.DOM.div({className: "b-leaf-footer"}, 
                  CommentActions({comment: comment, isFooter: true})
              )
          )
      )
    );
  }
});

var LJUser = React.createClass({displayName: 'LJUser',
  render: function () {
    var user = Array.isArray(this.props.user) ? this.props.user[0] : this.props.user;

    return (
      React.DOM.span({className: "ljuser  i-ljuser  i-ljuser-type-P"}, 
        React.DOM.a({href: user.profile_url, className: "i-ljuser-profile"}, 
          React.DOM.img({className: "i-ljuser-userhead ContextualPopup", src: user.userhead_url})
        ), 
        React.DOM.a({href: user.journal_url, className: "i-ljuser-username"}, React.DOM.b(null, user.journal))
      )
    );
  }
});

var CommentUserpic = React.createClass({displayName: 'CommentUserpic',
  render: function () {
    var comment = this.props.comment;
    var userpic;

    if ( comment.userpic ) {
      userpic = React.DOM.img({
        alt: "", 
        src: comment.userpic, 
        title: comment.upictitle ? comment.upictitle : ''}
        )
    } else {
      var src = STAT_PREFIX + (comment.username ?
        '\/img\/userpics\/userpic-user.png?v=15821' :
        '\/img\/userpics\/userpic-anonymous.png?v=15821');

      userpic = React.DOM.img({src: src, alt: ""})
    }

    return (
      React.DOM.div({className: "b-leaf-userpic"}, 
          React.DOM.span({className: "b-leaf-userpic-inner"}, userpic)
      )
    );
  }
});

/**
 * <CommentControls controls={controls} />
 */
var CommentControls = React.createClass({displayName: 'CommentControls',
  render: function () {
    if ( !this.props.controls ) {
      return React.DOM.span({className: "null"});
    }

    var controls = [];

    this.props.controls.forEach(function (control) {
      if ( control.allowed ) {
        controls.push(CommentControl({control: control}));
      }
    });

    return (
      React.DOM.ul({className: "b-leaf-controls"}, controls)
    );
  }
});

/**
 * <CommentControl control={control} />
 */
var CommentControl = React.createClass({displayName: 'CommentControl',
  render: function () {
    var href = this.props.control.href ? this.props.control.href : '#';

    return (
      React.DOM.li({className: "b-leaf-controls-item"}, 
          React.DOM.a({
            className: 'b-controls b-controls-' + this.props.control.name, 
            title: this.props.control.title, 
            href: href, 
            rel: "nofollow"
            }, React.DOM.i({className: "b-controls-bg"}), this.props.control.title)
      )
    );
  }
});

/**
 * <CommentActions comment={comment} isFooter={true} />
 */
var CommentActions = React.createClass({displayName: 'CommentActions',
  render: function () {
    var actions = [];
    var isFooter = Boolean(this.props.isFooter);

    if ( !this.props.comment.actions ) {
      return React.DOM.span({className: "null"})
    }

    this.props.comment.actions.forEach(function (action) {
      if ( action.allowed ) {
        if ( isFooter === Boolean(action.footer) ) {
          actions.push(CommentAction({key: action.name, comment: this.props.comment, action: action}));
        }
      }
    }, this);

    return (
      React.DOM.ul({className: "b-leaf-actions"}, 
          actions, 
          React.DOM.li({className: "b-leaf-actions-item b-leaf-actions-new"}, 
            React.DOM.span({className: "b-thisisnew"}, "ml('talk.new')")
          )
      )
    );
  }
});

/**
 * <CommentAction comment={comment} />
 */
var CommentAction = React.createClass({displayName: 'CommentAction',
  handleClick: function (action, event) {
    event.preventDefault();

    console.log('action', action);

    var that = this;

    if ( action === 'expand' || action === 'expandchilds' ) {
      LJ.Event.trigger('comment:expand:start', this.props.comment);
      Comments.expand(this.props.comment).then(function () {
        LJ.Event.trigger('comment:expand:end', that.props.comment);
      });
    }

    if ( action === 'collapse' ) {
      Comments.collapse(this.props.comment);
    }
  },

  render: function () {
    var comment = this.props.comment;
    var action  = this.props.action;

    // render nothing, should move to CommentActions
    if ( action.checkbox && !action.massactions ) {
      return React.DOM.span({className: "null"});
    }

    // item classes
    var itemClassnames = {
      'b-leaf-actions-item': true,
      'active': action.active
    };
    itemClassnames['b-leaf-actions-check'] = action.checkbox;
    itemClassnames['b-leaf-actions-' + action.name] = !action.checkbox;

    // body
    var body = [];

    if ( action.disabled ) {
      body.push(action.title);
    } else {
      if ( action.checkbox ) {
        body.push(
          React.DOM.input({
            type: "checkbox", 
            id: 'c' + comment.dtalkid, 
            name: 'selected_' + comment.talkid, 
            className: "b-leaf-actions-checkbox", 
            autoComplete: "off"}
            ),
          React.DOM.label({
              htmlFor: 'c' + comment.dtalkid, 
              className: "b-leaf-actions-label"
              }, 
              this.props.action.title
          )
        );
      } else {
        var href = action.href ? action.href : '#';

        body.push(
          React.DOM.a({
            href: href, 
            rel: "nofollow", 
            className: action.name === 'permalink' ? '' : 'b-pseudo', 
            onClick: this.handleClick.bind(this, this.props.action.name)
            }, this.props.action.title)
        );
        // @todo add More users here
      }
    }

    return (
      React.DOM.li({className:  cx(itemClassnames) }, body)
    );
  }
});

/**
 * <CommentPaginator count={count} pages={pages} page={page} />
 */
var CommentPaginator = React.createClass({displayName: 'CommentPaginator',
  getInitialState: function () {
    return {
      page: this.props.page || 1
    };
  },

  setPage: function (page) {
    if ( this.state.page === page ) {
      return;
    }

    this.setState({ page: page });

    if ( typeof this.props.change === 'function' ) {
      this.props.change(page);
    }
  },

  prev: function () {
    this.setPage(
      this.state.page > 1 ? this.state.page - 1 : this.state.page
    );
  },

  next: function () {
    this.setPage(
      this.state.page < this.props.pages ? this.state.page + 1 : this.state.page
    );
  },

  render: function () {
    var pages = [];
    var pagesTotal = this.props.pages;
    var currentPage = this.state.page;
    var pageClasses;

    var pagerClasses = cx({
      'b-pager': true,
      'b-pager-first': this.state.page === 1,
      'b-pager-last':  this.state.page === pagesTotal
    });

    for (var i = 1; i <= pagesTotal; i += 1) {
      classes = cx({
        'b-pager-page': true,
        'b-pager-page-active': i === currentPage
      });

      pages.push(
        React.DOM.li({className: classes, key: i}, 
          React.DOM.a({
            href: "javascript:void(0)", 
            onClick: this.setPage.bind(this, i)
            }, i)
        )
      );
    }

    return (
      React.DOM.div({className: "b-xylem"}, 
        React.DOM.ul({className: "b-xylem-cells"}, 
          React.DOM.li({className: "b-xylem-cell b-xylem-cell-add"}, 
            React.DOM.a({className: "b-addcomment", href: "http://tema.livejournal.com/1719500.html?mode=reply#add_comment"}, 
              React.DOM.span({className: "b-addcomment-inner"}, React.DOM.i({className: "b-addcomment-icon"}), "Post a new comment")
            )
          ), 
          React.DOM.li({className: "b-xylem-cell b-xylem-cell-amount"}, 
            React.DOM.span({className: "js-amount"}, this.props.count, " comments")
          )
        ), 

        React.DOM.div({className: pagerClasses}, 
          React.DOM.div({className: "b-pager-prev"}, 
            React.DOM.a({href: "javascript:void(0)", onClick: this.prev, className: "b-pager-link"}, "Previous")
          ), 

          React.DOM.ul({className: "b-pager-pages"}, pages), 

          React.DOM.div({className: "b-pager-next"}, 
            React.DOM.a({href: "javascript:void(0)", onClick: this.next, className: "b-pager-link"}, "Next")
          )
        )
      )
    );
  }
});

// http://tema.livejournal.com/1725576.html
var LinkBox = React.createClass({displayName: 'LinkBox',
  submit: function (event) {
    event.preventDefault();

    var regexp = /^http:\/\/([^\.]+)\.livejournal\.com\/(\d+)\.html/;
    var pageRegexp = /page=(\d+)/;
    var url = this.refs.url.getDOMNode().value;
    var result = {};

    var matchUrl = url.match(regexp);
    var matchPage = url.match(pageRegexp);

    if ( matchUrl ) {
      result.journal = matchUrl[1];
      result.itemid = Number( matchUrl[2] );
    }

    if ( matchPage ) {
      result.page = Number( matchPage[1] );
    }

    this.props.change( result );
  },

  render: function () {
    return (
      React.DOM.form({onSubmit: this.submit}, 
        React.DOM.input({ref: "url", placeholder: "Enter post url", defaultValue: "http://tema.livejournal.com/1725576.html"}), 
        React.DOM.input({type: "submit", value: "Submit"})
      )
    );
  }
});

$(function () {
  React.renderComponent(
    CommentBox({url: "http://tema.livejournal.com/1720831.html"}),
    document.getElementById('content')
  );
})

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
      itemid: params.itemid,
      journal: params.journal,
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
   * Notice: all parent threads should be invalidated as well
   * @param  {Number} key Talk id
   */
  function _invalidateThread(key) {
    delete _threads[key];

    _getParents(key).forEach(function (key) {
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
   * Expand provided comment
   * @param  {Object} comment Comment
   * @return {Promise}        Promise that will be resolved when comment fetched
   */
  function expand(comment) {
    var key = __key(comment);

    // request params
    var _params = {
      thread: key,
      expand_all: 1,
      journal: params.journal,
      itemid: params.itemid
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
   * Utility function that converts array of strings/numbers to
   * dictionary, where the strings/numbers are keys and `true` is the value
   * @return {Object} Dictionary
   *
   * @example
   *   _toHash([123, 456]); // => { '123': true, '456': true }
   */
  function _toHash(arr) {
    return arr.reduce(function (result, value) {
      result[value] = true;
      return result;
    }, {});
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

    debugInfo: debugInfo
  };
}());
