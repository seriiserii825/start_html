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
	tinypng = require('gulp-tinypng'),
	image = require('gulp-image'),
	imagemin = require('gulp-imagemin'),
	newer = require('gulp-newer'),
	cssmin = require('gulp-cssmin'),
	jsmin = require('gulp-jsmin'),
	pngquant = require('imagemin-pngquant'),
	svgmin = require('gulp-svgmin'),
	cached = require('gulp-cached'),
	filter    = require('gulp-filter'),
	svg2png   = require('gulp-svg2png'),
	svgSprite = require("gulp-svg-sprites");



/*svg-sprites
 ===============================*/ 
gulp.task('sprite-svg', function () {
	return gulp.src('src/img/icons-svg/*.svg')
		.pipe(svgSprite({
			cssFile: "../css/sprite-svg.css",
			svgPath: "../img/svg/sprite.svg",
			pngPath: "../img/svg/sprite.png"
			}))
		.pipe(gulp.dest("build/img/")) // Write the sprite-sheet + CSS + Preview 
		.pipe(filter("**/*.svg"))  // Filter out everything except the SVG file 
		.pipe(svg2png())           // Create a PNG 
		.pipe(gulp.dest('build/img/'));
});

gulp.task('svgsprite', ['sprite-svg'], function(){
	return gulp.src('build/css/sprite-svg.css')
		.pipe(cssmin({showLog: true}))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(gulp.dest('build/css/'));
	});

/*html
===============================*/
gulp.task('html', function () {
	gulp.src('src/**/*.html') // Выберем файлы по нужному пути
		.pipe(sourcemaps.init())
		.pipe(rigger()) // Прогоним через rigger
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('build/'))
		.pipe(browserSync.stream());
	// Переместим их в папку build
});

/*mail.php
===============================*/
gulp.task('mail', function () {
	gulp.src('src/mail.php') // Выберем файлы по нужному пути
		.pipe(gulp.dest('build/'))
		.pipe(browserSync.stream());
	// Переместим их в папку build
});

/*css
===============================*/
gulp.task('css', function () {
	gulp.src('src/less/pages/style.less') // Выберем наш style.less
		.pipe(sourcemaps.init())
		.pipe(less()) // Скомпилируем
		.pipe(prefixer()) // Добавим вендорные префиксы
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('build/css/'))
		.pipe(browserSync.stream())
		.pipe(cssmin({showLog: true}))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(gulp.dest('build/css/'));
});
/*head
===============================*/
gulp.task('head', function () {
	gulp.src('src/less/head_font/head.less') // Выберем наш style.less
		.pipe(sourcemaps.init())
		.pipe(less()) // Скомпилируем
		.pipe(prefixer()) // Добавим вендорные префиксы
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('build/css/'))
		.pipe(browserSync.stream())
		.pipe(cssmin({showLog: true}))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(gulp.dest('build/css/'));
});

/*js
===============================*/
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

/*min
===============================*/
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

/*libs
===============================*/
gulp.task('libs', function(){
	gulp.src('src/libs/{html5shiv/*.*,respond/*.*}')
		.pipe(gulp.dest('build/libs/'))
});

/*sprite png
===============================*/
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

/*svg
===============================*/
gulp.task('svg', function () {
	return gulp.src('src/img/*.svg')
		.pipe(svgmin({
			js2svg: {
				pretty: true
			}
		}))
		.pipe(gulp.dest('build/img/'))
});

/*img
===============================*/
gulp.task('img', function () {
	gulp.src('src/img/**/*.{jpg,png}') // Выберем наши картинки
		.pipe(newer('build/img'))
		.pipe(imagemin())
		.pipe(gulp.dest('build/img/'));
	// Переместим в build
});

/*fonts
===============================*/
gulp.task('fonts', function () {
	gulp.src('src/fonts/**/*.*') // Выберем файлы по нужному пути
		.pipe(gulp.dest('build/css/fonts'))
		.pipe(browserSync.stream());
	// Переместим их в папку build
});

/*css
===============================*/
gulp.task('fonts-less', function () {
	gulp.src('src/less/head_font/fonts.less') // Выберем наш style.less
		.pipe(sourcemaps.init())
		.pipe(less()) // Скомпилируем
		.pipe(prefixer()) // Добавим вендорные префиксы
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('build/css/'))
		.pipe(browserSync.stream())
		.pipe(cssmin({showLog: true}))
		.pipe(rename({suffix: '.min', prefix : ''}))
		.pipe(gulp.dest('build/css/'));
		
});

gulp.task('clean', function (cb) {
	rimraf('build/', cb);
});

/*build
===============================*/
gulp.task('build', [
	'fonts',
	'html',
	'css',
	'js',
	'img',
	'sprite',
	'libs',
    'head',
    'libs',
	'mail',
	'head',
	'fonts-less'
]);

/*browser-sync
===============================*/
gulp.task('browser-sync', function () {

	browserSync.init({
		proxy: "yourhome/build",
		notify: true
	});
});
//     // Serve files from the root of this project
gulp.task('default', ['build', 'browser-sync', 'watch']);



gulp.task('watch', function () {
    gulp.watch('src/**/*.html', ['html']);
    gulp.watch('src/less/{imports/,pages/}/*.less', ['css']);
    gulp.watch('src/less/head_font/fonts.less', ['fonts-less']);
    gulp.watch('src/less/head_font/head.less', ['head']);
    gulp.watch('src/js/**/*.js', ['js']);
    gulp.watch('src/fonts/**/*.*', ['fonts']);
    gulp.watch('src/img/**/*.*', ['img']);
    gulp.watch('src/img/icons/*.*', ['sprite']);
    gulp.watch('src/fonts/**/*.*', ['fonts']);
    gulp.watch('src/img/icons-svg/*.svg', ['svgsprite']);
    gulp.watch('src/mail.php', ['mail']);
});
//     // add browserSync.reload to the tasks array to make
//     // all browsers reload after tasks are complete.
