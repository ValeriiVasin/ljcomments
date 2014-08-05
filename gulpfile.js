var gulp    = require('gulp'),
    watch   = require('gulp-watch'),
    plumber = require('gulp-plumber'),
    react   = require('gulp-react'),
    csso    = require('gulp-csso'),
    uglify  = require('gulp-uglifyjs'),
    concat  = require('gulp-concat');

gulp.task('js', function () {
  return gulp.src('src/js/**/*.js')
    .pipe( react() )
    .pipe( concat('app.js') )
    .pipe( gulp.dest('build/') );
});

gulp.task('css', function() {
  return gulp.src('src/css/**/*.css')
    .pipe( concat('app.css') )
    .pipe( gulp.dest('build/') );
});

gulp.task('default', ['build']);
gulp.task('build', ['js', 'css']);

gulp.task('watch', ['build'], function () {
  gulp.watch('src/js/**/*.js', ['js']);
  gulp.watch('src/css/**/*.css', ['css']);
});
