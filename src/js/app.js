/** @jsx React.DOM **/

var STAT_PREFIX = 'http://stat.livejournal.com';
var IS_REMOTE_SUP = true;
var cx = React.addons.classSet;

/**
 * <CommentList threads={threads} />
 */
var CommentList = React.createClass({
  render: function() {
    var threads = this.props.threads.map(function (dtalkid) {
      return <Thread dtalkid={dtalkid} key={dtalkid} />;
    }, this);

    return (
      <div className="b-tree b-tree-root">{threads}</div>
    );
  }
});

var CommentBox = React.createClass({
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
      <div id="comments" className={classes}>
        <CommentPaginator pages={10} count={this.state.replies} change={this.changePage} />
        <CommentList threads={this.state.threads} />
      </div>
    );
  }
});

/**
 * <Thread dtalkid={dtalkid} />
 */
var Thread = React.createClass({
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
      return <Thread dtalkid={dtalkid} key={dtalkid} />;
    });

    return (
      <div className="b-tree-thread">
        <Twig comment={this.state.comment} />
        { childrenThreads }
      </div>
    );
  }
});

/**
 * <Twig comment={comment} />
 */
var Twig = React.createClass({
  getInitialState: function () {
    return {
      comment: this.props.comment
    };
  },

  updateComment: function (dtalkid) {
    var key = Comments.key(this.state.comment);

    if ( key === dtalkid ) {
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
        commentHtml = <CommentMore comment={comment} key={key} />
      } else if ( comment.deleted || !comment.shown ) {
        commentHtml = <CommentClipped comment={comment} key={key} />
      } else {
        commentHtml = <CommentNormal comment={comment} key={key} />
      }
    }

    return (
      <div
          className={ cx(twigClass) }
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
  getInitialState: function () {
    return {
      expanding: false
    };
  },

  expand: function (event) {
    console.time('expand more');
    event.preventDefault();

    var that = this;
    this.setState({ expanding: true });
    Comments.expand(this.props.comment).then(function () {
      console.timeEnd('expand more');
    });
  },

  render: function () {
    var comment = this.props.comment;

    var leafClass = {
      'b-leaf': true,
      'b-leaf-seemore': true,
      'b-leaf-expanding': this.state.expanding
    };
    leafClass['b-leaf-seemore-' + comment.moreclass] = comment.moreclass;

    // actions
    if ( comment.actions ) {
      var actions = comment.actions.map(function (action) {
        return (
          <span className="b-leaf-seemore-more">
            <a
              href="javascript:void(0)"
              rel="nofollow"
              className="b-pseudo"
              onClick={this.expand}
              >{action.title}</a>
          </span>
        );
      }, this);

      var expand = [
        <span className="b-leaf-seemore-expand">
          <a
            href="javascript:void(0)"
            rel="nofollow"
            className="b-pseudo"
            onClick={this.expand}
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
          className={ cx(leafClass) }
          data-parent={comment.parent}
          data-dtalkids={comment.data}
          data-updated-ts={comment.touched}
          data-count={comment.more}
          >
          <div className="b-leaf-inner">
            <div className="comment-debug">{ Comments.debugInfo(comment) }</div>
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
                   <CommentControls comment={this.props.comment} /> :
                   <span className="null" />;

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
        <div
            className={ cx(leafClass) }
            id={'t' + this.props.comment.dtalkid}
            >
            <div className="b-leaf-inner">
                <div className="comment-debug">{ Comments.debugInfo(comment) }</div>
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
      hovered: false,

      // loading comment
      expanding: false,

      // some action is currently happening on comment; e.g. screen, freeze
      processing: false
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

  processingStart: function (key) {
    if ( Comments.key(this.props.comment) !== key ) {
      return;
    }

    this.setState({ processing: true });
  },

  processingEnd: function (key) {
    if ( Comments.key(this.props.comment) !== key ) {
      return;
    }

    this.setState({ processing: false });
  },

  componentDidMount: function () {
    LJ.Event.on('comment:expand:start', this.expandStart);
    LJ.Event.on('comment:expand:end', this.expandEnd);
    LJ.Event.on('comment:processing:start', this.processingStart);
    LJ.Event.on('comment:processing:end', this.processingEnd);
  },

  componentWillUnmount: function () {
    LJ.Event.off('comment:expand:start', this.expandStart);
    LJ.Event.off('comment:expand:end', this.expandEnd);
    LJ.Event.off('comment:processing:start', this.processingStart);
    LJ.Event.off('comment:processing:end', this.processingEnd);
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
      'b-leaf-processing':     this.state.processing,
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
      details.push(<CommentControls comment={comment} />);
    }

    return (
      <div
          id={'t' + comment.dtalkid}
          className={ cx(leafClasses) }
          data-username={comment.uname}
          data-displayname={comment.dname}
          data-updated-ts={comment.ctime_ts}
          data-full={comment.loaded ? 1 : 0}
          data-subject={comment.subject ? comment.subject : ''}
          onMouseEnter={this.onMouseEnter}
          onMouseLeave={this.onMouseLeave}
          >
          <div className="b-leaf-inner">
              <div className="comment-debug">{ Comments.debugInfo(comment) }</div>
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
 * <CommentControls comment={comment} />
 */
var CommentControls = React.createClass({
  render: function () {
    var comment = this.props.comment;

    if ( !comment.controls ) {
      return null;
    }

    var controls = [];

    comment.controls.forEach(function (control) {
      if ( control.allowed ) {
        controls.push(<CommentControl control={control} comment={comment} key={control.name} />);
      }
    }, this);

    return (
      <ul className="b-leaf-controls">{controls}</ul>
    );
  }
});

/**
 * <CommentControl comment={comment} control={control} />
 */
var CommentControl = React.createClass({
  clickControl: function (event) {
    event.preventDefault();

    var key = Comments.key(this.props.comment);

    console.log(this.props.control);
    var name = this.props.control.name;

    // delete, spam, freeze, screen, track

    switch (this.props.control.name) {
      case 'screen':
        LJ.Event.trigger('comment:processing:start', key);
        Comments.screen(key, true).then(function () {
          LJ.Event.trigger('comment:processing:end', key)
        });
        break;
      case 'unscreen':
        LJ.Event.trigger('comment:processing:start', key);
        Comments.screen(key, false).then(function () {
          LJ.Event.trigger('comment:processing:end', key)
        });
        break;
    }
  },

  render: function () {
    var href = this.props.control.href ? this.props.control.href : '#';

    return (
      <li className="b-leaf-controls-item">
          <a
            className={'b-controls b-controls-' + this.props.control.name}
            title={this.props.control.title}
            href={href}
            rel="nofollow"
            onClick={this.clickControl}
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
      return <span className="null" />;
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
            onClick={this.handleClick.bind(this, this.props.action.name)}
            >{this.props.action.title}</a>
        );
        // @todo add More users here
      }
    }

    return (
      <li className={ cx(itemClassnames) }>{body}</li>
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
        <li className={classes} key={i}>
          <a
            href="javascript:void(0)"
            onClick={this.setPage.bind(this, i)}
            >{i}</a>
        </li>
      );
    }

    return (
      <div className="b-xylem b-xylem-first">
        <ul className="b-xylem-cells">
          <li className="b-xylem-cell b-xylem-cell-add">
            <a className="b-addcomment" href="http://tema.livejournal.com/1719500.html?mode=reply#add_comment">
              <span className="b-addcomment-inner"><i className="b-addcomment-icon"></i>Post a new comment</span>
            </a>
            <CommentForm />
          </li>
          <li className="b-xylem-cell b-xylem-cell-amount">
            <span className="js-amount">{this.props.count} comments</span>
          </li>
        </ul>

        <div className={pagerClasses}>
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

/**
 * <CommentForm body={body} subject={subject} disabled={disabled} />
 */
var CommentForm = React.createClass({
  render: function () {
    var classes = cx({
      'b-updateform': true,
      'b-updateform-disabled': this.props.disabled
    });

    var buttons = [
      [
        {name: 'bold', title: 'Insert Bold'},
        {name: 'italic', title: 'Insert Italic'},
        {name: 'underline', title: 'Insert Underline'},
        {name: 'strikethrough', title: 'Insert Strikethrough'}
      ], [
        {name: 'link', title: 'Insert Link'},
        {name: 'user', title: 'Insert LJ User'}
      ], [
        {name: 'photo', title: 'Insert Photo'},
        {name: 'video', title: 'Insert Media'}
      ]
    ];

    var toolbarButtons = buttons.map(function (buttons, index) {
      var classes = cx({
        'b-updateform-buttons': true,
        'b-updateform-buttons-firstsection':  index === 0,
        'b-updateform-buttons-secondsection': index === 1,
        'b-updateform-buttons-thirdsection':  index === 2,
      });

      return (
        <ul className={classes} key={'form-buttons-group' + index}>
          {buttons.map(function (button) {
            var classes = {
              'b-updateform-button': true
            };
            classes['b-updateform-button-' + button.name] = true;

            return (
              <li className="b-updateform-buttons-item">
                <a
                  href="javascript:void(0);"
                  className={ cx(classes) }
                  title={button.title}
                  tabIndex="151"
                  >
                  <i className="b-updateform-button-pic"></i>
                  <span className="b-updateform-button-title b-pseudo">{button.title}</span>
                </a>
              </li>
            );
          })}
        </ul>
      );
    });

    return (
      <div className="b-watering">

        {/* Comment form */}
        <form method="post" id="postform">
          <div className="b-watering-wrapper">
            <div className="b-watering-outer">
              <div className="b-watering-fields">
                <div className="b-watering-inner">
                  {/* Form */}
                  <div className={classes}>
                    <div className="b-updateform-bar">{toolbarButtons}</div>

                    <textarea
                        name="body"
                        id="body"
                        cols="60"
                        rows="10"
                        className="b-updateform-textarea"
                        tabIndex="50"
                        autoComplete="off"
                        disabled={this.props.disabled}
                        >{this.props.body}</textarea>
                  </div>

                  {/* Submit button */}
                  <div className="b-watering-submit">
                    <div className="b-ljbutton b-ljbutton-submit b-ljbutton-disabled">
                      <button type="submit" name="submitpost" tabIndex="50" disabled="disabled">Add a comment</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Arrows */}
        <i className="b-watering-close"></i>

        <i className="b-watering-arrows">
          <i className="b-watering-arrow-border"></i>
          <i className="b-watering-arrow"></i>
        </i>
      </div>
    );
  }
});

$(function () {
  React.renderComponent(
    /* <CommentBox url="http://tema.livejournal.com/1720831.html" /> */
    <CommentBox url="http://valerii.livejournal.com/23424.html" />,
    document.getElementById('content')
  );
})
