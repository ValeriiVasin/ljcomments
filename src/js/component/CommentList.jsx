var React = require('react');
var Thread = require('./Thread.jsx');

/**
 * <CommentList threads={threads} />
 */
var CommentList = React.createClass({
  render: function() {
    var threads = this.props.threads.map(function (dtalkid) {
      return <Thread dtalkid={dtalkid} key={dtalkid} />;
    }, this);

    return (
      <div className="b-tree b-tree-root">{threads}</div>
    );
  }
});

module.exports = CommentList;
