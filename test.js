'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
var routes = require('base-routes');
var reporter = require('./');
var app;

describe('base-reporter', function() {
  describe('plugin', function() {
    beforeEach(function() {
      app = new Base({isApp: true});
    });

    it('should export a function', function() {
      assert.equal(typeof reporter, 'function');
    });

    it('should only register the plugin once', function(cb) {
      var count = 0;
      app.on('plugin', function(name) {
        if (name === 'base-reporter') {
          count++;
        }
      });
      app.use(reporter());
      app.use(reporter());
      app.use(reporter());
      assert.equal(count, 1);
      cb();
    });

    it('should add a `reporter` function on the `app`', function() {
      app.use(reporter());
      assert.equal(typeof app.reporter, 'function');
    });
  });

  describe('reporter', function() {
    beforeEach(function() {
      app = new Base({isApp: true});
      app.use(reporter());
    });

    it('should call a given function passing the instance in', function() {
      app.reporter(function(inst) {
        assert(inst, 'expected an instance');
      });
    });

    it('should return a function that can be used', function() {
      var fn = app.reporter(function(inst) {
        return function(counter) {
          inst.set('counter', counter);
        };
      });
      assert.equal(typeof fn, 'function');

      var i = 0;
      fn(++i);
      fn(++i);
      fn(++i);
      assert.equal(app.reporter.cache.get('counter'), 3);
    });
  });

  describe('reporter.add', function() {
    beforeEach(function() {
      app = new Base({isApp: true});
      app.use(reporter());
    });

    it('should add a reporter to the reporters cache', function() {
      app.reporter.add('foo', function() {});
      assert.equal(typeof app.reporter.cache.reporters.foo, 'function');
    });
  });

  describe('reporter.report', function() {
    beforeEach(function() {
      app = new Base({isApp: true});
      app.use(reporter());
    });

    it('should use a registered reporter', function() {
      var count = 0;
      app.reporter.add('foo', function() {
        count++;
      });

      app.reporter.report('foo');
      assert.equal(count, 1);
    });

    it('should pass options to the report function', function() {
      var count = 0;
      app.reporter.add('foo', function(inst, options) {
        count++;
        assert(options, 'expected an options object');
        assert.equal(options.foo, 'bar');
      });

      app.reporter.report('foo', {foo: 'bar'});
      assert.equal(count, 1);
    });

    it('should extend options with plugin options to the report function', function() {
      app = new Base({isApp: true});
      app.use(reporter({foo: 'bar', bar: 'qux'}));

      var count = 0;
      app.reporter.add('foo', function(inst, options) {
        count++;
        assert(options, 'expected an options object');
        assert.deepEqual(options, {foo: 'baz', bar: 'qux', beep: 'boop'});
      });

      app.reporter.report('foo', {foo: 'baz', beep: 'boop'});
      assert.equal(count, 1);
    });

    it('should throw an error when a reporter is not registered', function(cb) {
      app.reporter.add('foo', function() {});
      try {
        app.reporter.report('bar');
        cb(new Error('expected an error'));
      } catch (err) {
        assert(err);
        assert.equal(err.message, 'Unable to find reporter "bar"');
        cb();
      }
    });
  });

  describe('repoter.middleware', function() {
    beforeEach(function() {
      app = new Base({isApp: true});
      app.use(routes());
      app.use(reporter());
    });

    it('should use the default middleware', function() {
      app.onLoad(/./, app.reporter.middleware());

      var file = {path: 'foo.hbs', content: 'foo'};
      app.handle('onLoad', file);
      assert(app.reporter.cache.files, 'expected a files property on the reporter cache');
      assert.equal(app.reporter.cache.files.length, 1);
    });

    it('should cache files on a custom property', function() {
      app.onLoad(/./, app.reporter.middleware('foo'));

      var file = {path: 'foo.hbs', content: 'foo'};
      app.handle('onLoad', file);
      assert(app.reporter.cache.foo, 'expected a foo property on the reporter cache');
      assert.equal(app.reporter.cache.foo.length, 1);
    });

    it('should make a custom middleware function', function() {
      var middleware = function(inst) {
        var counter = 0;
        return function(file, next) {
          inst.set('counter', ++counter);
          next();
        };
      };

      app.onLoad(/./, app.reporter.middleware(middleware));

      var file = {path: 'foo.hbs', content: 'foo'};
      app.handle('onLoad', file);
      assert(app.reporter.cache.counter, 'expected a counter property on the reporter cache');
      assert.equal(app.reporter.cache.counter, 1);
    });

    it('should let custom middleware and custom reporter functions to work together', function() {
      // custom middleware function that increments a counter
      app.onLoad(/./, app.reporter.middleware(function(inst) {
        var counter = 0;
        return function(file, next) {
          inst.set('counter', ++counter);
          next();
        };
      }));

      // custom report that does the test asserts
      app.reporter.add('assert', function(inst) {
        assert(inst.counter, 'expected a counter property on the reporter cache');
        assert.equal(inst.counter, 1);
      });

      // handle the onLoad middleware
      var file = {path: 'foo.hbs', content: 'foo'};
      app.handle('onLoad', file);

      // run the assert report that will do the test asserts
      app.reporter.report('assert');
    });
  });
});
