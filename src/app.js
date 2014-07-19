/** @jsx React.DOM **/

var STAT_PREFIX = 'http://stat.livejournal.com';

var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment) {
      return comment.more ?
            <CommentMore key={comment.talkid} comment={comment} is_remote_sup={this.props.is_remote_sup} /> :
            <Comment key={comment.talkid} comment={comment} is_remote_sup={this.props.is_remote_sup} />;
    }, this);

    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function () {
    var author = this.refs.author.getDOMNode().value.trim();
    var text = this.refs.text.getDOMNode().value.trim();

    if (!text || !author) {
      return false;
    }

    // TODO: send request to the server
    this.refs.author.getDOMNode().value = '';
    this.refs.text.getDOMNode().value = '';

    this.props.onCommentSubmit({ author: author, text: text });

    return false;
  },

  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input ref="author" placeholder="Your name" />
        <input ref="text" placeholder="Say something..." />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

var CommentBox = React.createClass({
  getInitialState: function () {
    return { data: [] };
  },

  loadCommentsFromServer: function() {
    if ( localStorage.getItem('comments') ) {
      this.setState({
        data: JSON.parse(localStorage.getItem('comments'))
      });

      return;
    }

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({ data: data });
        localStorage.setItem('comments', JSON.stringify(data));
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleCommentSubmit: function (comment) {
    this.setState({
      data: this.state.data.concat([comment])
    });
  },

  componentWillMount: function () {
    this.loadCommentsFromServer();
  },

  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} is_remote_sup={this.props.is_remote_sup} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

var Comment = React.createClass({

  render: function() {
    var controls = this.props.comment.controls ?
                   <CommentControls controls={this.props.comment.controls} /> :
                   <span className="null" />;

    return (
      <div className="b-tree-twig b-tree-twig-1"
        style={{marginLeft: this.props.comment.margin}}
        data-tid="t939948748"
        >
        <div
          id="t939948748"
          className="b-leaf"
          data-username="canonnier"
          data-displayname="canonnier"
          data-updated-ts="1405322689"
          data-full="1"
          >
          <div className="b-leaf-inner">
            <div className="b-leaf-header">

              <div className="b-leaf-userpic">
                <span className="b-leaf-userpic-inner">
                  <img
                    src="http://l-userpic.livejournal.com/110496957/17593088"
                    alt=""
                    title="canonnier: pic#110496957"
                    className="ContextualPopup"
                    />
                </span>
              </div>

              <div className="b-leaf-details">

                <p className="b-leaf-username">
                  <span className="b-leaf-username-name">
                    <LJUser user={this.props.comment.username} />
                  </span>
                </p>

                <p className="b-leaf-meta">
                  <span className="b-leaf-createdtime">July 14 2014, 11:24:49</span>
                  <span className="b-leaf-shorttime">12 hours ago</span>
                </p>

                <CommentActions comment={this.props.comment} isFooter={false} />

                {controls}

              </div>
            </div>

            <div className="b-leaf-article">{this.props.comment.article}</div>

            <div className="b-leaf-footer">
              <CommentActions comment={this.props.comment} isFooter={true} />
            </div>

          </div>
        </div>
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
    var comment;
    if ( comment.html ) {
      comment = comment.html;
    } else {
      if (comment.more) {
        comment = <CommentMore comment={comment} />
      } else if ( comment.deleted || !comment.shown ) {
        comment = <CommentClipped comment={comment} />
      } else {
        comment = <CommentNormal comment={comment} />
      }
    }

    return (
      <div
          className={twigClass}
          style={{marginLeft: comment.margin}}
          data-tid={'t' + comment.dtalkid}
          >
          {comment}
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
    if (this.props.is_remote_sup && comment.ljusers) {
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
          className={leafClass}
          data-parent={comment.parent}
          data-dtalkids={comment.data}
          data-updated-ts={comment.touched}
          data-count={comment.more}
          >

          <div className="b-leaf-inner">
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
    var controls = this.props.comment.controls ?
                   <CommentControls controls={this.props.comment.controls} /> :
                   <span className="null" />;

    var statuses = {
      deleted: 'ml(\'talk.deletedpost\')',
      screened: 'ml(\'talk.screenedpost\')',
      spammed: 'ml(\'talk.spammedpost\')',
      suspended: 'ml(\'talk.suspendedpost\')'
    };

    var status = statuses[this.props.comment.leafclass];

    var leafClass = [
      'b-leaf',
      'b-leaf-clipped',
      'b-leaf-' + this.props.comment.leafclass
    ];

    return (
        <div
            className={leafClass}
            id={'t' + this.props.comment.dtalkid}
            >

            <div className="b-leaf-inner">
                <div className="b-leaf-cheader">
                    <p className="b-leaf-status">{status}</p>
                    {controls}
                    <CommentActions comment={this.props.comment} isFooter={false} />
                </div>

                <div className="b-leaf-footer">
                  <CommentActions comment={this.props.comment} isFooter={true} />
                </div>
            </div>
        </div>
    );
  }
});

var CommentCollapsed = React.createClass({
  render: function () {
    return (
      <div
        className=" b-tree-twig  b-tree-twig-4"
        style={{marginLeft: this.props.comment.margin}}
        data-tid="t939996364"
        >
        <div
          id="t939996364"
          className="b-leaf b-leaf-collapsed"
          data-username="live_in_odessa"
          data-displayname="live_in_odessa"
          data-updated-ts="1405327017"
          >
          <div className="b-leaf-inner">
            <div className="b-leaf-header">

              <div className="b-leaf-userpic">
                <span className="b-leaf-userpic-inner">
                  <img src="http://l-stat.livejournal.net/img/userpics/userpic-user.png?v=15821" alt="" />
                </span>
              </div>

              <div className="b-leaf-details">

                <p className="b-leaf-username">
                  <span className="b-leaf-username-name">
                    <LJUser user={this.props.comment.username} />
                  </span>
                </p>

                <p className="b-leaf-meta">
                  <span className="b-leaf-shorttime">{this.props.comment.ctime}</span>
                </p>

                <CommentActions comment={this.props.comment} isFooter={false} />

              </div>
            </div>

            <div className="b-leaf-footer">
              <CommentActions comment={this.props.comment} isFooter={true} />
            </div>

          </div>
        </div>
      </div>
    );
  }
});

var CommentNormal = React.createClass({
  render: function () {
    var comment = this.props.comment;

    // leaf classes
    var leafClass = ['b-leaf'];
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
      <h4 class="b-leaf-subject">
        <a
            href={comment.thread_url}
            class="b-leaf-subject-link"
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
          className={leafClass}
          data-username={comment.uname}
          data-displayname={comment.dname}
          data-updated-ts={comment.ctime_ts}
          data-full={comment.loaded ? 1 : 0}
          data-subject={comment.subject ? comment.subject : ''}
          >
          <div class="b-leaf-inner">
              <div class="b-leaf-header">
                  <CommentUserpic comment={comment} />
                  <div class="b-leaf-details">{details}</div>
              </div>

              {comment.article ? <div className="b-leaf-article">{comment.article}</div> : ''}

              <div class="b-leaf-footer">
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
        '/img/userpics/userpic-user.png?v=15821' :
        '/img/userpics/userpic-anonymous.png?v=15821'
      );

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
    var classes = ['b-controls', 'b-controls-' + this.props.control.name];
    var href = this.props.control.href ? this.props.control.href : '#';

    return (
      <li className="b-leaf-controls-item">
          <a
            className={classes}
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
          actions.push(<CommentAction comment={this.props.comment} action={action} />);
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
        var linkClass = action.name === 'permalink' ? '' : 'b-pseudo';

        body.push(
          <a
            href={href}
            rel="nofollow"
            className={linkClass}
            >{this.props.action.title}</a>
        );
        // @todo add More users here
      }
    }

    return (
      <li
          className={itemClassnames}
          >
          {body}
      </li>
    );
  }
});

React.renderComponent(
  <CommentBox url="comments.json" is_remote_sup={true} />,
  document.getElementById('content')
);
