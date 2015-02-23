var React = require('react');

// http://tema.livejournal.com/1725576.html
var LinkBox = React.createClass({
  submit: function (event) {
    event.preventDefault();

    var regexp = /^http:\/\/([^\.]+)\.livejournal\.com\/(\d+)\.html/;
    var pageRegexp = /page=(\d+)/;
    var url = this.refs.url.getDOMNode().value;
    var result = {};

    var matchUrl = url.match(regexp);
    var matchPage = url.match(pageRegexp);

    if ( matchUrl ) {
      result.journal = matchUrl[1];
      result.itemid = Number( matchUrl[2] );
    }

    if ( matchPage ) {
      result.page = Number( matchPage[1] );
    }

    this.props.change( result );
  },

  render: function () {
    return (
      <form onSubmit={this.submit}>
        <input ref="url" placeholder="Enter post url" defaultValue="http://tema.livejournal.com/1725576.html" />
        <input type="submit" value="Submit" />
      </form>
    );
  }
});

module.exports = LinkBox;
