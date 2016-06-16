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
     * Creates a middleware function that can be used with application middleware methods.
     *
     * ```js
     * // Default middleware will cache all files on the `reporter.files` array (can be accessed in report functions):
     * app.preWrite(/./, app.reporter.middleware());
     *
     * // Pass a custom property string to cache files on another property:
     * app.preWrite(/./, app.reporter.middleware('templates'));
     *
     * // Pass a custom function that creates the middleware function. The function will take the reporter instance:
     * app.preWrite(/./, app.reporter.middleware(function(reporter) {
     *   var counter = 0;
     *   return function(file, next) {
     *     reporter.union('files', file);
     *     reporter.set('counter', ++counter);
     *     next():
     *   };
     * }));
     * ```
     * @name .reporter.middleware
     * @param {String|Function} `fn` Pass a property string or function that will create a middleware function. Defaults to `files`.
     * @return {Function} Function that can be used as a middleware function.
     * @api public
     */

    utils.define(reporter, 'middleware', function(fn) {
      if (typeof fn === 'function') {
        return reporter(fn);
      }
      if (typeof fn === 'string') {
        return reporter(defaultMiddleware(fn));
      }
      return reporter(defaultMiddleware('files'));
    });

    /**
     * Add a report function to the reporter with the given name. Function may take the reporter instance and options as parameters.
     *
     * ```js
     * app.reporter.add('basic', function(reporter, options) {
     *   console.log(this.files);
     * });
     * ```
     * @name .reporter.add
     * @param {String} `name` Name of the reporter
     * @param {Function} `fn` report function to run when [.reporter.report(name)](#reporterreport) is called.
     * @return {Object} `this` to enable chaining
     * @api public
     */

    utils.define(reporter, 'add', function(name, fn) {
      cache.set(['reporters', name], fn);
      return reporter;
    });

    /**
     * Run a registered report function with the given options.
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

/**
 * Default middleware function that caches files on the given property.
 */

function defaultMiddleware(prop) {
  return function(reporter) {
    return function(file, next) {
      reporter.union(prop, file);
      next();
    };
  };
};
