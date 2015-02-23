var React = require('react');
var cx = require('react/lib/cx');

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

module.exports = CommentForm;
