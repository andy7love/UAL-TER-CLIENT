var gulp = require('gulp');
var ts = require('gulp-typescript');
var clean = require('gulp-rimraf');
var copy = require('gulp-copy');
var tsProject = ts.createProject('./tsconfig.json');
var closeServer = null;
 
gulp.task('clean', [], function () {
    return gulp.src('build/*', {read: false})
        .pipe(clean());
});

gulp.task('scripts', ['clean'], function () {
    var tsResult = tsProject.src()
        .pipe(tsProject());

    return tsResult.js.pipe(gulp.dest('build'));
});

gulp.task('static', ['clean'], function () {
    return gulp
        .src(['src/*.html', 'src/*.css'])
        .pipe(copy('build', {prefix: 1}));
});

gulp.task('watch', function () {
    gulp.watch(['src/*.ts', 'src/**/*.ts'], ['build']);
});
 
gulp.task('serve', [], function (cb) {
    var express = require('express');
    var app = express();
    var port = 8000;

    app.use(express.static(__dirname + '/build'));
    app.use('/resources', express.static(__dirname + '/resources'));
    app.use('/vendor', express.static(__dirname + '/bower_components'));

    var server = app.listen(port, function() {
        console.log("App listening on http://localhost:" + port + '/');
    });

    closeServer = function() {
        server.close();
        console.log('Server closed');
    };
});

gulp.task('build', ['clean', 'scripts', 'static']);

gulp.task('default', ['build', 'serve', 'watch']);