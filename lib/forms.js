var async = require('async'),
    http = require('http'), // TODO: needed?
    querystring = require('querystring'),
    parse = require('url').parse,
    fields = require('./fields'),
    utils = require('./utils'),
    sys = require('sys'),
    EventEmitter = require('events').EventEmitter;


exports.widgets = require('./widgets');
exports.fields = require('./fields');
exports.render = require('./render');
exports.validators = require('./validators');
exports.utils = require('./utils');

/**
 * Create a new form.
 *
 * @param {definition}
 *   A form definition describing fields, render methods and more.
 *   See README for more detail.
 */
function Form() { }
Form.prototype.fields = {}
Form.prototype.errors = {}

Form.on = EventEmitter.prototype.on;
Form.emit = EventEmitter.prototype.emit;
Form.prototype.emit = utils.parentEmit;

Form.prototype.init = function() {

      // For each of the fields of the parent, create a new local field property.
      Object.keys(this.fields).forEach(function(key) {
          this.fields[key].form = this;
          this.fields[key].key = key;
      }, this);
}

// Validate all the form fields
Form.on('validate', function(req, res) {
  Object.keys(this.fields).forEach( function(key) {
    this.fields[key].validate(this);
  }, this);
});


exports.createForm = function(parentForm) {
    var p = parentForm || Form

    var newForm = function() {
      this.instance = {}
      this.defaults = {}
      this.errors = {}
      this.fields = utils.deepClone(this.fields);
    }

    // Node.js uses this internally, but it's not documented.
    sys.inherits(newForm, p);

    newForm.on = EventEmitter.prototype.on;
    newForm.emit = EventEmitter.prototype.emit;
    newForm.prototype.emit = utils.parentEmit;
     
    // the fields is a new object, not a reference.
    newForm.prototype.fields = utils.deepClone(p.prototype.fields);
    newForm._events = utils.deepClone(p._events);
    return newForm;
}

/**
 * Process form submission.
 */
Form.prototype.process = function(request, response, next) {

    this.emit('request', request, response, next);

    this.emit('validate', request, response, next);

    if (this.isValid()) {
       Object.keys(this.fields).forEach(function(k) {
           if (this.fields[k].submit && this.instance[k]) {
               this.emit('button:' . k, request, response, next);
           }
       }, this);

      this.emit('success', request, response, next);
    }

    this.render(request, response, next);
}
  
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
    var fields = this.visible_fields || Object.keys(this.fields)
    var html = fields.reduce(function(html, k) {
        return html + that.fields[k].toHTML(k);
    }, '');
    var action = this.action || '';
    var method = this.method || 'POST';

    //TODO: add token generation if the property is set on the form.
    return '<form action="' + action +'" method="' + method +'">'
        + html
        + '<form>';
};

/**
 * Generator function for express middleware loader functions.
 *
 * Sets up a 'req.form' object which is an instance of the
 * form object you passed this function.
 */
exports.loadForm = function(formObject) {
    var loaders = []

    // Add a new instance of the form object to the request.
    loaders.push(function(req, res, next) {
        // Populate the request object with the form being loaded.
        req.form = new formObject();
        next();
    });

    // Set up the form 'instance' property, containing values that
    // have been submitted to the form.
    loaders.push(function(req, res, next) {
      req.form.instance = {}
      switch (req.method) {
          case 'GET':
              req.form.instance = parse(req.url, 1).query || {};
              break;
          case 'POST':
              if (req.body) {
                req.form.instance = req.body || {};
              }
              break;
      }

      next();
    });

    // Fire any 'load' events associated to the form object
    //
    // These events are responsible for setting up any contextual
    // information, such as the object being edited and so forth.
    loaders.push(function(req, res, next) {
      // Initialize a local callback tracker queue in this scope
      var track = whenDone(function() { next() });

      // call load events
      // Pass the tracker to the associated events
      track(function() { req.form.emit('load', req, res, track) })();
    });

    // Fire any 'build' events associated to the form object.
    //
    // These events are responsible for modifying the form structure,
    // to match the contextual information that was loaded before.
    loaders.push(function(req, res, next) {
      // Initialize a local callback tracker queue in this scope
      var track = whenDone(function() { next() });

      // Pass the tracker to the associated events
      track(function() { req.form.emit('build', req, res, track) })();
    });

    // Initialize the form object.
    //
    // This ensures all the fields have the necessary context
    // to refer back to the form instance that it belongs to.
    loaders.push(function(req, res, next) {
        req.form.init();
        next();
    });

    // Do any possible access checks that may be necessary.
    //
    // Useful place to ensure non-logged in users cant see forms,
    // and so forth.
    loaders.push(function(req, res, next) {
      // We do not pass a tracker in this request because we need to use the express 
      // mechanism for triggering errors.

      // call permission events
      req.form.emit('access', req, res, next);
      next();
    });

    // Return an array of loaders that will be injected into the
    // page handler callback.
    return loaders;
}


/**
 * Generator for decorator to track asynchronous tasks.
 *
 * Allows you to execute a complicated dynamic callback hierarchy and call a handler when all tasks have finished.
 */
whenDone = function (done) {
  // Initialize closure variable.
  var count = 0,
  // Store additional arguments.
      done_args = [].slice.call(arguments, 1);
  return function (callback) {
    // Register new task.
    count++;
    // Decorate callback with exit-checker.
    return function () {
      callback.apply(this, arguments);
      if (--count == 0) {
        done.apply(this, done_args);
      }
    }
  }
}

