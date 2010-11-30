var async = require('async'),
    http = require('http'), // TODO: needed?
    querystring = require('querystring'),
    parse = require('url').parse,
    fields = require('./fields');

exports.widgets = require('./widgets');
exports.fields = require('./fields');
exports.render = require('./render');
exports.validators = require('./validators');

/**
 * Create a new form.
 *
 * @param {definition}
 *   A form definition describing fields, render methods and more.
 *   See README for more detail.
 */
var Form = function(opt) {}

/**
 * Process form submission.
 */
Form.prototype.process = function(request, response, next) {
    var that = this;
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
    });
};

/**
 * Validate form.
 */
Form.prototype.validate = function(callback) {
    var that = this;
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

    var form = new formObject(); // pass through something that caches

    loaders.push(function(req, res, next) {
        // Populate the request object with the form being loaded.
        req.form = form;
        next();
    });

    // This should actually be happening first.
    loaders.push(function(req, res, next) {
      switch (req.method) {
          case 'GET':
              req.form.instance = parse(req.url, 1).query;
              break;
          case 'POST':
              if (req.body) {
                req.form.instance = req.body;
              }
              break;
      }

      next();
    });


    // add additional loaders defined by the form.

    (function (property) {
      fn = form[property] || null;

      if (fn !== null) {
        (function stack(fn) {
          if (typeof fn === 'function') {
            loaders.push(fn);
          }
          else if (Array.isArray(fn)) {
            fn.forEach( function(method) {
              stack(method);
            });
          }
        })(fn);
      }

      return arguments.callee;
    })('build')('load')('permissions');

    return loaders;
}


exports.createForm = function(opt, parentForm) {
  var p = parentForm || Form

  var newForm = function() {
  }

  sys.inherits(newForm, p);
  return newForm;
}

