/*!
 * base-reporter (https://github.com/node-base/base-reporter)
 *
 * Copyright (c) 2016, Brian Woodward.
 * Licensed under the MIT License.
 */

'use strict';

var debug = require('debug')('base-reporter');

module.exports = function(config) {
  return function(app) {
    if (this.isRegistered('base-reporter')) return;

    this.define('base-reporter', function() {
      debug('running base-reporter');
      
    });
  };
};
