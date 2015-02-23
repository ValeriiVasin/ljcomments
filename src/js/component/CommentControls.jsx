var React = require('react');

var CommentControl = require('./CommentControl.jsx');

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

module.exports = CommentControls;
