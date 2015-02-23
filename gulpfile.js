var gulp    = require('gulp');
var concat  = require('gulp-concat');

var babelify = require('babelify');
var browserify = require('browserify');
var gutil = require('gulp-util');
var livereload = require('gulp-livereload');
var notify = require('gulp-notify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

gulp.task('dev', function() {
  var bundler = watchify(browserify('./src/js/app.jsx', watchify.args));
  bundler.transform(babelify);

  function bundle() {
    console.time('Bundle');
    return bundler.bundle()
      // log errors if they happen
      .on('error', gutil.log.bind(gutil, 'Browserify Error'))
      .pipe(source('app.js'))
      .pipe(gulp.dest('build/'))
      .pipe(livereload())
      .pipe(notify(function () {
        console.timeEnd('Bundle');
      }));
  }

  livereload.listen();
  bundle();
  bundler.on('update', bundle);
});

gulp.task('css', function() {
  return gulp.src('src/css/**/*.css')
    .pipe( concat('app.css') )
    .pipe( gulp.dest('build/') );
});

// @todo Fix build task
gulp.task('build', ['css']);

// @todo Provide correct watch task
gulp.task('watch', ['build'], function () {
  gulp.watch('src/js/**/*.js', ['js']);
  gulp.watch('src/css/**/*.css', ['css']);
});
