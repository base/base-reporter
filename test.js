'use strict';

require('mocha');
var assert = require('assert');
var baseReporter = require('./');

describe('base-reporter', function() {
  it('should export a function', function() {
    assert.equal(typeof baseReporter, 'function');
  });

  it('should export an object', function() {
    assert(baseReporter);
    assert.equal(typeof baseReporter, 'object');
  });

  it('should throw an error when invalid args are passed', function(cb) {
    try {
      baseReporter();
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected first argument to be a string');
      assert.equal(err.message, 'expected callback to be a function');
      cb();
    }
  });
});
