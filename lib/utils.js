function clone(source) {
  if ((typeof source === 'object' && source !== null) || source instanceof RegExp)
    return _clone(source, { source: [], target: [] })
  else
    return source;
}

function _clone(source, seen) {
  var index = seen.source.indexOf(source);
  if (index >= 0) return seen.target[index];

  if (source.constructor !== Object)
    if (Array.isArray(source))
      var target = [];
    else if (source instanceof Date)
      var target = new Date(source);
    else if (source instanceof RegExp)
      var target = new RegExp(source.source, (source.global ? 'g' : '') +
        (source.ignoreCase ? 'i' : '') + (source.multiline ? 'm' : ''));
    else
      var target = Object.create(Object.getPrototypeOf(source));
  else
    var target = {};

  seen.source.push(source);
  seen.target.push(target);

  var props = Object.getOwnPropertyNames(source);
  for (var i = 0; i < props.length; i++) {
    var prop = Object.getOwnPropertyDescriptor(source, props[i]);
    if ('value' in prop) {
      var value = prop.value;
      if ((typeof value === 'object' && value !== null) || value instanceof RegExp) {
        prop.value = _clone(value, seen);
      }
    }
    Object.defineProperty(target, props[i], prop);
  }
  return target;
}

exports.deepClone = clone;


exports.parentEmit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this.constructor._events || !this.constructor._events.error ||
        (isArray(this.constructor._events.error) && !this.constructor._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this.constructor._events) return false;
  var handler = this.constructor._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    if (arguments.length <= 3) {
      // fast case
      handler.call(this, arguments[1], arguments[2]);
    } else {
      // slower
      var args = Array.prototype.slice.call(arguments, 1);
      handler.apply(this, args);
    }
    return true;

  } else if (Array.isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);


    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};
 
