var React = require('react');
var cx = require('react/lib/cx');

var LJUser = require('./LJUser.jsx');
var Comments = require('../comments');
var IS_REMOTE_SUP = require('../constants').IS_REMOTE_SUP;

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

module.exports = CommentMore;
