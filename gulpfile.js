/*
	jslint
	notify for jslint
	
	//бейбл
	//полифиллер
	
	multisprites - одинаковые имена файлов
	svg multisprites
*/

'use strict';


/* ******* */
/* Plugins */
/* ******* */

var gulp		= require('gulp'),
	gulpsync	= require('gulp-sync')(gulp),
	gutil		= require('gulp-util'),
	watch		= require('gulp-watch'),
	concat		= require('gulp-concat'),
	plumber		= require('gulp-plumber'),
	notify		= require("gulp-notify"),
	notifier	= require('node-notifier'),
	buffer		= require('vinyl-buffer'),
	prefixer	= require('gulp-autoprefixer'),
	include		= require('gulp-file-include'),
	sourcemaps	= require('gulp-sourcemaps'),
	rimraf		= require('gulp-rimraf'),
	connect		= require('gulp-connect'),
	htmlhint	= require('gulp-htmlhint'),
	less		= require('gulp-less'),
	lesshint	= require('gulp-lesshint'),
	cleanCSS	= require('gulp-clean-css'),
	csslint		= require('gulp-csslint'),
	chalk		= require('chalk'),
	babel		= require('gulp-babel'),
	uglify		= require('gulp-uglify'),
	pngquant	= require('imagemin-pngquant'),
	imagemin	= require('gulp-imagemin'),
	spritesmith	= require('gulp.spritesmith-multi'),
	svgSprite	= require('gulp-svg-sprites'),
	filter		= require('gulp-filter'),
	raster		= require('gulp-raster'),
	rename		= require('gulp-rename');

var beep = gutil.beep;


/* ****** */
/* Config */
/* ****** */

// Path
var path = {
	build: { //Тут мы укажем куда складывать готовые после сборки файлы
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		minjs: 'build/minified/js/',
		mincss: 'build/minified/css/',
		img: 'build/img/',
		sprite: 'build/img/sprite',
		fonts: 'build/fonts/'
	},
	src: { //Пути откуда брать исходники
		html: 'source/*.html', //Синтаксис source/*.html говорит gulp что мы хотим взять все файлы с расширением .html
		js: 'source/js/js.js',
		style: 'source/css/style.less',
		stylesToValidate: 'source/css/partials/**/*.less',
		spritestyle: 'source/css/generated/',
		img: 'source/img/common/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
		sprite: 'source/img/sprite/',
		fonts: 'source/fonts/**/*.*'
	},
	watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
		html: 'source/**/*.html',
		js: 'source/js/**/*.js',
		style: 'source/css/**/*.*ss',
		img: 'source/img/common/**/*.*',
		fonts: 'source/fonts/**/*.*',
	},
	clean: {
		build: './build',
		style: 'source/css/generated'
	}
};

// dev server
var serverConfig = {
	port: 9999,
	livereload: true,
	root: path.build.html
};

// AutopPrefixer config
var prefixerConfig = {
	browsers: ['> 1%','last 6 versions'],
	cascade: false
}


/* **************** */
/* Errors reporters */
/* **************** */

// HTML
var onHtmlError = function(err) {
	notify.onError({
		title:		"HTML error",
		subtitle:	"Failure!",
		message:	"<%= error.message %>",
		sound:		"Beep"
	})(err)
};

// HTML hint reporter
var htmlHintReporter = function(file) {
	var errorCount = file.htmlhint.errorCount;
	var plural = errorCount === 1 ? '' : 's';
	
	notifier.notify({
		'title': 'HTML error'+plural,
		'message': 'You have ' + errorCount + ' HTML error'+plural+'!'
	});
	beep();

	console.log(chalk.cyan(errorCount) + ' error' + plural + ' found in ' + chalk.magenta(file.path));

	getMessagesForFile(file).forEach(function (data) {
		console.log(data.message);
		console.log(data.evidence);
	});
}
function getMessagesForFile(file) {
	'use strict';
	return file.htmlhint.messages.map(function (msg) {
		var message = msg.error;
		var evidence = message.evidence;
		var line = message.line;
		var col = message.col;
		var detail;

		if (line) {
			detail = chalk.yellow('L' + line) + chalk.red(':') + chalk.yellow('C' + col);
		} else {
			detail = chalk.yellow('GENERAL');
		}

		if (col === 0) {
			evidence = chalk.red('?') + evidence;
		} else if (col > evidence.length) {
			evidence = chalk.red(evidence + ' ');
		} else {
			evidence = evidence.slice(0, col - 1) + chalk.red(evidence[col - 1]) + evidence.slice(col);
		}

		return {
			message: chalk.red('[') + detail + chalk.red(']') + chalk.yellow(' ' + message.message) + ' (' + message.rule.id + ')',
			evidence: evidence
		};
	});
}

// Styles
var onStyleError = function(err) {
	console.log(err);
	notify.onError({
		title:		"Styles error",
		subtitle:	"Failure!",
		message:	"<%= error.message %>",
		sound:		"Beep"
	})(err)
};

// CSSlint reporter
var cssLintReporter = {
	totalErrors: 0,
	totalWarnings: 0,
	
	id: 'string', // Name passed to csslint.formatter 
	name: 'st',
	startFormat: function() {
		this.totalErrors = 0;
		this.totalWarnings = 0;

		return '';
	}, // Called before parsing any files, should return a string 
	endFormat: function() {
		var warnings = this.totalWarnings;
		var errors = this.totalErrors;
		if (errors)
			notifier.notify({
				'title': 'CSS errors',
				'message': 'You have ' + errors + ' CSS errors!'
			});
		if (warnings)
			notifier.notify({
				'title': 'CSS warnings',
				'message': 'You have ' + warnings + ' CSS warnings!'
			});
		return '';
	}, // Called after parsing all files, should return a string 
	formatResults: function (results, filename, options) {
		var messages = results.messages;
		var _this = this;
		
		messages.map(function (_ref3) {
			var output = "";
			var message = _ref3.message;
			var line = _ref3.line;
			var col = _ref3.col;
			var type = _ref3.type;
			var isWarning = type === 'warning';
			
			var fileNameArr = filename.replace(/[\\]/g,"/").split("/");
			var fileName = fileNameArr[fileNameArr.length - 1];
			
			if (isWarning) {
			  _this.totalWarnings++;
			} else {
			  _this.totalErrors++;
			}

			output += ( isWarning ? chalk.yellow(type) : chalk.red(type) ) + ": ";
			output += chalk.cyan(fileName) + ": ";
			output += chalk.magenta('line ' + line) + ", " + chalk.magenta('col ' + col) + ", ";
			output += chalk.green(_ref3.rule.id) + ": ";
			output += message;
			console.log(output);
		});
	} // Called with a results-object per file linted. Optionally called with a filename, and options passed to csslint.formatter(*formatter*, *options*) 
};

// Scripts
var onScriptError = function(err) {
	console.log(err);
	notify.onError({
		title:    "Script error",
		subtitle: "Failure!",
		message:  "<%= error.message %>",
		sound:    "Beep"
	})(err)
};


/* ***** */
/* TASKS */
/* ***** */

// clean project
gulp.task('clean', function () {
	return gulp.src([path.clean.build,path.clean.style])
		.pipe(rimraf());
});

// build fonts
gulp.task('fonts:build', function() {
	gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts))
});

// build HTML
gulp.task('html:build', function () {
	gulp.src(path.src.html)								// Выберем файлы по нужному пути
		//.pipe(plumber({errorHandler : onHtmlError}))	// Перехватим ошибки
		.pipe(include())								// Прогоним через file include
		.pipe(htmlhint())								// Проверим валидность
		.pipe(htmlhint.reporter(htmlHintReporter))		// Show validation info
		.pipe(gulp.dest(path.build.html))				// Выплюнем их в папку build
		.pipe(connect.reload());						// И перезагрузим наш сервер для обновлений
});

// check styles
gulp.task('style:check', function(){
	gulp.src(path.src.stylesToValidate)
		.pipe(lesshint({					// проведем валидацию less
			"propertyOrdering": {
				"enabled": false
			}
		}))
		.pipe(lesshint.reporter("lib/lesshint.reporter.js"))
		.pipe(less())						// скомпилируем LESS
		.pipe(csslint({						// проведем валидацию CSS
			'adjoining-classes': false,
			'order-alphabetical': false,
			'unqualified-attributes': false,
			'box-sizing': false,
			'box-model': false
		}))
		.pipe(csslint.formatter(cssLintReporter));
});

// build CSS
gulp.task('style:build', function () {
	// build
	gulp.src(path.src.style)
		.pipe(plumber({errorHandler : onStyleError}))
		.pipe(include())
		.pipe(sourcemaps.init())
		.pipe(less())						// скомпилируем LESS
		.pipe(prefixer(prefixerConfig))		// добавим вендорные префиксы
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(path.build.css))	// выплюнем неминифицырованый файл
		.pipe(cleanCSS({					// минифицируем
			compatibility: 'ie8',
			keepSpecialComments: 0,
			roundingPrecision: 3
		}))
		.pipe(gulp.dest(path.build.mincss))	// выплюнем минифицырованный файл
		.pipe(connect.reload());
});

// build JS
gulp.task('js:build', function () {
	gulp.src(path.src.js)
		.pipe(plumber({errorHandler : onScriptError}))
		.pipe(include())
		.pipe(sourcemaps.write())
		.pipe(sourcemaps.init())
		.pipe(babel({
			presets: ['es2015']
		}))
		.pipe(gulp.dest(path.build.js))		// выплюнем неминифицырованый файл
		.pipe(uglify())						// Сожмем JS
		.pipe(gulp.dest(path.build.minjs))	// выплюнем минифицырованный файл
		.pipe(connect.reload());
		
	//бейбл
	//полифиллер
});

// build images
gulp.task('image:build', function () {
	return gulp.src(path.src.img) //Выберем наши картинки
		.pipe(imagemin({ // compress them
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.build.img)) // And put into build
		.pipe(connect.reload());
});

// build sprite
// use inner folders for different sprites
// All img names must vary
gulp.task('image:sprite', function () {
	var spriteData = gulp.src([path.src.sprite + '**/*.png', path.src.sprite + '**/*.gif', path.src.sprite + '**/*.jpg', path.src.sprite + '**/*.jpeg'])
	.pipe(spritesmith({
		spritesmith: function (options, sprite, icons) {
			options.cssTemplate = '';
			options.cssFormat = 'less';
			options.cssName = sprite + '.less';
			options.imgName = sprite + '.png';
			options.imgPath = 'img/sprite/' + options.imgName;
		}
	}));
	
	// Pipe image stream through image optimizer and onto disk
	var imgStream = spriteData.img
		// DEV: We must buffer our stream into a Buffer for `imagemin`
		.pipe(buffer())
		.pipe(imagemin({ // compress them
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.build.sprite));

	return spriteData.css.pipe(gulp.dest(path.src.spritestyle))	// save styles
	.pipe(connect.reload());
});

// build svg sprites
gulp.task('image:svgsprite', function () {
	return gulp.src(path.src.sprite + '*.svg')
		.pipe(svgSprite({
			cssFile: path.src.spritestyle + 'sprite-svg.css',
			svg: {
				sprite: path.build.sprite + '/sprite.svg'
			},
			preview: false,
			svgPath: '../img/sprite/sprite.svg',
			pngPath: '../img/sprite/sprite-svg.png',
			padding: 1,
			common: 'ico-svg'
		}))
		.pipe(gulp.dest(''))
		// png fallback
		.pipe(filter("**/*.svg"))
		.pipe(raster())
		.pipe(rename({extname: '-svg.png'}))
		.pipe(gulp.dest(''))
		.pipe(connect.reload());
});

// start all image functions
gulp.task('image', [
	'image:build',
	'image:sprite',
	'image:svgsprite'
]);

// Run server
gulp.task('runserver', function() {
	connect.server(serverConfig);
});

// Watch changes
gulp.task('watch', function () {
	// fonts
	watch([path.watch.fonts], function(event, cb) {
		gulp.start('fonts:build');
	});
	
	// html
	watch([path.watch.html], function(event, cb) {
		gulp.start('html:build');
	});
	
	// css
	watch([path.watch.style], function(event, cb) {
		gulp.start('style:check');
		gulp.start('style:build');
	});
	
	// JS
	watch([path.watch.js], function(event, cb) {
		gulp.start('js:build');
	});
	
	// images
	watch([path.watch.img], function(event, cb) {
		gulp.start('image:build');
	});
	
	// sprites
	watch([path.src.sprite + '*.png', path.src.sprite + '*.gif', path.src.sprite + '*.jpg', path.src.sprite + '*.jpeg'], function(event, cb) {
		gulp.start('image:sprite');
	});
	
	// svg sprite
	watch([path.src.sprite + '*.svg'], function(event, cb) {
		gulp.start('image:svgsprite');
	});
});


/* ********* */
/* Start All */
/* ********* */

gulp.task('step1', ['clean', 'style:check']);
gulp.task('step2', ['step21','step22']);
gulp.task('step21', ['fonts:build', 'html:build', 'js:build']);
gulp.task('step22', gulpsync.sync(['image', 'style:build']));

// Default task
gulp.task('default', gulpsync.sync(['step1','step2','runserver','watch']));