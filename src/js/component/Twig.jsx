var React = require('react');
var cx = require('react/lib/cx');

var CommentMore = require('./CommentMore.jsx');
var CommentClipped = require('./CommentClipped.jsx');
var CommentNormal = require('./CommentNormal.jsx');
var Comments = require('../comments');

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

module.exports = Twig;
