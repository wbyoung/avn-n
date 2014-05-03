var q = require('q');
var fs = require('fs');
var path = require('path');
var util = require('util');
var semver = require('semver');

exports.name = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).name;

var listVersions = function() {
  // find all of the versions of node installed by n.
  var file = path.join(process.env.N_PREFIX || '/usr/local', 'n/versions');
  return fs.readdirSync(file).filter(function(name) {
    return name[0] !== '.';
  });
};

var installedVersion = function(matching) {
  var version = null;
  listVersions().forEach(function(v) {
    if (semver.satisfies(v, matching)) {
      if (!version || semver.gt(version, v)) {
        version = v;
      }
    }
  });
  return version;
};

exports.match = function(version) {
  return q()
  .then(function() { return installedVersion(version); })
  .then(function(use) {
    var command = util.format('n %s > /dev/null;', use);
    var result = { version: use, command: command };
    return use ? result : q.reject('no version matching ' + version);
  });
};
