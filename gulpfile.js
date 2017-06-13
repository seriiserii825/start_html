var gulp = require('gulp'),
    prefixer = require('gulp-autoprefixer'),
    rigger = require('gulp-rigger'),
    cssnano = require('gulp-cssnano'),
    less = require('gulp-less'),
    rimraf = require('rimraf'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    spritesmith = require('gulp.spritesmith'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync').create(),
    imagemin = require('gulp-imagemin'),
    newer = require('gulp-newer'),
    cssmin = require('gulp-cssmin'),
    jsmin = require('gulp-jsmin'),
    fileinclude = require('gulp-file-include'),
    pngquant = require('imagemin-pngquant'),
    svgmin = require('gulp-svgmin'),
    cached = require('gulp-cached');

gulp.task('head', function () {
    gulp.src('src/head.less') // Выберем наш style.less
        .pipe(sourcemaps.init())
        .pipe(less()) // Скомпилируем
        .pipe(prefixer()) // Добавим вендорные префиксы
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/css/'))
        .pipe(cssmin({showLog: true}))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('build/css/'))
        .pipe(browserSync.stream());
});

gulp.task('fileinclude', function() {
  gulp.src(['build/index.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }))
    .pipe(gulp.dest('build/'));
});


gulp.task('html', function () {
    gulp.src('src/**/*.html') // Выберем файлы по нужному пути
        .pipe(sourcemaps.init())
        .pipe(rigger()) // Прогоним через rigger
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/'))
        .pipe(browserSync.stream());
    // Переместим их в папку build
});

gulp.task('mail', function () {
    gulp.src('src/mail.php') // Выберем файлы по нужному пути
        .pipe(gulp.dest('build/'))
        .pipe(browserSync.stream());
    // Переместим их в папку build
});

gulp.task('css', function () {
    gulp.src('src/less/style.less') // Выберем наш style.less
        .pipe(sourcemaps.init())
        .pipe(less()) // Скомпилируем
        .pipe(prefixer()) // Добавим вендорные префиксы
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/css/'))
        .pipe(cssmin({showLog: true}))
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('build/css/'))
        .pipe(browserSync.stream());
});

gulp.task('js', function () {
    gulp.src('src/js/*.js') // Выберем файлы по нужному пути
        .pipe(cached('src/js/*.js'))
        .pipe(rigger())
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('build/js'))
        .pipe(jsmin())
        .pipe(uglify())
        .pipe(rename({suffix: '.min', prefix : ''}))
        .pipe(gulp.dest('build/js'))
        .pipe(browserSync.stream());
});

gulp.task('cssmin', function () {
    gulp.src('src/min/css/*.css')
        .pipe(cssmin({showLog: true}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('src/min/css-min/'));
});

gulp.task('jsmin', function () {
    gulp.src('src/min/js/*.js')
        .pipe(jsmin())
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('src/min/js-min/'));
});

gulp.task('cleanmin', function (cb) {
    rimraf('src/min/{js-min/,css-min/}', cb);
});

gulp.task('min', ['cleanmin','cssmin', 'jsmin']);

gulp.task('libs', function(){
    gulp.src('src/libs/**/*.*')
        .pipe(gulp.dest('build/libs/'))
});

gulp.task('sprite', function () {
    var sprite = gulp.src('src/img/icons/*.png').pipe(spritesmith({
        imgName: '../img/sprite.png',
        cssName: 'sprite.less',
        cssFormat: 'less',
        algorithm: 'binary-tree',
        padding: 10
    }));
    sprite.img.pipe(rename('sprite.png')).pipe(gulp.dest('build/img/')).pipe(browserSync.stream());
    sprite.css.pipe(gulp.dest('src/less/imports/')).pipe(browserSync.stream());
});

gulp.task('svg', function () {
    return gulp.src('src/img/**/*.svg')
        .pipe(newer('build/img'))    
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(gulp.dest('build/img/'))
});

gulp.task('img', ['svg'], function () {
    gulp.src('src/img/**/*.*') // Выберем наши картинки
        .pipe(newer('build/img'))
        .pipe(imagemin({
            verbose: true,
            interlaced: true,
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
            }))
        .pipe(gulp.dest('build/img/'));
    // Переместим в build
});

gulp.task('fonts', function () {
    gulp.src('src/fonts/**/*.*') // Выберем файлы по нужному пути
        .pipe(gulp.dest('build/css/fonts'))
        .pipe(browserSync.stream());
    // Переместим их в папку build
});

gulp.task('clean', function (cb) {
    rimraf('build/', cb);
});

gulp.task('build', [
    'html',
    'css',
    'fonts',
    'js',
    'img',
    'sprite',
    'libs',
    'mail'
]);

gulp.task('browser-sync', function () {

    browserSync.init({
        proxy: "starthtml.loc/build",
        notify: true
    });
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.html', ['html']);
    gulp.watch('src/less/**/*.less', ['css']);
    gulp.watch('src/less/head.less', ['head']);
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('src/fonts/**/*.*', ['fonts']);
    gulp.watch('src/img/**/*.*', ['img']);
    gulp.watch('src/img/icons/*.*', ['sprite']);
    gulp.watch('src/fonts/**/*.*', ['fonts']);
    gulp.watch('src/libs/**/*.*', ['libs']);
    gulp.watch('src/mail.php', ['mail']);
});


//     // Serve files from the root of this project
gulp.task('default', ['build', 'browser-sync', 'watch']);
//     // add browserSync.reload to the tasks array to make
//     // all browsers reload after tasks are complete.
