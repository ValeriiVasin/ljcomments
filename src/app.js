/** @jsx React.DOM **/

var STAT_PREFIX = 'http://stat.livejournal.com';
var IS_REMOTE_SUP = true;

/**
 * Add margins and levels
 */
var Comments = (function () {
  var parents = {};
  var _comments = {};

  function __key(comment) {
    if ( comment.dtalkid ) {
      return comment.dtalkid;
    }

    // for MORE comment
    return Number( comment.data.split(':')[0] );
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
    comments.forEach(function (comment) {
      if ( comment.hasOwnProperty('margin') ) {
        return;
      }

      var level = getLevel(comment.dtalkid);
      comment.level  = level;
      comment.margin = (level - 1) * 30;
    });
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

    $.each(_comments, function (key, value) {
      if ( !value.parent ) {
        topLevel.push( __key(value) );
      }
    });

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

  function debugInfo(comment) {
    var obj = {};

    obj.key   = __key(comment);
    obj.above = comment.above || false;
    obj.below = comment.below || false;
    obj.level = comment.level || false;

    return <div className="comment-debug">{ JSON.stringify(obj) }</div>;
  }

  return {
    parse: parse,
    getThread: getThread,

    getTree: getTree,

    debugInfo: debugInfo
  };
}());

window.Comments = Comments;

var CommentList = React.createClass({
  render: function() {
    var comments = this.props.comments.map(function (comment) {
      return <Twig comment={comment} key={comment.dtalkid} />;
    }, this);

    return (
      <div className="b-tree b-tree-root">{comments}</div>
    );
  }
});

var CommentBox = React.createClass({
  getInitialState: function () {
    return {
      replies:  0,
      comments: [],
      page: 1,
      loading: true
    };
  },

  componentDidMount: function () {
    this.loadCommentsFromServer();
  },

  urlParams: function () {
    var regexp = /^http:\/\/([^\.]+)\.livejournal\.com\/(\d+)\.html/;
    var pageRegexp = /page=(\d+)/;
    var url = this.props.url;
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

    return result;
  },

  loadCommentsFromServer: function(page) {
    var params = $.extend(
      this.urlParams(),
      { page: page }
    );

    var endpoint = [
      'http://' + params.journal + '.livejournal.com/',
      params.journal + '/__rpc_get_thread',
      '?journal=' + params.journal,
      '&itemid=' + params.itemid,
      '&page=' + (page || 1)
    ].join('');

    var url = 'http://jsonp.jit.su/?url=' + encodeURIComponent(endpoint) + '&callback=?';

    console.log('url', url);
    this.setState({ loading: true });
    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function(data) {
        if (data.error) {
          console.error('date error', data);
          return;
        }

        if ( !this.isMounted() ) {
          return;
        }

        this.setState({ loading: false });

        // parse levels and add margins
        Comments.parse( data.comments );

        this.setState({
          comments: Comments.getTree(),
          replies: data.replycount
        });
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  changePage: function (page) {
    console.log('change page: %d', page);
    this.loadCommentsFromServer(page);
  },

  render: function() {
    var comments = '';

    var classes = React.addons.classSet({
      'b-grove': true,
      'b-grove-loading': this.state.loading
    });

    return (
      <div id="comments" className={classes}>
        <CommentPaginator pages={10} count={this.state.replies} change={this.changePage} />
        <CommentList comments={this.state.comments} />
      </div>
    );
  }
});

/**
 * <Twig comment={comment} />
 */
var Twig = React.createClass({
  render: function () {
    var comment = this.props.comment;

    var twigClass = ['b-tree-twig'];
    if ( comment.level ) {
      twigClass.push('b-tree-twig-' + comment.level);
    }

    // comment
    var commentHtml;
    if ( comment.html ) {
      commentHtml = comment.html;
    } else {
      if (comment.more) {
        commentHtml = <CommentMore comment={comment} />
      } else if ( comment.deleted || !comment.shown ) {
        commentHtml = <CommentClipped comment={comment} />
      } else {
        commentHtml = <CommentNormal comment={comment} />
      }
    }

    return (
      <div
          className={twigClass.join(' ')}
          style={{marginLeft: comment.margin}}
          data-tid={'t' + comment.dtalkid}
          >
          {commentHtml}
      </div>
    );
  }
});

/**
 * Comment with more users
 * Statement: comment.more
 */
var CommentMore = React.createClass({
  render: function () {
    var comment = this.props.comment;

    var leafClass = ['b-leaf', 'b-leaf-seemore'];
    if ( comment.moreclass ) {
      leafClass.push( 'b-leaf-seemore-' + comment.moreclass );
    }

    // actions
    if ( comment.actions ) {
      var actions = comment.actions.map(function (action) {
        var href = action.href ? action.href : '#';

        return (
          <span className="b-leaf-seemore-more">
            <a
              href={href}
              rel="nofollow"
              className="b-pseudo"
              >{action.title}</a>
          </span>
        );
      });

      // expand action
      var href = comment.actions[0].href;
      href = href || '#';

      var expand = [
        <span className="b-leaf-seemore-expand">
          <a
            href={href}
            rel="nofollow"
            className="b-pseudo"
            >ml('talk.expandlink')</a>
        </span>
      ];
    }

    // ljusers block
    if (IS_REMOTE_SUP && comment.ljusers) {
      var users = comment.ljusers.map(function (user) {
        return (
          user.anonymous ?
            <span>ml('talk.anonuser')</span> :
            <LJUser user={user} key={user.journal} />
        );
      });

      var moreusers = comment.moreusers ? '&hellip;' : '';

      var ljusers = [
        <span className="b-leaf-seemore-from">ml('talk.from')</span>,
        <span className="b-leaf-seemore-users">
          {users}
          {moreusers}
        </span>
      ];
    }

    return (
      <div
          className={leafClass.join(' ')}
          data-parent={comment.parent}
          data-dtalkids={comment.data}
          data-updated-ts={comment.touched}
          data-count={comment.more}
          >
          <div className="b-leaf-inner">
            { Comments.debugInfo(comment) }
            {actions}
            {ljusers}
            {expand}
          </div>
     </div>
    );
  }
});

/**
 * <ClippedComment comment={comment} />
 * Statement: comment.deleted || !comment.shown
 */
var CommentClipped = React.createClass({
  render: function () {
    var comment = this.props.comment;

    var controls = this.props.comment.controls ?
                   <CommentControls controls={this.props.comment.controls} /> :
                   <span className="null" />;

    var leafClass = ['b-leaf', 'b-leaf-clipped', comment.leafclass];

    var statuses = {
      deleted: 'ml(\'talk.deletedpost\')',
      screened: 'ml(\'talk.screenedpost\')',
      spammed: 'ml(\'talk.spammedpost\')',
      suspended: 'ml(\'talk.suspendedpost\')'
    };

    var status = statuses[comment.leafclass];

    return (
        <div
            className={leafClass.join(' ')}
            id={'t' + this.props.comment.dtalkid}
            >
            <div className="b-leaf-inner">
                { Comments.debugInfo(comment) }
                <div className="b-leaf-cheader">
                    <p className="b-leaf-status">{status}</p>
                    {controls}
                    <CommentActions comment={comment} isFooter={false} />
                </div>

                <div className="b-leaf-footer">
                  <CommentActions comment={comment} isFooter={true} />
                </div>
            </div>
        </div>
    );
  }
});

var CommentNormal = React.createClass({
  getInitialState: function () {
    return {
      hovered: false
    }
  },

  onMouseEnter: function () {
    this.setState({ hovered: true })
  },

  onMouseLeave: function () {
    this.setState({ hovered: false })
  },

  render: function () {
    var comment = this.props.comment;

    // leaf classes
    var leafClass = ['b-leaf'];

    if ( this.state.hovered ) {
      leafClass.push('b-leaf-hover')
    }

    if ( comment.leafclass ) {
      leafClass.push('b-leaf-' + comment.leafclass);
    }
    if ( comment.suspended ) {
      leafClass.push('b-leaf-suspended');
    }
    if ( comment.tracked ) {
      leafClass.push('b-leaf-tracked');
    }
    if ( comment.subclass ) {
      leafClass.push('b-leaf-' + comment.subclass);
    }
    if ( comment.p_tracked ) {
      leafClass.push('b-leaf-tracked-parent');
    }
    if ( comment.modereply ) {
      leafClass.push('b-leaf-modereply');
    }
    if ( comment.uname === comment.poster ) {
      leafClass.push('b-leaf-poster');
    }
    if ( comment.subject ) {
      leafClass.push('b-leaf-withsubject');
    }

    // subject
    var subject = '';
    if (comment.subject) {
      <h4 className="b-leaf-subject">
        <a
            href={comment.thread_url}
            className="b-leaf-subject-link"
            >{comment.subject}</a>
      </h4>
    }

    // username
    var username = '';
    if (comment.username) {
      if ( comment.deleted_poster ) {
        username = comment.deleted_poster;
      } else {
        username = <LJUser user={comment.username} />
      }
    } else {
      username = 'ml("talk.anonuser")';
    }

    // details
    var details = [];

    if ( comment.shown ) {
      details.push(subject);
      details.push(
        <p className="b-leaf-username">
            <span className="b-leaf-username-name">{username}</span>
            {comment.ipaddr ? <span className="b-leaf-ipaddr">{comment.ipaddr}</span> : ''}
        </p>
      );
      details.push(
        <p className="b-leaf-meta">
          {comment.ctime ? <span className="b-leaf-createdtime">{comment.ctime}</span> : ''}
          {comment.stime ? <span className="b-leaf-shorttime">{comment.stime}</span> : ''}
          {comment.etime ? <span className="b-leaf-edittime">{comment.ctime}</span> : ''}
        </p>
      );
      details.push(<CommentActions comment={comment} isFooter={false} />);
    }

    if ( comment.loaded ) {
      details.push(<CommentControls controls={comment.controls} />);
    }

    return (
      <div
          id={'t' + comment.dtalkid}
          className={leafClass.join(' ')}
          data-username={comment.uname}
          data-displayname={comment.dname}
          data-updated-ts={comment.ctime_ts}
          data-full={comment.loaded ? 1 : 0}
          data-subject={comment.subject ? comment.subject : ''}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          >
          <div className="b-leaf-inner">
              { Comments.debugInfo(comment) }
              <div className="b-leaf-header">
                  <CommentUserpic comment={comment} />
                  <div className="b-leaf-details">{details}</div>
              </div>

              {comment.article ? <div className="b-leaf-article" dangerouslySetInnerHTML={{__html: comment.article}}></div> : ''}

              <div className="b-leaf-footer">
                  <CommentActions comment={comment} isFooter={true} />
              </div>
          </div>
      </div>
    );
  }
});

var LJUser = React.createClass({
  render: function () {
    var user = Array.isArray(this.props.user) ? this.props.user[0] : this.props.user;

    return (
      <span className="ljuser  i-ljuser  i-ljuser-type-P">
        <a href={user.profile_url} className="i-ljuser-profile">
          <img className="i-ljuser-userhead ContextualPopup" src={user.userhead_url} />
        </a>
        <a href={user.journal_url} className="i-ljuser-username"><b>{user.journal}</b></a>
      </span>
    );
  }
});

var CommentUserpic = React.createClass({
  render: function () {
    var comment = this.props.comment;
    var userpic;

    if ( comment.userpic ) {
      userpic = <img
        alt=''
        src={comment.userpic}
        title={comment.upictitle ? comment.upictitle : ''}
        />
    } else {
      var src = STAT_PREFIX + (comment.username ?
        '\/img\/userpics\/userpic-user.png?v=15821' :
        '\/img\/userpics\/userpic-anonymous.png?v=15821');

      userpic = <img src={src} alt="" />
    }

    return (
      <div className="b-leaf-userpic">
          <span className="b-leaf-userpic-inner">{userpic}</span>
      </div>
    );
  }
});

/**
 * <CommentControls controls={controls} />
 */
var CommentControls = React.createClass({
  render: function () {
    if ( !this.props.controls ) {
      return <span className="null" />;
    }

    var controls = [];

    this.props.controls.forEach(function (control) {
      if ( control.allowed ) {
        controls.push(<CommentControl control={control} />);
      }
    });

    return (
      <ul className="b-leaf-controls">{controls}</ul>
    );
  }
});

/**
 * <CommentControl control={control} />
 */
var CommentControl = React.createClass({
  render: function () {
    var href = this.props.control.href ? this.props.control.href : '#';

    return (
      <li className="b-leaf-controls-item">
          <a
            className={'b-controls b-controls-' + this.props.control.name}
            title={this.props.control.title}
            href={href}
            rel="nofollow"
            ><i className="b-controls-bg"></i>{this.props.control.title}</a>
      </li>
    );
  }
});

/**
 * <CommentActions comment={comment} isFooter={true} />
 */
var CommentActions = React.createClass({
  render: function () {
    var actions = [];
    var isFooter = Boolean(this.props.isFooter);

    if ( !this.props.comment.actions ) {
      return <span className="null" />
    }

    this.props.comment.actions.forEach(function (action) {
      if ( action.allowed ) {
        if ( isFooter === Boolean(action.footer) ) {
          actions.push(<CommentAction key={action.name} comment={this.props.comment} action={action} />);
        }
      }
    }, this);

    return (
      <ul className="b-leaf-actions">
          {actions}
          <li className="b-leaf-actions-item b-leaf-actions-new">
            <span className="b-thisisnew">ml('talk.new')</span>
          </li>
      </ul>
    );
  }
});

/**
 * <CommentAction comment={comment} />
 */
var CommentAction = React.createClass({
  render: function () {
    var comment = this.props.comment;
    var action  = this.props.action;

    // render nothing, should move to CommentActions
    if ( action.checkbox && !action.massactions ) {
      return <span className="null" />;
    }

    // item classes
    var itemClassnames = ['b-leaf-actions-item'];
    itemClassnames.push(
      'b-leaf-actions-' + (action.checkbox ? 'check' : action.name)
    );
    if ( action.active ) {
      itemClassnames.push('active');
    }

    // body
    var body = [];

    if ( action.disabled ) {
      body.push(action.title);
    } else {
      if ( action.checkbox ) {
        body.push(
          <input
            type="checkbox"
            id={'c' + comment.dtalkid}
            name={'selected_' + comment.talkid}
            className="b-leaf-actions-checkbox"
            autoComplete="off"
            />,
          <label
              htmlFor={'c' + comment.dtalkid}
              className="b-leaf-actions-label"
              >
              {this.props.action.title}
          </label>
        );
      } else {
        var href = action.href ? action.href : '#';

        body.push(
          <a
            href={href}
            rel="nofollow"
            className={action.name === 'permalink' ? '' : 'b-pseudo'}
            >{this.props.action.title}</a>
        );
        // @todo add More users here
      }
    }

    return (
      <li className={itemClassnames.join(' ')}>{body}</li>
    );
  }
});

/**
 * <CommentPaginator count={count} pages={pages} page={page} />
 */
var CommentPaginator = React.createClass({
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

    var pagerClasses = ['b-pager'];

    if ( this.state.page === 1 ) {
      pagerClasses.push('b-pager-first');
    }

    if ( this.state.page === pagesTotal ) {
      pagerClasses.push('b-pager-last');
    }

    for (var i = 1; i <= pagesTotal; i += 1) {
      classes = 'b-pager-page ' + (i === currentPage ? 'b-pager-page-active' : '');
      pages.push(
        <li className={classes} key={i}>
          <a
            href="javascript:void(0)"
            onClick={this.setPage.bind(this, i)}
            >{i}</a>
        </li>
      );
    }

    return (
      <div className="b-xylem">
        <ul className="b-xylem-cells">
          <li className="b-xylem-cell b-xylem-cell-add">
            <a className="b-addcomment" href="http://tema.livejournal.com/1719500.html?mode=reply#add_comment">
              <span className="b-addcomment-inner"><i className="b-addcomment-icon"></i>Post a new comment</span>
            </a>
          </li>
          <li className="b-xylem-cell b-xylem-cell-amount">
            <span className="js-amount">{this.props.count} comments</span>
          </li>
        </ul>

        <div className={pagerClasses.join(' ')}>
          <div className="b-pager-prev">
            <a href="javascript:void(0)" onClick={this.prev} className="b-pager-link">Previous</a>
          </div>

          <ul className="b-pager-pages">{pages}</ul>

          <div className="b-pager-next">
            <a href="javascript:void(0)" onClick={this.next} className="b-pager-link">Next</a>
          </div>
        </div>
      </div>
    );
  }
});

// http://tema.livejournal.com/1725576.html
var LinkBox = React.createClass({
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
      <form onSubmit={this.submit}>
        <input ref="url" placeholder="Enter post url" defaultValue="http://tema.livejournal.com/1725576.html" />
        <input type="submit" value="Submit" />
      </form>
    );
  }
});

React.renderComponent(
  <CommentBox url="http://tema.livejournal.com/1720831.html" />,
  document.getElementById('content')
);
