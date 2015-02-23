var React = require('react');
var cx = require('react/lib/cx');

var Comments = require('../comments');
var CommentPaginator = require('./CommentPaginator.jsx');
var CommentList = require('./CommentList.jsx');
var Comments = require('../comments');

var CommentBox = React.createClass({
  getInitialState: function () {
    return {
      replies:  0,
      threads: [],
      page: 1,
      loading: true
    };
  },

  componentDidMount: function () {
    Comments.setUrl( this.props.url );

    this.loadCommentsFromServer();

    LJ.Event.on('comments:update', function () {
      if ( !this.isMounted() ) {
        return;
      }

      this.setState({
        threads: Comments.getThreadsForPage(this.state.page)
      });
    }, this);
  },

  loadCommentsFromServer: function(page) {
    var that = this;

    if ( typeof page === 'undefined' ) {
      page = 1;
    }

    this.setState({ loading: true });
    Comments.fetchPage(page).then(function (result) {
        if ( !that.isMounted() ) {
          return;
        }

        that.setState({
          loading: false,
          threads: result.threads,
          replies: result.replies
        });
    });
  },

  changePage: function (page) {
    this.setState({ page: page });
    this.loadCommentsFromServer(page);
  },

  render: function() {
    var comments = '';

    var classes = cx({
      'b-grove': true,
      'b-grove-loading': this.state.loading
    });

    return (
      <div id="comments" className={classes}>
        <CommentPaginator pages={10} count={this.state.replies} change={this.changePage} />
        <CommentList threads={this.state.threads} />
      </div>
    );
  }
});

module.exports = CommentBox;
