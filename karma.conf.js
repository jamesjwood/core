


/*global module */
/*global LOG_INFO */

module.exports = function(config) {
	'use strict';
    config.set({
		browsers : ['Safari'],
		frameworks: ['mocha'],
		basePath : 'stage/',
		files: [
			'test.js'
		]
	});
};