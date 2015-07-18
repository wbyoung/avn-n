'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var semver = require('semver');
var Promise = require('bluebird');
var name = require('./package.json').name;

var VERSION_REGEX = /(\w+)-(.+)/;

/**
 * List all versions.
 *
 * Note: this method is currently implemented using `*Sync` methods.
 *
 * @private
 * @function
 * @return {Array.<Version>}
 */
var listVersions = function() {
  // find all of the versions of node installed by n.
  var result = [];
  var prefix = process.env.N_PREFIX || '/usr/local';
  var nodeVersions = path.join(prefix, 'n/versions/node');
  var nodeVersionsExists = fs.existsSync(nodeVersions);
  var iojsVersions = path.join(prefix, 'n/versions/io');
  var iojsVersionsExists = fs.existsSync(iojsVersions);
  var simpleVersions = path.join(prefix, 'n/versions');
  var simpleVersionsExists = fs.existsSync(simpleVersions);
  /** local */
  var notHiddenFile = function(name) { return name[0] !== '.'; };
  if (nodeVersionsExists) {
    result = result.concat(fs.readdirSync(nodeVersions)
      .filter(notHiddenFile));
  }
  if (iojsVersionsExists) {
    result = result.concat(fs.readdirSync(iojsVersions)
      .filter(notHiddenFile)
      .map(function(name) { return 'iojs-' + name; }));
  }
  if (!nodeVersionsExists && !iojsVersionsExists && simpleVersionsExists) {
    result = result.concat(fs.readdirSync(simpleVersions)
      .filter(notHiddenFile));
  }
  return result;
};

/**
 * Extract a name from a version (to support iojs)
 *
 * @private
 * @function
 * @return {Promise}
 */
var versionName = function(version) {
  var match = version.match(VERSION_REGEX);
  return match ? match[1] : null;
};

/**
 * Extract just the version number from a version.
 *
 * @private
 * @function
 * @param {String} version
 * @return {String}
 */
var versionNumber = function(version) {
  var match = version.match(VERSION_REGEX);
  return match ? match[2] : version;
};

/**
 * Find a version.
 *
 * @param {Array.<String>} versions
 * @param {String} matching
 * @return {String}
 */
var findVersion = function(versions, matching) {
  var highestMatch = null;

  var mName = versionName(matching);
  var mNumber = versionNumber(matching);

  versions.forEach(function(v) {
    var vName = versionName(v);
    var vNumber = versionNumber(v);

    if (vName === mName && semver.satisfies(vNumber, mNumber)) {
      if (!highestMatch) { highestMatch = v; }
      else if (semver.gt(vNumber, versionNumber(highestMatch))) {
        highestMatch = v;
      }
    }
  });
  return highestMatch;
};

/**
 * Get installed version matching a given version.
 *
 * @param {String} matching
 * @return {Promise}
 */
var installedVersion = function(matching) {
  return Promise.resolve()
  .then(function() { return listVersions(); })
  .then(function(versions) {
    return findVersion(versions, matching);
  });
};

/**
 * Match a specific version.
 *
 * @param {String} version
 * @return {Promise}
 */
var match = function(version) {
  return Promise.resolve()
  .then(function() { return installedVersion(version); })
  .then(function(use) {
    var vName = use && versionName(use);
    var vNumber = use && versionNumber(use);
    var subcommand = (vName === 'iojs') ? 'io ' : '';

    var command = util.format('n %s%s > /dev/null;', subcommand, vNumber);
    var result = { version: vNumber, command: command };
    return use ? result :
      Promise.reject(new Error('no version matching ' + version));
  });
};

module.exports = {
  name: name,
  match: match,
  _findVersion: findVersion,
};
