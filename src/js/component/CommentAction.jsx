var React = require('react');
var cx = require('react/lib/cx');

var Comments = require('../comments');

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

module.exports = CommentAction;
