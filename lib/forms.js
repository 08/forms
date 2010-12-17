var querystring = require('querystring'),
    parse = require('url').parse,
    crypto = require('crypto'),
    fields = require('./fields'),
    widgets = require('./widgets'),
    render = require('./render'),
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
Form = function() { }
Form.prototype.fields = {};
Form.prototype._field_order = [];
Form.prototype.errors = {};
Form.prototype.locals = {};
Form.prototype.CSRF = false;

// All forms are event emitters
Form.on = EventEmitter.prototype.on;
Form.emit = EventEmitter.prototype.emit;
Form.prototype.emit = utils.parentEmit;


// Create a new form object constructor.
Form.create = function(opt) {
    var o = opt || {}
    var p = this;

    var newForm = function() {
      this.instance = {};
      this.defaults = {};
      this.errors = {};
      this.fields = utils.deepClone(this.fields);
      this.locals = utils.deepClone(this.locals);
    }

    // Node.js uses this internally, but it's not documented.
    sys.inherits(newForm, p);

    // All forms are emitters.
    newForm.on = EventEmitter.prototype.on;
    newForm.emit = EventEmitter.prototype.emit;
    newForm.prototype.emit = utils.parentEmit;
    
    // Important form methods.
    newForm.create = Form.create;
    newForm.load = Form.load;

    // the fields is a new object, not a reference.
    newForm.prototype.fields = utils.deepClone(p.prototype.fields);
    newForm.prototype.locals = utils.deepClone(p.prototype.locals);

    // Inherit the parent's events.
    newForm._events = utils.deepClone(p._events);

 
    // Set a custom view for rendering.
    if (o.view) {
      newForm.prototype.view = o.view;
    }
    
    newForm.prototype._field_order = [];

    p.prototype._field_order.forEach( function(item) {
        newForm.prototype._field_order.push(item);
    });


    // Add additional fields into the form.
    if (o.fields) {
      Object.keys(o.fields).forEach( function (k) {
        newForm.prototype.fields[k] = o.fields[k];
        newForm.prototype._field_order.push(k);
      });
    }

    // Local variables
    if (o.locals) {
      Object.keys(o.locals).forEach( function (k) {
        newForm.prototype.locals[k] = o.locals[k];
      });
    }

    if (o.CSRF) {
        newForm.prototype.CSRF = o.CSRF;
    }

    return newForm;
};

/**
 * Generator function for express middleware loader functions.
 *
 * Sets up a 'req.form' object which is an instance of the
 * form object you passed this function.
 */
Form.load = function() {
    var loaders = [];
    var that = this;
    // Add a new instance of the form object to the request.
    loaders.push(function(req, res, next) {
        if (that.prototype.CSRF && (req.method == 'POST') && req.session) {
          var build_id = req.body._build_id;
          var form = Form.cache.load(req.sessionID, build_id);

          if (form) {
            req.form = form;

            req.form.last_time = Math.round(new Date().getTime() / 1000);
            req.form.new = false;
            next();
          }
          else {
            next(new InvalidFormToken(req.url));
          }
        }
        // Populate the request object with the form being loaded.
        if (!req.form) {
          req.form = new that;
          req.form.last_time = Math.round(new Date().getTime() / 1000);
          req.form.new = true;
          next();
        }

    });

    // Set up the form 'instance' property, containing values that
    // have been submitted to the form.
    loaders.push(function(req, res, next) {
        req.form.instance = {};
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
        var track = utils.whenDone(function() { next() });

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
        var track = utils.whenDone(function() { next() });

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
        req.form.emit('access', req, res, function() {});
        next();
    });

    // Return an array of loaders that will be injected into the
    // page handler callback.
    return loaders;
};

/**
 * Initialize the form object's fields, by placing a reference
 * to the container form in each fields.
 */
Form.prototype.init = function() {
  this.errors = {}
    // For each of the fields of the parent, create a new local field property.
    Object.keys(this.fields).forEach(function(key) {
        this.fields[key].form = this;
        this.fields[key].key = key;
    }, this);
};



Form.on('build', function(req, res) {
  if (this.CSRF && req.session) {

      this.build_id = this.build_id || crypto.createHash('md5').update('' + new Date().getTime() + req.session.lastAccess).digest('hex');
      this.fields['_build_id'] = fields.hidden({
        value: this.build_id,
      });

      // Default is to terminate the form after 1 hour of no activity.
      Form.cache.save(req.sessionID, this);
  }
});

/**
 * Form caching subsystem.
 */
(function() {
    Form.cache = {}

    var _cache = {};

    // Get a cache id from the build id + the session id.
    var _get_id = function(sessionID, build_id) {
        return crypto.createHash('md5').update('' + sessionID + build_id).digest('hex');
    }
    
    // Remove the form with the specific cache id, and remove all timers.
    var _remove_form = function(id) {
       var form = _cache[id] || false;
        if (form) {
            if (form._cache_timer) {
                clearTimeout(form._cache_timer);
                delete form._cache_timer;
            }
            delete _cache[id];
        }
    }

    // Put a check for the form to expire within a certain threshold of inactivity.
    var _cache_timeout = function(id, seconds) {
        var now = Math.round(new Date().getTime() / 1000);
        var form = _cache[id] || false;
        if (form) {
            if ((now - form.last_time) >= seconds) {
                _remove_form(id);
            }
            else {
                // Check the session again in 5 minutes.
                form._cache_timer = setTimeout(_cache_timeout, 30000, id, seconds);
            }
        }
    }

    // Save a form to the cache. Generates a build ID from the session ID.
    Form.cache.save = function(sessionID, form) {
        var id = _get_id(sessionID, form.build_id);
        _cache[id] = form;
        _cache_timeout(id, form.CSRF_timeout || 3600);
        return false;
    }

    // Load a form from the cache based on the session and build id.
    Form.cache.load = function(sessionID, build_id) {
        return _cache[_get_id(sessionID, build_id)] || false;
    }

    // Delete a form from the cache based on the session and build id.
    Form.cache.delete = function(sessionID, build_id) {
        _remove_form(_get_id(sessionID, build_id));
    }

    // Remove all the forms in the cache. Useful for shutting down during
    // testing.
    Form.cache.clear = function() {
        Object.keys(_cache).forEach( function( key ) {
            _remove_form(key);     
            
        });
    }
})();


// Validate all the form fields
Form.on('validate', function(req, res) {
    Object.keys(this.fields).forEach(function(key) {
        this.fields[key].validate(this);
    }, this);
});

/**
 * Process form submission.
 */
Form.prototype.process = function(request, response) {
    var that = this;

    // Handle any data made at the beginning of a request
    // This commonly involves copying the instance values
    // into a contextual data object.
    this.emit('request', request, response);

    // Validate the submitted data.
    this.emit('validate', request, response);

    // Keep track of when the success callbacks
    // are completed, because printing output
    // before they have a chance to redirect will
    // cause the redirection to fail.
    var track = utils.whenDone(function() {
        if (that.redirect) {
            response.redirect(that.redirect);
            Form.cache.delete(request.sessionID, that.build_id);
        }
        else {
            that.render(request, response);
        }
    });

    // Trigger any events associated to the button that was
    // clicked, and any 'success' events, if the form was
    // succesfully validated.
    track(function() {
      if (that.isValid()) {
         Object.keys(that.fields).forEach(function(k) {
             if (that.fields[k].submit && that.instance[k]) {
                 that.emit('button:' . k, request, response, track);
             }
         }, that);

         // we pass the track function to the events so they can wrap
         // their callbacks in it.
        that.emit('success', request, response, track);
      }
    })();
};


/**
 * After validation, determine whether form is valid or not.
 */
Form.prototype.isValid = function(callback) {
    var that = this;
    return Object.keys(this.fields).every(function(k) {
        return that.errors[k] == null;
    });
};

/**
 * Renders form as HTML.
 */
Form.prototype.toHTML = function(iterator) {
    var that = this;
    var fields = this.visible_fields || this._field_order || Object.keys(this.fields);
    if (this.CSRF && (fields.indexOf('_build_id') === -1)) {
        fields.push('_build_id');
    }
    var html = fields.reduce(function(html, k) {
        return html + that.fields[k].toHTML(k, iterator);
    }, '');
    var action = this.action || '';
    var method = this.method || 'POST';

    if (iterator === render.table) {
        html = "<table>" + html + "</table>";
    }
    //TODO: add token generation if the property is set on the form.
    return '<form action="' + action + '" method="' + method + '">'
        + html
        + '<form>';
};

/**
 * Render a form and send it to the client.
 *
 * If the form has a view object, we will use response.render(),
 * else we will just use response.send().
 */
Form.prototype.render = function(request, response) {
    if (this.view !== undefined) {
        var locals = utils.deepClone(this.locals);
        locals.content = this.toHTML();
        response.render(this.view, {'locals': locals});
    }
    else {
        response.send(this.toHTML());
    }
}

// Export the form from the module
exports.Form = Form;

/**
 * Error: InvalidFormToken 
 *
 * This is explictly not a 'var Name' so that
 * it will be created in the global scope.
 */
InvalidFormToken = function(msg){
    this.name = 'InvalidFormToken';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}

sys.inherits(InvalidFormToken, Error);


