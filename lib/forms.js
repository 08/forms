var async = require('async'),
    http = require('http'), // TODO: needed?
    querystring = require('querystring'),
    parse = require('url').parse,
    fields = require('./fields'),
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter;


exports.widgets = require('./widgets');
exports.fields = require('./fields');
exports.render = require('./render');
exports.validators = require('./validators');

function parentEmit(type) {
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

/**
 * Create a new form.
 *
 * @param {definition}
 *   A form definition describing fields, render methods and more.
 *   See README for more detail.
 */
function Form() { }
Form.prototype.fields = {}

Form.on = EventEmitter.prototype.on;
Form.emit = EventEmitter.prototype.emit;
Form.prototype.emit = parentEmit;


function deepClone(obj){
    if(obj == null || typeof(obj) != 'object')
        return obj;
    var temp = new obj.constructor(); // changed (twice)
    for(var key in obj)
        temp[key] = deepClone(obj[key]);

    return temp;
}

// Validate all the form fields
Form.on('validate', function(req, res) {
  Object.keys(this.fields).forEach( function(item, key) {
    this.fields[key].validate(this);
  }, this);
});


exports.createForm = function(parentForm) {
    var p = parentForm || Form

    var newForm = function() { }

    // Node.js uses this internally, but it's not documented.
    sys.inherits(newForm, p);
    newForm.on = EventEmitter.prototype.on;
    newForm.emit = EventEmitter.prototype.emit;
    newForm.prototype.emit = parentEmit;
     
    // the fields is a new object, not a reference.
    newForm.prototype.fields = deepClone(p.prototype.fields);
    newForm._events = deepClone(p._events);
    return newForm;
}

/**
 * Process form submission.
 */
Form.prototype.process = function(request, response, next) {
    var that = this;
    // Copy submitted data to field definition.
//    Object.keys(that.fields).forEach(function(k) {
  //      that.fields[k].bind(that.instance[k]);
  //  });


    
    this.emit('validate', request, response, next);

    console.log(this.errors);
    console.log(this.messages);
    if (this.isValid()) {
      this.emit('success', request, response, next);
    }

    that.render(request, response, next);
}
    
/*
    // Validate form, submit or render depending on errors.
    that.validate(function(err) {
        var submitted = false;
        if (that.isValid()) {
            // Call submit handlers of clicked buttons.
            // TODO: Currently any submit handler on a non-empty
            // field will be clicked.
            Object.keys(that.fields).forEach(function(k) {
                if (that.fields[k].submit && that.instance[k]) {
                    that.fields[k].submit.apply(that, [request, response, next]);
                    submitted = true;
                }
            });
            // TODO: Throw / show error if submission failed.
        }
        if (!submitted) {
            that.render(request, response, next);
        }
        else {
            that.success(request, response, next);
        }
    });*/

//};

/**
 * Validate form.
 */
Form.prototype.validate = function(callback) {
    var that = this;
    async.forEach(Object.keys(this.validators), function(k, callback) {
      that.validators[k].apply(that, []);
    });

    async.forEach(Object.keys(this.fields), function(k, callback) {
        that.fields[k].validate(that, function(err) {
            callback(err);
        });
    }, function(err) {
        callback(err);
    });
};

/**
 * After validation, determine whether form is valid or not.
 *
 * TODO: Could this method be avoided by using the 'err' value passed
 * out from validate() ?
 */
Form.prototype.isValid = function(callback) {
    var that = this;
    return Object.keys(this.fields).every(function(k){
        return that.errors[k] == null;
    });
};

/**
 * Renders form as HTML.
 */
Form.prototype.toHTML = function(iterator) {
    var that = this;
    var html = Object.keys(this.fields).reduce(function(html, k) {
        return html + that.fields[k].toHTML(k, iterator);
    }, '');
    var action = this.action || '';
    var method = this.method || 'POST';

    //TODO: add token generation if the property is set on the form.
    return '<form action="' + action +'" method="' + method +'">'
        + html
        + '<form>';
};

/**
 * Export Form object.
 */
exports.Form = Form;

// Populate the request with the desired form instance.
// returns an array of loader functions.
exports.loadForm = function(formObject) {
    var loaders = []

    loaders.push(function(req, res, next) {
        // Populate the request object with the form being loaded.
        req.form = new formObject();
        req.form.init();
        next();
    });

    // This should actually be happening first.
    loaders.push(function(req, res, next) {
      switch (req.method) {
          case 'GET':
              req.form.instance = parse(req.url, 1).query || {};
              break;
          case 'POST':
              if (req.body) {
                req.form.instance = req.body;
              }
              break;
      }

      next();
    });

    loaders.push(function(req, res, next) {
      req.form.emit('build', req, res, next);
      next();
      // call build events
    });
   /* 
    loaders.push(function(req, res, next) {
      // call load events
      req.form.emit('load', req, res, next);
    });

    loaders.push(function(req, res, next) {
      // call permission events
      req.form.emit('access', req, res, next);
    });
*/
    return loaders;
}

Form.prototype.init = function() {
      this.instance = {}
      this.errors = {}
      this.messages = {} 
      // For each of the fields of the parent, create a new local field property.
      Object.keys(this.fields).forEach(function(key) {
          this.fields[key].form = this;
          this.fields[key].key = key;
      }, this);

}

