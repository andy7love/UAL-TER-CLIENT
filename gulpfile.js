var gulp = require('gulp');
var runSequence = require('run-sequence');
var ts = require('gulp-typescript');
var clean = require('gulp-rimraf');
var copy = require('gulp-copy');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');
var pug = require('gulp-pug');
var pugConcat = require('gulp-pug-template-concat');
var fork = require('child_process').fork;
var chalk = require('chalk');
var tsProject = ts.createProject('./tsconfig.json');
var closeServer = null;
 
gulp.task('clean', [], function () {
    return gulp.src([
            'build/**/*',
            '!build/iconfont/**'
        ], {read: false})
        .pipe(clean({ force: true }));
});

gulp.task('relay-server:build', [], function () {
    return gulp.src('relay-server/**/*.ts')
        .pipe(ts({
            "removeComments": true,
            "noImplicitAny": false,
            "baseUrl": "./node_modules",
            "module": "commonjs"
        }))
        .pipe(gulp.dest('build/relay-server'));
});

gulp.task('sass', [], function () {
  return gulp.src('src/sass/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('build'));
});
 
gulp.task('views', [], function buildHTML() {
    return gulp.src('src/views/**/*.pug')
        .pipe(pug({
            client: true
        }))
        .pipe(pugConcat('templates.js', {
            // nothing...      
        }))
        .pipe(gulp.dest('build'))
});

gulp.task('scripts', [], function () {
    var tsResult = tsProject.src()
        .pipe(tsProject());

    return tsResult.js
        .pipe(uglify())
        .pipe(gulp.dest('build'));
});

gulp.task('static', [], function () {
    return gulp
        .src([
            'src/*.html',
            'src/iconfont/*.*'
        ])
        .pipe(copy('build', {prefix: 1}));
});

gulp.task('serve', [], function (cb) {
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

gulp.task('watch', [], function () {
    gulp.watch(['src/**/*.ts'], ['scripts']);
    gulp.watch(['src/sass/**/*.scss'], ['sass']);
    gulp.watch(['src/*.html'], ['static']);
    gulp.watch(['src/views/**/*.pug'], ['views']);
});

gulp.task('build', function(done) {
    runSequence(
        'clean', 
        ['scripts', 'views', 'sass', 'relay-server:build', 'static'],
        done);
});

gulp.task('default', function(done) {
    runSequence(
        'build',
        'watch',
        'serve',
        done);
});