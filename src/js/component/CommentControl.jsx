var React = require('react');

var Comments = require('../comments');

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
      case 'freeze':
        LJ.Event.trigger('comment:processing:start', key);
        Comments.freeze(key, true).then(function () {
          LJ.Event.trigger('comment:processing:end', key)
        });
        break;
      case 'unfreeze':
        LJ.Event.trigger('comment:processing:start', key);
        Comments.freeze(key, false).then(function () {
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

module.exports = CommentControl;
