/**
 *  @author   Fernando Salazar <fernando@blufish.com>
 *  @author   James Gov <james@blufish.com>
 *  @since    Tuesday, September 07, 2016
 */

"use strict";

var through = require('through2'),
	concat = require('concat-stream'),
	gUtil   = require('gulp-util'),
	fs      = require('fs');

module.exports = function(opts) {
	var _pattr    = '%%path:',
		_regex    = /%%path:\w+/g,

		_depthLimit  = 60,
		_depthCount  = 0,
		_matchCount  = 0,
		_parsedCount = 0;

	/**
	 *  @param    object file, string encoding, function cb
	 *  @return   void
	 */
	function fresh(file, encoding, cb) {
		switch(true) {

			/**
			 *  Pass along null file.
			 */
			case file.isNull():
				cb(null, file);
				break;

			/**
			 *  @todo   support stream
			 */
			case file.isStream():
				file.contents.pipe(concat(function(data) {
					try {
						file.contents = new Buffer(_parse(String(data)));

						cb(null, file);
					} catch(e) {
						cb(new gUtil.PluginError('gulp-fresh', e.message));
					}
				}));
				break;

			/**
			 *  Process file
			 */
			case file.isBuffer():

				try {
					file.contents = new Buffer(_parse(String(file.contents)));

					cb(null, file);
				} catch (e) {
					cb(new gUtil.PluginError('gulp-fresh', e.message));
				}

				break;
		}

	}

	/**
	 *  @param    string content, function handle
	 *  @return   string
	 */
	function _parse(content) {
		var matches = content.match(_regex),
			i, key;

		_depthCount ++;

		if(_depthCount >= _depthLimit)
			throw new Error('Depth Limit Reached');

		if(matches === null) {
			return content;
		} else {
			for(i = 0; i < matches.length; i++) {
				_matchCount ++;

				key = matches[i].replace(_pattr, '');

				if(typeof opts[key] === 'undefined') {
					throw new Error('Path Key Not Found: ' + key);
				} else {
					_parsedCount ++;

					content = content.replace(matches[i], fs.readFileSync(opts[key], 'utf-8'));

					if(_matchCount >= _parsedCount)
						return _parse(content);
				}
			}
		}
	}

	return through.obj(fresh);
}
