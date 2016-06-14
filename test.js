'use strict';

require('mocha');
var assert = require('assert');
var Base = require('base');
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

    it('should add a `reporter` object on the `app`', function() {
      app.use(reporter());
      assert.equal(typeof app.reporter, 'object');
    });
  });

  describe('reporter', function() {
    beforeEach(function() {
      app = new Base({isApp: true});
      app.use(reporter());
    });

    it('should add a reporter to the reporters cache', function() {
      app.reporter.add('foo', function() {});
      assert.equal(typeof app.reporter.reporters.foo, 'function');
    });

    it('should use a registered reporter', function() {
      var count = 0;
      app.reporter.add('foo', function() {
        count++;
      });

      app.reporter.report('foo');
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
});
