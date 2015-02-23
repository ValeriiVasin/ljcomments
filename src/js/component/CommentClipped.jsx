var React = require('react');
var cx = require('react/lib/cx');

var CommentActions = require('./CommentActions.jsx');
var CommentControls = require('./CommentControls.jsx');
var Comments = require('../comments');

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

module.exports = CommentClipped;
