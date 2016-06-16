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
    var cache = new Reporter(this, options);
    var reporter = function(fn) {
      if (typeof fn !== 'function') {
        throw new Error('expected "fn" to be a function');
      }
      return fn.call(cache, cache);
    };

    utils.define(reporter, 'cache', cache);

    /**
     * Capture file paths going through a middleware.
     *
     * ```js
     * app.preWrite(/./, app.reporter.middleware());
     * ```
     * @name .reporter.middleware
     * @return {Function} Function that can be used as a middleware function.
     * @api public
     */

    utils.define(reporter, 'middleware', function(fn) {
      if (typeof fn === 'string') {
        return reporter(propMiddleware(fn));
      }
      if (typeof fn === 'function') {
        return reporter(fn);
      }
      return reporter(defaultMiddleware);
    });

    /**
     * Add a reporter function to the reporter with the given name.
     *
     * ```js
     * app.reporter.add('basic', function() {
     *   console.log(this.files);
     * });
     * ```
     * @name .reporter.add
     * @param {String} `name` Name of the reporter
     * @param {Function} `reporter` Function to run when this reporter is used.
     * @return {Object} `this` to enable chaining
     * @api public
     */

    utils.define(reporter, 'add', function(name, fn) {
      cache.set(['reporters', name], fn);
      return reporter;
    });

    /**
     * Run a registered reporter function with the given options.
     *
     * ```js
     * app.reporter.report('basic', {foo: 'bar'});
     * //=> file1.js,file2.js,file3.js
     * ```
     * @name .reporter.report
     * @param  {String} `name` Name of the report to run.
     * @return {Object} `this` to enable chaining
     * @api public
     */

    utils.define(reporter, 'report', function(name, options) {
      var fn = cache.get(['reporters', name]);
      if (typeof fn !== 'function') {
        throw new Error(`Unable to find reporter "${name}"`);
      }

      var opts = utils.extend({}, cache.options, options);
      fn.call(cache, cache, opts);
      return reporter;
    });

    this.define('reporter', reporter);
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

function defaultMiddleware(reporter) {
  return function(file, next) {
    reporter.union('files', file);
    next();
  };
};

function propMiddleware(prop) {
  return function(reporter) {
    return function(file, next) {
      reporter.union(prop, file);
      next();
    };
  };
};
