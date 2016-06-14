/*!
 * base-reporter (https://github.com/node-base/base-reporter)
 *
 * Copyright (c) 2016, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var utils = require('./utils');

/**
 * Exposes smart plugin for adding a `reporter` instance to a base application.
 *
 * ```js
 * app.use(reporter());
 * ```
 * @param  {Object} `config` Configuration object.
 * @return {Function} Plugin function to use with `app.use`
 * @api public
 */

module.exports = function reporter(config) {
  return function plugin(app) {
    if (!utils.isValid(this, 'base-reporter')) return;

    var options = utils.extend({}, config);
    this.define('reporter', new Reporter(this, options));
  };
};


/**
 * Reporter class for registering reporters, gathering information and running reports.
 *
 * ```js
 * var reporter = new Reporter(app);
 * ```
 * @param {Object} `app` base application instance
 * @param {Object} `options` Additional options for reporters to use.
 */

function Reporter(app, options) {
  if (!(this instanceof Reporter)) {
    return new Reporter(app, options);
  }
  utils.Base.call(this, {}, options);
  this.define('app', app);
}

/**
 * Extend Base
 */

utils.Base.extend(Reporter);

/**
 * Capture file paths going through a middleware.
 *
 * ```js
 * app.preWrite(/./, app.reporter.captureFiles());
 * ```
 * @name reporter.captureFiles
 * @return {Function} Function that can be used as a middleware function.
 * @api public
 */

Reporter.prototype.captureFiles = function() {
  var self = this;
  return function(file, next) {
    self.union('files', file.path);
    next();
  };
};

/**
 * Add a reporter function to the reporter with the given name.
 *
 * ```js
 * app.reporter.add('basic', function() {
 *   console.log(this.files);
 * });
 * ```
 * @name reporter.add
 * @param {String} `name` Name of the reporter
 * @param {Function} `reporter` Function to run when this reporter is used.
 * @return {Object} `this` to enable chaining
 * @api public
 */

Reporter.prototype.add = function(name, reporter) {
  this.set(['reporters', name], reporter);
  return this;
};

/**
 * Run a registered reporter function.
 *
 * ```js
 * app.reporter.report('basic');
 * //=> file1.js,file2.js,file3.js
 * ```
 * @name reporter.report
 * @param  {String} `name` Name of the report to run.
 * @return {Object} `this` to enable chaining
 * @api public
 */

Reporter.prototype.report = function(name) {
  var reporter = this.get(['reporters', name]);
  if (typeof reporter !== 'function') {
    throw new Error(`Unable to find reporter "${name}"`);
  }
  reporter.call(this, this);
  return this;
};

