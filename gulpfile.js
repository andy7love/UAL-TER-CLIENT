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

gulp.task('clean', [], () => {
    return gulp.src([
            'build/**/*',
        ], {read: false})
        .pipe(clean({ force: true }));
});

gulp.task('relay-server:build', [], () => {
    return gulp.src('relay-server/**/*.ts')
        .pipe(ts({
            "removeComments": true,
            "noImplicitAny": false,
            "baseUrl": "./node_modules",
            "module": "commonjs"
        }))
        .pipe(gulp.dest('build/relay-server'));
});

gulp.task('serve', [], cb => {
    var signalingServer = fork('./signaling-server.js', [], {
        stdio: 'pipe',
        silent: true
    });
    signalingServer.stdout.on('data', data => {
        console.log(chalk.blue("Signaling Server") + chalk.grey(' - ') + data);
    });
    signalingServer.stderr.on('data', data => {
        console.log(chalk.blue("Signaling Server") + chalk.red("ERROR!") + chalk.grey(' - ') + data);
    });

    var relayServer = fork('./build/relay-server/RelayServer.js', [], {
        stdio: 'pipe',
        silent: true
    });
    relayServer.stdout.on('data', data => {
        console.log(chalk.cyan("Relay Server") + chalk.grey(' - ') + data);
    });
    relayServer.stderr.on('data', data => {
        console.log(chalk.cyan("Relay Server") + chalk.red("ERROR!") + chalk.grey(' - ') + data);
    });

    closeServer = () => {
		relayServer.kill();
		signalingServer.kill();
        console.log('Server closed');
    };
});

gulp.task('default', done => {
    runSequence(
        'relay-server:build',
        'serve',
        done);
});
