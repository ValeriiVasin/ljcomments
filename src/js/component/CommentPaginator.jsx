var React = require('react');
var cx = require('react/lib/cx');

var CommentForm = require('./CommentForm.jsx');

/**
 * <CommentPaginator count={count} pages={pages} page={page} />
 */
var CommentPaginator = React.createClass({
  getInitialState: function () {
    return {
      page: this.props.page || 1
    };
  },

  setPage: function (page) {
    if ( this.state.page === page ) {
      return;
    }

    this.setState({ page: page });

    if ( typeof this.props.change === 'function' ) {
      this.props.change(page);
    }
  },

  prev: function () {
    this.setPage(
      this.state.page > 1 ? this.state.page - 1 : this.state.page
    );
  },

  next: function () {
    this.setPage(
      this.state.page < this.props.pages ? this.state.page + 1 : this.state.page
    );
  },

  render: function () {
    var pages = [];
    var pagesTotal = this.props.pages;
    var currentPage = this.state.page;
    var pageClasses;
    var classes;

    var pagerClasses = cx({
      'b-pager': true,
      'b-pager-first': this.state.page === 1,
      'b-pager-last':  this.state.page === pagesTotal
    });

    for (var i = 1; i <= pagesTotal; i += 1) {
      classes = cx({
        'b-pager-page': true,
        'b-pager-page-active': i === currentPage
      });

      pages.push(
        <li className={classes} key={i}>
          <a
            href="javascript:void(0)"
            onClick={this.setPage.bind(this, i)}
            >{i}</a>
        </li>
      );
    }

    return (
      <div className="b-xylem b-xylem-first">
        <ul className="b-xylem-cells">
          <li className="b-xylem-cell b-xylem-cell-add">
            <a className="b-addcomment" href="http://tema.livejournal.com/1719500.html?mode=reply#add_comment">
              <span className="b-addcomment-inner"><i className="b-addcomment-icon"></i>Post a new comment</span>
            </a>
            <CommentForm />
          </li>
          <li className="b-xylem-cell b-xylem-cell-amount">
            <span className="js-amount">{this.props.count} comments</span>
          </li>
        </ul>

        <div className={pagerClasses}>
          <div className="b-pager-prev">
            <a href="javascript:void(0)" onClick={this.prev} className="b-pager-link">Previous</a>
          </div>

          <ul className="b-pager-pages">{pages}</ul>

          <div className="b-pager-next">
            <a href="javascript:void(0)" onClick={this.next} className="b-pager-link">Next</a>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = CommentPaginator;
