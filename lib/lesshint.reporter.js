/*eslint no-console: 0*/

'use strict';
var chalk		= require('chalk'),
	gutil		= require('gulp-util'),
	notifier	= require('node-notifier');

var beep = gutil.beep;

module.exports = {
    name: 'custom',
    report: function report (results) {
		var warnings = 0;
		var errors = 0;
        results.forEach(function (result) {
            var output = '';

            if (result.severity === 'error') {
                output += chalk.red('Error: ');
				errors++;
            } else {
                output += chalk.yellow('Warning: ');
				warnings++;
            }

            output += chalk.cyan(result.file) + ': ';

            if (result.line) {
                output += chalk.magenta('line ' + result.line) + ', ';
            }

            if (result.column) {
                output += chalk.magenta('col ' + result.column) + ', ';
            }

            output += chalk.green(result.linter) + ': ';
            output += result.message;

            console.log(output);
        });
		var plural;
		if (errors) {
			plural = errors === 1 ? '' : 's';
			notifier.notify({
				'title': 'LESS error'+plural,
				'message': 'You have ' + errors + ' LESS error'+plural+'!'
			});
			beep();
		}
		if (warnings) {
			plural = warnings === 1 ? '' : 's';
			notifier.notify({
				'title': 'LESS warning'+plural,
				'message': 'You have ' + warnings + ' LESS warning'+plural+'!'
			});
			beep();
		}
    }
};
