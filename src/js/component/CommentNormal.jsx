var React = require('react');
var cx = require('react/lib/cx');
var Comments = require('../comments');

var CommentUserpic = require('./CommentUserpic.jsx');
var LJUser = require('./LJUser.jsx');
var CommentActions = require('./CommentActions.jsx');
var CommentControls = require('./CommentControls.jsx');

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

module.exports = CommentNormal;
