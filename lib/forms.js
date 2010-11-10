var async = require('async'),
    http = require('http'),
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
 * @param {callback}
 *   A function returning accepting {param} and a callback that passes  a form
 *   definition in the form of an object. See README for more information.
 */
var Form = function(callback) {
    this.onBuildCallbacks = [];
    // Allow asynchronous loading of the form definition.
    var that = this;
    callback(function(definition) {
        that.def = definition;
        // Resolve fields right away.
        that.def.fields = that.def.fields();
        that.triggerOnBuild();
    });
};

/**
 * Queue functions to be triggered as soon as form definition is available.
 *
 * Callback is executed immediately if form is built.
 */
Form.prototype.onBuild = function(callback) {
    if (this.def) {
        callback();
    }
    else {
        this.onBuildCallbacks.unshift(callback);
    }
}

/**
 * Trigger callbacks queued with onBuild().
 */
Form.prototype.triggerOnBuild = function() {
    for (var i = 0; i < this.onBuildCallbacks.length; i++) {
        (this.onBuildCallbacks[i])();
    }
}

/**
 * Handles GET and POST requests.
 */
Form.prototype.handle = function(request, response, next) {
    var that = this;
    switch (request.method) {
    case 'GET':
        // TODO: assumption that ANY query parameters are a valid submission is
        // too wide.
        var data = parse(request.url, 1).query;
        if (data) {
            this.process(data, request, response, next);
        }
        // If no data has been submitted, render form.
        else {
            this.onBuild(function() {
                that.def.render(that, request, response, next);
            });
        }
        return;
    case 'POST':
        var buffer = '';
        request.addListener('data', function(chunk){
            buffer += chunk;
        });
        request.addListener('end', function(){
            var data = querystring.parse(buffer);
            that.process(data, request, response, next);
        });
        return;
    default:
        // Invalid request, send a 404.
        response.send(404);
    }
};

/**
 * Process form submission.
 */
Form.prototype.process = function(data, request, response, next) {
    var that = this;
    this.onBuild(function() {
        // Copy submitted data to field definition.
        Object.keys(that.def.fields).forEach(function(k) {
            that.def.fields[k].bind(data[k]);
        });
        // Validate form, submit or render depending on errors.
        that.validate(function(err) {
            var submitted = false;
            if (that.isValid()) {
                // Call submit handlers of clicked buttons.
                // TODO: Currently any submit handler on a non-empty
                // field will be clicked.
                Object.keys(that.def.fields).forEach(function(k) {
                    if (that.def.fields[k].submit &&
                        data[k]) {
                        that.def.fields[k].submit(that, request, response, next);
                        submitted = true;
                    }
                });
                // TODO: Throw / show error if submission failed.
            }
            if (!submitted) {
                that.def.render(that, request, response, next);
            }
        });
    });
};

/**
 * Validate form.
 */
Form.prototype.validate = function(callback) {
    var that = this;
    async.forEach(Object.keys(this.def.fields), function(k, callback) {
        that.def.fields[k].validate(that, function(err) {
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
    return Object.keys(this.def.fields).every(function(k){
        return that.def.fields[k].error == null;
    });
};

/**
 * Renders form as HTML.
 */
Form.prototype.toHTML = function(iterator) {
    var that = this;
    var html = Object.keys(this.def.fields).reduce(function(html, k) {
        return html + that.def.fields[k].toHTML(k, iterator);
    }, '');
    var action = this.def.action || '';
    var method = this.def.method || 'POST';
    return '<form action="' + action +'" method="' + method +'">'
        + html
        + '<form>';
};

/**
 * Export Form object.
 */
exports.Form = Form;
