/* jshint expr: true */
/* global beforeEach, afterEach */

var plugin = require('..');
var path = require('path');

var chai = require('chai');
var expect = chai.expect;

describe('plugin', function() {
  var prefix_ = process.env.N_PREFIX;
  var prefix = path.resolve(path.join(__dirname, 'fixtures/n-prefix'));
  beforeEach(function() { process.env.N_PREFIX = prefix; });
  afterEach(function() { process.env.N_PREFIX = prefix_; });

  it('matches exact version', function(done) {
    plugin.match('0.10.26').then(function(result) {
      expect(result).to.eql({
        version: '0.10.26',
        command: 'n 0.10.26 > /dev/null;'
      });
    })
    .done(done);
  });

  it('matches with semver syntax', function(done) {
    plugin.match('~0.11.1').then(function(result) {
      expect(result).to.eql({
        version: '0.11.13',
        command: 'n 0.11.13 > /dev/null;'
      });
    })
    .done(done);
  });

  it('chooses greatest match', function(done) {
    plugin.match('0.10').then(function(result) {
      expect(result).to.eql({
        version: '0.10.28',
        command: 'n 0.10.28 > /dev/null;'
      });
    })
    .done(done);
  });

  it('rejects versions not installed', function(done) {
    plugin.match('0.9').then(
      function() { throw new Error('Plugin should have rejected invalid version.'); },
      function(e) { expect(e).to.eql('no version matching 0.9'); })
    .done(done);
  });

  it('has fallback prefix', function(done) {
    delete process.env.N_PREFIX;
    plugin.match('0.0').then(
      function() { throw new Error('Plugin should have rejected invalid version.'); },
      function(e) { expect(e).to.eql('no version matching 0.0'); })
    .done(done);
  });
});
