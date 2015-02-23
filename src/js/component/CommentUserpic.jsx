var React = require('react');

var STAT_PREFIX = require('../constants').STAT_PREFIX;

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

module.exports = CommentUserpic;
