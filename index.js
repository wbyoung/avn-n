var fs = require('fs');
var path = require('path');
var util = require('util');
var semver = require('semver');
var BPromise = require('bluebird');

var name = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).name;

var VERSION_REGEX = /(\w+)-(.+)/;

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
  var notHiddenFile = function(name) { return name[0] !== '.'; };
  if (nodeVersionsExists) {
    result = result.concat(fs.readdirSync(nodeVersions).filter(notHiddenFile));
  }
  if (iojsVersionsExists) {
    result = result.concat(fs.readdirSync(iojsVersions).filter(notHiddenFile).map(function(name) {
      return 'iojs-' + name;
    }));
  }
  if (!nodeVersionsExists && !iojsVersionsExists && simpleVersionsExists) {
    result = result.concat(fs.readdirSync(simpleVersions).filter(notHiddenFile));
  }
  return result;
};

// extract a name from a version (to support iojs)
var versionName = function(version) {
  var match = version.match(VERSION_REGEX);
  return match ? match[1] : null;
};

// extract just the version number from a version
var versionNumber = function(version) {
  var match = version.match(VERSION_REGEX);
  return match ? match[2] : version;
};

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

var installedVersion = function(matching) {
  return BPromise.resolve()
  .then(function() { return listVersions(); })
  .then(function(versions) {
    return findVersion(versions, matching);
  });
};

var match = function(version) {
  return BPromise.resolve()
  .then(function() { return installedVersion(version); })
  .then(function(use) {
    var vName = use && versionName(use);
    var vNumber = use && versionNumber(use);
    var subcommand = (vName === 'iojs') ? 'io ' : '';

    var command = util.format('n %s%s > /dev/null;', subcommand, vNumber);
    var result = { version: vNumber, command: command };
    return use ? result : BPromise.reject('no version matching ' + version);
  });
};

module.exports = {
  name: name,
  match: match,
  _findVersion: findVersion
};
