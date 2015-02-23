var React = require('react');
var Comments = require('../comments');

var Twig = require('./Twig.jsx');

/**
 * <Thread dtalkid={dtalkid} />
 */
var Thread = React.createClass({
  getInitialState: function () {
    return {
      comment:  Comments.getComment(this.props.dtalkid),
      children: Comments.getChildren(this.props.dtalkid)
    };
  },

  updateThread: function (dtalkid) {
    if ( this.props.dtalkid !== dtalkid ) {
      return;
    }

    this.setState({
      comment:  Comments.getComment(this.props.dtalkid),
      children: Comments.getChildren(this.props.dtalkid)
    });

    // because children threads props did not change - we should trigger update for
    // each children thread as well
    this.state.children.forEach(function (dtalkid) {
      LJ.Event.trigger('thread:update', dtalkid);
    });
  },

  componentDidMount: function () {
    LJ.Event.on('thread:update', this.updateThread);
  },

  componentWillUnmount: function () {
    LJ.Event.off('thread:update', this.updateThread);
  },

  render: function () {
    var childrenThreads = this.state.children.map(function (dtalkid) {
      return <Thread dtalkid={dtalkid} key={dtalkid} />;
    });

    return (
      <div className="b-tree-thread">
        <Twig comment={this.state.comment} />
        { childrenThreads }
      </div>
    );
  }
});

module.exports = Thread;
