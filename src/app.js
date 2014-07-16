/** @jsx React.DOM **/
var CommentList = React.createClass({
  render: function() {
    var commentNodes = this.props.data.map(function (comment) {
      return comment.more ?
            <CommentMore key={comment.talkid} comment={comment} /> :
            <Comment key={comment.talkid} comment={comment} />;
    });

    return (
      <div className="commentList">
        {commentNodes}
      </div>
    );
  }
});

var CommentForm = React.createClass({
  handleSubmit: function () {
    var author = this.refs.author.getDOMNode().value.trim();
    var text = this.refs.text.getDOMNode().value.trim();

    if (!text || !author) {
      return false;
    }

    // TODO: send request to the server
    this.refs.author.getDOMNode().value = '';
    this.refs.text.getDOMNode().value = '';

    this.props.onCommentSubmit({ author: author, text: text });

    return false;
  },

  render: function() {
    return (
      <form className="commentForm" onSubmit={this.handleSubmit}>
        <input ref="author" placeholder="Your name" />
        <input ref="text" placeholder="Say something..." />
        <input type="submit" value="Post" />
      </form>
    );
  }
});

var CommentBox = React.createClass({
  getInitialState: function () {
    return { data: [] };
  },

  loadCommentsFromServer: function() {
    if ( localStorage.getItem('comments') ) {
      this.setState({
        data: JSON.parse(localStorage.getItem('comments'))
      });

      return;
    }

    $.ajax({
      url: this.props.url,
      dataType: 'json',
      success: function(data) {
        this.setState({ data: data });
        localStorage.setItem('comments', JSON.stringify(data));
      }.bind(this),
      error: function(xhr, status, err) {
        console.error(this.props.url, status, err.toString());
      }.bind(this)
    });
  },

  handleCommentSubmit: function (comment) {
    this.setState({
      data: this.state.data.concat([comment])
    });
  },

  componentWillMount: function () {
    this.loadCommentsFromServer();
  },

  render: function() {
    return (
      <div className="commentBox">
        <h1>Comments</h1>
        <CommentList data={this.state.data} />
        <CommentForm onCommentSubmit={this.handleCommentSubmit} />
      </div>
    );
  }
});

var Comment = React.createClass({

  render: function() {
    var controls = this.props.comment.controls ?
                   <CommentControls controls={this.props.comment.controls} /> :
                   null;

    return (
      <div className="b-tree-twig b-tree-twig-1"
        style={{marginLeft: this.props.comment.margin}}
        data-tid="t939948748"
        >
        <div
          id="t939948748"
          className="b-leaf"
          data-username="canonnier"
          data-displayname="canonnier"
          data-updated-ts="1405322689"
          data-full="1"
          >
          <div className="b-leaf-inner">
            <div className="b-leaf-header">

              <div className="b-leaf-userpic">
                <span className="b-leaf-userpic-inner">
                  <img
                    src="http://l-userpic.livejournal.com/110496957/17593088"
                    alt=""
                    title="canonnier: pic#110496957"
                    className="ContextualPopup"
                    />
                </span>
              </div>

              <div className="b-leaf-details">

                <p className="b-leaf-username">
                  <span className="b-leaf-username-name">
                    <LJUser user={this.props.comment.username} />
                  </span>
                </p>

                <p className="b-leaf-meta">
                  <span className="b-leaf-createdtime">July 14 2014, 11:24:49</span>
                  <span className="b-leaf-shorttime">12 hours ago</span>
                </p>

                <ul className="b-leaf-actions">
                  <li className=" b-leaf-actions-item b-leaf-actions-check">
                    <input type="checkbox" id="c939948748" name="selected_3671674" className="b-leaf-actions-checkbox" autoComplete="off" />
                    <label htmlFor="c939948748" className="b-leaf-actions-label"> Check </label>
                  </li>
                  <li className=" b-leaf-actions-item b-leaf-actions-permalink  ">
                    <a href="http://tema.livejournal.com/1719500.html?thread=939948748#t939948748" rel="nofollow">link</a>
                  </li>
                  <li className=" b-leaf-actions-item b-leaf-actions-collapse">
                    <a href="http://tema.livejournal.com/1719500.html?thread=939948748#t939948748" rel="nofollow" className="b-pseudo">Collapse</a>
                  </li>
                  <li className=" b-leaf-actions-item b-leaf-actions-expand  ">
                    <a href="http://tema.livejournal.com/1719500.html?thread=939948748#t939948748" rel="nofollow" className="b-pseudo">Expand</a>
                  </li>
                  <li className="b-leaf-actions-item b-leaf-actions-new"><span className="b-thisisnew">New comment</span></li>
                </ul>

                {controls}

              </div>
            </div>

            <div className="b-leaf-article">{this.props.comment.article}</div>

            <div className="b-leaf-footer">
              <ul className="b-leaf-actions">
                <li className=" b-leaf-actions-item b-leaf-actions-reply">
                  <a href="http://tema.livejournal.com/1719500.html?replyto=939948748" rel="nofollow" className="b-pseudo">Reply</a>
                </li>
                <li className=" b-leaf-actions-item b-leaf-actions-expandchilds">
                  <a href="http://tema.livejournal.com/1719500.html?thread=939948748#t939948748" rel="nofollow" className="b-pseudo">Expand</a>
                </li>
                <li className="b-leaf-actions-item b-leaf-actions-new">
                  <span className="b-thisisnew">New comment</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    );
  }
});

/**
 * Comment with more users
 */
var CommentMore = React.createClass({
  render: function () {
    var users = this.props.comment.ljusers.map(function (user) {
      return (
        <LJUser user={user} key={user.journal} />
      );
    });

    return (
      <div
        className="b-tree-twig  b-tree-twig-3"
        style={{marginLeft: this.props.comment.margin}}
        data-tid="t"
        >
        <div className="b-leaf b-leaf-seemore  b-leaf-seemore-width" data-parent="940013260" data-dtalkids="940057292:940063180" data-updated-ts="1405364385" data-count="5">
          <div className="b-leaf-inner">
            <span className="b-leaf-seemore-more">
              <a href="http://tema.livejournal.com/1719500.html?thread=940013260#t940013260" rel="nofollow" className="b-pseudo">
              {this.props.comment.actions[0].title}
              </a>
            </span>
            <span className="b-leaf-seemore-from">from</span>
            <span className="b-leaf-seemore-users">{users}</span>
            <span className="b-leaf-seemore-expand">
              <a href="http://tema.livejournal.com/1719500.html?thread=940013260#t940013260" rel="nofollow" className="b-pseudo">Expand</a>
            </span>
          </div>
        </div>
      </div>
    );
  }
});

var CommentCollapsed = React.createClass({
  render: function () {
    return (
      <div
        className=" b-tree-twig  b-tree-twig-4"
        style={{marginLeft: this.props.comment.margin}}
        data-tid="t939996364"
        >
        <div
          id="t939996364"
          className="b-leaf b-leaf-collapsed"
          data-username="live_in_odessa"
          data-displayname="live_in_odessa"
          data-updated-ts="1405327017"
          >
          <div className="b-leaf-inner">
            <div className="b-leaf-header">

              <div className="b-leaf-userpic">
                <span className="b-leaf-userpic-inner">
                  <img src="http://l-stat.livejournal.net/img/userpics/userpic-user.png?v=15821" alt="" />
                </span>
              </div>

              <div className="b-leaf-details">

                <p className="b-leaf-username">
                  <span className="b-leaf-username-name">
                    <LJUser user={this.props.comment.username} />
                  </span>
                </p>

                <p className="b-leaf-meta">
                  <span className="b-leaf-shorttime">{this.props.comment.ctime}</span>
                </p>

                <ul className="b-leaf-actions">
                  <li className=" b-leaf-actions-item b-leaf-actions-check">
                    <input type="checkbox" id="c939996364" name="selected_3671860" className="b-leaf-actions-checkbox" autoComplete="off" />
                    <label htmlFor="c939996364" className="b-leaf-actions-label"> Check </label>
                  </li>

                  <li className=" b-leaf-actions-item b-leaf-actions-permalink">
                    <a href="http://tema.livejournal.com/1719500.html?thread=939996364#t939996364" rel="nofollow">link</a>
                  </li>

                  <li className=" b-leaf-actions-item b-leaf-actions-collapse">
                    <a href="http://tema.livejournal.com/1719500.html?thread=939996364#t939996364" rel="nofollow" className="b-pseudo">Collapse</a>
                  </li>

                  <li className=" b-leaf-actions-item b-leaf-actions-expand  ">
                    <a href="http://tema.livejournal.com/1719500.html?thread=939996364#t939996364" rel="nofollow" className="b-pseudo">Expand</a>
                  </li>

                  <li className="b-leaf-actions-item b-leaf-actions-new">
                    <span className="b-thisisnew">New comment</span>
                  </li>
                </ul>

              </div>
            </div>

            <div className="b-leaf-footer">
              <ul className="b-leaf-actions">
                <li className="b-leaf-actions-item b-leaf-actions-new">
                  <span className="b-thisisnew">New comment</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    );
  }
});

var LJUser = React.createClass({
  render: function () {
    var user = Array.isArray(this.props.user) ? this.props.user[0] : this.props.user;

    return (
      <span className="ljuser  i-ljuser  i-ljuser-type-P">
        <a href={user.profile_url} className="i-ljuser-profile">
          <img className="i-ljuser-userhead ContextualPopup" src={user.userhead_url} />
        </a>
        <a href={user.journal_url} className="i-ljuser-username"><b>{user.journal}</b></a>
      </span>
    );
  }
});

/**
 * <CommentControls controls={controls} />
 */
var CommentControls = React.createClass({
  render: function () {
    var controls = [];

    this.props.controls.forEach(function (control) {
      if ( control.allowed ) {
        controls.push(<CommentControl control={control} />);
      }
    });

    return (
      <ul className="b-leaf-controls">{controls}</ul>
    );
  }
});

/**
 * <CommentControl control={control} />
 */
var CommentControl = React.createClass({
  render: function () {
    var classes = ['b-controls', 'b-controls-' + this.props.control.name];
    var href = this.props.control.href ? this.props.control.href : '#';

    return (
      <li className="b-leaf-controls-item">
          <a
            className={classes}
            title={this.props.control.title}
            href={href}
            rel="nofollow"
            ><i className="b-controls-bg"></i>{this.props.control.title}</a>
      </li>
    );
  }
})

React.renderComponent(
  <CommentBox url="comments.json" pollInterval={2000} />,
  document.getElementById('content')
);
