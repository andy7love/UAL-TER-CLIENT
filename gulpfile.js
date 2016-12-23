var gulp = require('gulp');
var ts = require('gulp-typescript');
var clean = require('gulp-rimraf');
var copy = require('gulp-copy');
var uglify = require('gulp-uglify');
var fork = require('child_process').fork;
var chalk = require('chalk');
var tsProject = ts.createProject('./tsconfig.json');
var closeServer = null;
 
gulp.task('clean', [], function () {
    return gulp.src('build/**/*', {read: false})
        .pipe(clean());
});

gulp.task('relay-server:build', ['clean'], function () {
    return gulp.src('relay-server/**/*.ts')
        .pipe(ts({
            "removeComments": true,
            "noImplicitAny": false,
            "baseUrl": "./node_modules",
            "module": "commonjs"
        }))
        .pipe(gulp.dest('build/relay-server'));
});

gulp.task('scripts', ['clean'], function () {
    var tsResult = tsProject.src()
        .pipe(tsProject());

    return tsResult.js
        .pipe(uglify())
        .pipe(gulp.dest('build'));
});

gulp.task('static', ['clean'], function () {
    return gulp
        .src(['src/*.html', 'src/*.css'])
        .pipe(copy('build', {prefix: 1}));
});

gulp.task('watch', ['build'], function () {
    gulp.watch(['src/*.ts', 'src/**/*.ts'], ['build']);
});
 
gulp.task('serve', ['build'], function (cb) {
    var express = require('express');
    var app = express();
    var port = 8000;

    app.use(express.static(__dirname + '/build'));
    app.use('/resources', express.static(__dirname + '/resources'));
    app.use('/vendor', express.static(__dirname + '/bower_components'));

    var contentServer = app.listen(port, function() {
        console.log("App listening on http://localhost:" + port + '/');
    });

    var signalingServer = fork('./signaling-server.js', [], {
        stdio: 'pipe',
        silent: true
    });
    signalingServer.stdout.on('data', function(data) {
        console.log(chalk.blue("Signaling Server") + chalk.grey(' - ') + data);
    });
    signalingServer.stderr.on('data', function(data) {
        console.log(chalk.blue("Signaling Server") + chalk.red("ERROR!") + chalk.grey(' - ') + data);
    });

    var relayServer = fork('./build/relay-server/RelayServer.js', [], {
        stdio: 'pipe',
        silent: true
    });
    relayServer.stdout.on('data', function(data) {
        console.log(chalk.cyan("Relay Server") + chalk.grey(' - ') + data);
    });
    relayServer.stderr.on('data', function(data) {
        console.log(chalk.cyan("Relay Server") + chalk.red("ERROR!") + chalk.grey(' - ') + data);
    });

    closeServer = function() {
        contentServer.close();
        console.log('Server closed');
    };
});

gulp.task('build', ['clean', 'scripts', 'relay-server:build', 'static']);

gulp.task('default', ['build', 'serve', 'watch']);