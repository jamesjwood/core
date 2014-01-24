/*global window */
/*global $ */
/*global exports */
/*global require */
/*global browser: true, devel: true , nonstandard: true, jquery:true */

var events = require('events');
var listbroCore = exports;
var utils = require('tsuju-utils');

var MODULE_NAME = 'core';

exports.requireDefined = function (nameOfObject, object) {
  "use strict";

  if (typeof object === 'undefined') {
    throw new Error(nameOfObject + ' was undefined');
  }
};

exports.requireNotNull = function (nameOfObject, object) {
  "use strict";
  exports.requireDefined(nameOfObject, object);
  if (object === null) {
    throw new Error(nameOfObject + ' was null');
  }
};

exports.requireDefinedOn = function (a) {
  "use strict";
  exports.requireNotNull("a.on", a.on);
  exports.requireNotNull("a.name", a.name);
  exports.requireDefined(a.name, a.on);
};

exports.requireNotNullOn = function (a) {
  "use strict";
  exports.requireNotNull("a.on", a.on);
  exports.requireNotNull("a.name", a.name);
  exports.requireNotNull(a.name, a.on);
};

exports.eventedArray = function () {
  "use strict";

  var array = [];
  var basePush = array.push;
  var basePop = array.pop;


  array.push = function () {
    var result = Array.prototype.push.apply(this, arguments);
    array.emit('changed', 'length');
    array.emit('added', [array.length - 1]);
    return result;
  };
  array.pop = function () {
    var result = Array.prototype.pop.apply(this, arguments);
    array.emit('changed', 'length');
    array.emit('removed', [array.length - 1]);
    return result;
  };



  var emitter = new events.EventEmitter();

  array.on = emitter.on;
  array.emit = emitter.emit;
  array.addListener = emitter.addListener;
  array.once = emitter.once;
  array.removeListener = emitter.removeListener;
  array.removeAllListeners = emitter.removeAllListeners;
  array.listeners = emitter.listeners;


  array.dispose = function () {
    array.removeAllListeners();
  };
  return array;
};



exports.arrayWithPosition = function () {
  "use strict";

  var that = exports.eventedArray();

  var _position = -1;

  listbroCore.addPropertyUsingGetSet(that, 'position', function () {
    return _position;
  }, function (pos) {
    if (pos > -2) {
      if (that.length > pos) {
        if (pos !== _position) {
          _position = pos;
          that.emit('changed', 'position');
        }
      }
    }
  });

  that.atPosition = function () {
    if (that.length > 0 && that.position > -1) {
      if (that.length > that.position) {
        return that[that.position];
      }
      else {
        return null;
      }
    }
    else {
      return null;
    }
  };

  that.next = function () {
    if (that.position < that.length - 1) {
      that.position++;
    }
  };

  that.previous = function () {
    if (that.position > 0) {
      that.position--;
    }
  };

  that.last = function () {
    for (var i = that.position + 1; i < that.length; i++) {
      that.next();
    }
  };

  that.first = function () {
    for (var i = 0; i < that.position; i++) {
      that.previous();
    }
  };

  that.removeFromPosition = function () {
    for (var i = that.position + 1; i < that.length; i++) {
      that.pop();
    }
  };

  var update = function (propertyName) {
    if (propertyName === 'length') {
      if (that.length <= that.position) {
        that.position = that.length - 1;
      }
    }
  };

  that.on('changed', update);
  return that;
};

// Super amazing, cross browser property function, based on http://thewikies.com/
exports.addPropertyUsingGetSet = function (obj, name, onGet, onSet) {
  "use strict";
  // wrapper functions
  var oldValue = obj[name];
  var getFn = function () {
    return onGet.apply(obj, [oldValue]);
  };
  var setFn = function (newValue) {
    if (typeof onSet === 'undefined') {
      throw new Error('readonly');
    }
    else
    {
      oldValue = onSet.apply(obj, [newValue]);
      return;
    }
  };

  // Modern browsers, IE9+, and IE8 (must be a DOM object),
  if (Object.defineProperty) {

    Object.defineProperty(obj, name, {
      get: getFn,
      set: setFn
    });

    // Older Mozilla
  } else if (obj.__defineGetter__) {

    obj.__defineGetter__(name, getFn);
    obj.__defineSetter__(name, setFn);

    // IE6-7
    // must be a real DOM object (to have attachEvent) and must be attached to document (for onpropertychange to fire)
  } else {

    var onPropertyChange = function (e) {

      if (event.propertyName == name) {
        // temporarily remove the event so it doesn't fire again and create a loop
        obj.detachEvent("onpropertychange", onPropertyChange);

        // get the changed value, run it through the set function
        var newValue = setFn(obj[name]);

        // restore the get function
        obj[name] = getFn;
        obj[name].toString = getFn;

        // restore the event
        obj.attachEvent("onpropertychange", onPropertyChange);
      }
    };

    obj[name] = getFn;
    obj[name].toString = getFn;

    obj.attachEvent("onpropertychange", onPropertyChange);

  }
};


exports.updatePrivateValue = function (privateObject, publicObject, propertyName, value) {
  'use strict';
  if (privateObject[propertyName] !== value) {
    privateObject[propertyName] = value;
    if (publicObject.emit) {
      publicObject.emit('changed', propertyName);
    }
  }
};

  exports.eraseProperty = function (name) {
    window.localStorage.removeItem(name);
  };
  exports.persistProperty = function (name, value) {
    window.localStorage.setItem(name, value);
  };
  
  exports.readProperty = function (name) {
    return window.localStorage.getItem(name);
  };

exports.addProperty = function (object, propertyName, initialValue, privateObject, access) {
  'use strict';

  if (typeof privateObject !== 'undefined') {
    if (!privateObject) {
      privateObject = {};
    }
  }
  else {
    privateObject = {};

  }
  if (typeof privateObject[propertyName] === 'undefined') {
    if (typeof initialValue !== 'undefined') {
      privateObject[propertyName] = initialValue;
    }
    else {
      privateObject[propertyName] = null;
    }
  }



  exports.addPropertyUsingGetSet(object, propertyName, function () {
    if (typeof access !== "undefined") {
      var a = access();
      if (a === 'writeonly') {
        throw new Error(propertyName + ' property is writeonly');
      }
    }
    return privateObject[propertyName];
  }, function (val) {

    if (typeof access !== "undefined") {
      var a = access();
      if (a === 'readonly') {
        throw new Error(propertyName + 'property is readonly');
      }
    }
    exports.updatePrivateValue(privateObject, object, propertyName, val);
    return;
  });
};


  exports.runOnceFunction = function(f){
    var callbacks = [];
    var running = false;
    var result;

    var that = function(){
      var callback = arguments[arguments.length-1];
      if(result)
      {
        callback.apply(null, result);
        return;
      }
      callbacks.push(callback);
      if(running)
      {
        return;
      }
      running = true;
      var newArgs = [];
      for(var i = 0; i < arguments.length -1; i ++)
      {
        newArgs.push(arguments[i]);
      }
      newArgs.push(function(){
        result = arguments;
        for(var j = 0; j < callbacks.length; j ++)
        {
          callbacks[j].apply(null, result);
        }
        running = false;
      });
      f.apply(null, newArgs);
    };

    that.reset = function(){
      callbacks.length= 0;
      result= null;
      running = false;
    };
    return that;
  };
  
exports.cb = utils.cb;