var React = require('react');

var CommentBox = require('./component/CommentBox.jsx');

React.render(
  /* <CommentBox url="http://tema.livejournal.com/1720831.html" /> */
  <CommentBox url="http://valerii.livejournal.com/23424.html" />,
  document.getElementById('content')
);
