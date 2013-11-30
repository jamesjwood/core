/**
 * Created with JetBrains WebStorm.
 * User: jameswood
 * Date: 31/10/2012
 * Time: 09:42
 * To change this template use File | Settings | File Templates.
 */
/*jslint node: true */
/*global describe */
/*global it */
/*global before */
/*global after */


var assert = require('assert');
var events = require('events');
var utils = require('utils');
var masterLog = utils.log().wrap('core');

var lib = require('./index.js');

if (typeof process.env.COVERAGE !== 'undefined') {
  //lib = require('./../../../lib-cov/shared/core.js');
  masterLog = utils.log.fake();
}

describe('core', function () {
  'use strict';
    
  process.env.LOG = 'false';

  it('1: requireDefined: should throw error if property is undefined', function (done) {
    assert.throws(function () {
      lib.requireDefined('name', undefined);
    });
    done();
  });

  it('2: requireDefined: should not throw error if property is defined', function (done) {
    assert.doesNotThrow(function () {
      lib.requireDefined('name', {});
    });
    done();
  });

  it('3: requireDefined: should not throw error if property is null', function (done) {
    assert.doesNotThrow(function () {
      lib.requireDefined('name', null);
    });
    done();
  });
  it('4: requireNotNull: should throw error if property is undefined', function (done) {
    assert.throws(function () {
      lib.requireNotNull('name', undefined);
    });
    done();
  });
  it('5: requireNotNull: should throw error if property is null', function (done) {
    assert.throws(function () {
      lib.requireNotNull('name', null);
    });
    done();
  });

  it('6: requireNotNull: should not throw error if property is not null', function (done) {
    assert.doesNotThrow(function () {
      lib.requireNotNull('name', {});
    });
    done();
  });

  it('7: cb: should catch errors and pass back', function (done) {
    var argIn = {};
    var errorIn = new Error('message');
    var wrappedFunction = lib.cb(function (error) {
      assert.equal(error, errorIn);
      done();
    }, function (argPassed) {
      assert.ifError(argPassed);
    });
    wrappedFunction(errorIn, argIn);
  });
  it('8: cb: should pass through if no errors', function (done) {
    var argIn = {};
    var errorIn = new Error('message');
    var wrappedFunction = lib.cb(function (error) {

    }, function (arg1, arg2) {
      assert.ifError(arg2);
      assert.equal(arg1, argIn);
      done();
    });
    wrappedFunction(null, argIn);
  });

  it('9: listWithPosition: should be able to create a viewStack and add a view', function (done) {
    var controller = lib.arrayWithPosition();

    var view1 = {
      name: 1,
      dispose: function () {},
      run: function () {}
    };
    var view2 = {
      name: 2,
      dispose: function () {},
      run: function () {}
    };

    controller.push(view1);
    assert.equal(null, controller.atPosition(), "1");
    controller.next();
    assert.equal(controller.atPosition(), view1, "2");
    controller.push(view2);
    assert.equal(controller.atPosition(), view1, "3");
    controller.last();
    assert.equal(controller.atPosition(), view2, "4");
    var out = controller.pop();
    assert.equal(out, view2);
    assert.equal(controller.atPosition(), view1, "5");
    controller.push(view2);
    controller.next();
    assert.equal(controller.atPosition(), view2, "6");
    controller.previous();
    assert.equal(controller.atPosition(), view1, "7");
    controller.position = 0;
    assert.equal(controller.atPosition(), view1, "8");
    assert.equal(controller.position, 0, "9");
    controller.position = 1;
    assert.equal(controller.atPosition(), view2, "10");
    assert.equal(controller.position, 1, "11");


    var next = function (propertyName) {
      if (propertyName === 'position') {
        controller.removeListener('changed', next);
        controller.removeFromPosition();
        assert.equal(1, controller.length, "12");
        controller.previous();
        assert.equal(0, controller.position, "13");
        controller.dispose();
        done();
      }
    };

    controller.on('changed', next);
    controller.previous();
  });

  it('10: addProperty: plain object', function (done) {
    var that = new events.EventEmitter();
    lib.addProperty(that, 'name', 'hello');
    assert.equal(that.name, 'hello');
    that.name = 'test';
    assert.equal(that.name, 'test');
    done();
  });

  it('11: addProperty: null value', function (done) {
    var that = new events.EventEmitter();
    lib.addProperty(that, 'name');
    assert.notEqual(typeof that.name, 'undefined');
    done();
  });

  it('12: addPropertyUsingGetSet', function (done) {
    // must be a DOM object (even if it's not a real tag) attached to document
    var myObject = {}; //document.createElement('fake');
    //document.body.appendChild(myObject);
    // create property
    myObject.firstName = 'John';
    myObject.lastName = 'Dyer';
    lib.addPropertyUsingGetSet(myObject, 'fullname', function () {
      return this.firstName + ' ' + this.lastName;
    }, function (value) {
      var parts = value.split(' ');
      this.firstName = parts[0];
      this.lastName = (parts.length > 1) ? parts[1] : '';
    });
    assert.equal(myObject.fullname, 'John Dyer');
    myObject.fullname = 'james wood';
    assert.equal(myObject.firstName, 'james');
    assert.equal(myObject.lastName, 'wood');
    done();
  });

  it('13: addProperty: custom access', function (done) {
    var that = new events.EventEmitter();
    var deflated = {
      custom: 'test'
    };


    var access = 'writeonly';
    lib.addProperty(that, 'name', undefined, deflated, function () {
      return access;
    });


    that.name = 'hello';
    assert.throws(function () {
      var t = that.name;
    }, 'should throw error when reading writeonly');

    access = 'readonly';
    assert.throws(function () {
      that.name = 'john';
    }, 'should throw error when writing readonly');
    done();
  });

  it('14: eventedArray', function (done) {
    var t = lib.eventedArray();

    var f = function () {
      t.removeListener('changed', f);
      t.on('changed', function () {
        t.dispose();
        done();
      });
      t.pop();

    };
    t.on('changed', f);
    t.push(1);
  });

  it('15: runOnceFunction, should return the same answer to multiple calls', function (done) {
    var mylog = masterLog.wrap('15');
    var onDone = function (error) {
      if (error) {
        mylog.error(error);
      }
      done(error);
    };

    var count =0;
    var answer;
    var myOnceFunction = function(a, b, cbk){
      count ++;
      answer = a+b;
      cbk(undefined, answer);
    };
    var rof = lib.runOnceFunction(myOnceFunction);
    rof(3, 5, utils.cb(onDone, function(result){
      assert.equal(8, result);
      assert.equal(1, count);
      rof(3, 5, utils.cb(onDone, function(result2){
        assert.equal(8, result2);
        assert.equal(1, count);
        onDone();
      }));
    }));
  });

    it('16: runOnceFunction, should only call once', function (done) {
    var mylog = masterLog.wrap('16');
    var onDone = function (error) {
      if (error) {
        mylog.error(error);
      }
      done(error);
    };

    var count =0;
    var answer;
    var myOnceFunction = function(a, b, cbk){
      count ++;
    };
    var rof = lib.runOnceFunction(myOnceFunction);
    rof(3, 5, utils.cb(onDone, function(result){
    }));
    rof(3, 5, utils.cb(onDone, function(result2){
    }));
    assert.equal(1, count);
    onDone();
  });

  it('17: runOnceFunction, should call back all callers', function (done) {
    var mylog = masterLog.wrap('16');
    var onDone = function (error) {
      if (error) {
        mylog.error(error);
      }
      done(error);
    };

    var count =0;
    var answer;
    var call;
    var myOnceFunction = function(a, b, cbk){
      call= cbk;
    };

    var rof = lib.runOnceFunction(myOnceFunction);
    rof(3, 5, function(result){
      count++;
    });
    rof(3, 5, function(result2){
      count++;
    });
    call(undefined, 8);
    assert.equal(2, count);
    onDone();
  });

});