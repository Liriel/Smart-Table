var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var karma = require('karma').server;
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var pluginList = ['stSearch', 'stSelectRow', 'stSort'];
var disFolder = './dist/';

var src=(['smart-table.module', 'stTable']).concat(pluginList).map(function (val) {
    return 'src/' + val + '.js';
});

//modules
gulp.task('plugins', function () {
    gulp.src(src)
        .pipe(concat('smart-table.min.js'))
        .pipe(uglify(
//            {mangle: false}//if true then angular throw error at run time, need to find out
        ))
        .pipe(gulp.dest(disFolder));
});


//just as indication
gulp.task('lint', function () {
    gulp.src(src)
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});


gulp.task('karma-CI', function (done) {
    var conf = require('./test/karma.common.js');
    conf.singleRun = true;
    conf.browsers = ['PhantomJS'];
    conf.basePath = './';
    karma.start(conf, done);
});

gulp.task('test', ['karma-CI']);

gulp.task('build', ['test', 'plugins']);
