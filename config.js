'use strict';

// Dependencies
var path = require('path');
var fs   = require('fs');

// Module variables
var home            = process.env.HOME || process.env.USERPROFILE;
var configDirectory = path.join(home, '.yeoman-trs-wordpress');
var configPath      = path.join(configDirectory, 'config.json');

/**
 * Read the config file and trigger the callback function with errors and data
 * as parameters.
 * @param {!function} cb
 */
exports.getConfig = function (cb) {
  fs.readFile(configPath, 'utf8', function (err, data) {
    if (err) {
      cb(err);
    } else {
      cb(false, JSON.parse(data));
    }
  });
};

/**
 * Create the config file
 * @param {!object} values
 * @param {!function} cb
 */
exports.createConfig = function (values, cb) {
  var config = {
    authorName : values.authorName || 'theREDspace',
    authorURI :  values.authorURI || 'http://www.redspace.com',
    theme :   values.themeUrl || 'https://github.com/theREDspace/wp_starter'
  };

  fs.mkdir(configDirectory, '0777', function () {
    fs.writeFile(configPath, JSON.stringify(config), 'utf8', cb);
  });
};
