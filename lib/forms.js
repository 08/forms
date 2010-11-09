var async = require('async'),
    http = require('http'),
    querystring = require('querystring'),
    parse = require('url').parse;

exports.widgets = require('./widgets');
exports.fields = require('./fields');
exports.render = require('./render');
exports.validators = require('./validators');

/**
 * Create a new form.
 *
 * @param definition
 *   A function returning an object literal representing a form.
 *   TODO: Describe this object literal.
 */
var Form = function(definition) {
    var that = this;
    this.built = false;
    this.def = definition(function() {
        that.built = true;
        this.submit();
    });
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
        if (parse(request.url, 1).query) {
            this.bind(parse(request.url, 1).query);
            this.data = true;
            this.submit();
            // TODO: does not redirect correctly.
            response.redirect(request.url);
        }
        // If no data has been submitted, render form.
        else {
            this.def.render(this, request, response, next);
        }
        return;
    case 'POST':
        var buffer = '';
        request.addListener('data', function(chunk){
            buffer += chunk;
        });
        request.addListener('end', function(){
            that.bind(querystring.parse(buffer));
            that.data = true;
            that.submit();
            response.redirect(request.url);
        });
        return;
    default:
        // Invalid request, send a 404.
        response.send(404);
    }
}

/**
 * Bind submitted values to form definition.
 */
Form.prototype.bind = function(data) {
    Object.keys(this.def.fields).forEach(function(k){
        this.def.fields[k].bind(data[k]);
    });
}

/**
 * Validate form.
 */
Form.prototype.validate = function() {
    var valid = true;
    Object.keys(this.def.fields).forEach(function(k){
        valid &= this.def.fields[k].validate();
    });
    valid &= (this.def.validate()) || true;
    return valid;
}

/**
 * Handle form submission.
 */
Form.prototype.submit = function() {
    if (this.built && this.data) {
        if (this.validate()) {
            this.def.submit(this);
        }
    }
}

/**
 * Renders form as HTML.
 */
Form.prototype.toHTML = function(iterator) {
     var that = this;
     return Object.keys(that.def.fields).reduce(function(html, k) {
         return html + that.def.fields[k].toHTML(k, iterator);
     }, '');
}

/**
 * Export Form object.
 */
module.exports = {
    'Form': Form
};

/**
 * Obsolete code.
 *
exports.create = function(fields){
    var f = {
        fields: fields,
        bind: function(data){
            var b = {};
            b.toHTML = f.toHTML;
            b.fields = f.fields;
            Object.keys(b.fields).forEach(function(k){
                b.fields[k] = f.fields[k].bind(data[k]);
            });
            b.data = Object.keys(b.fields).reduce(function(a,k){
                a[k] = b.fields[k].data;
                return a;
            }, {});
            b.validate = function(callback){
                async.forEach(Object.keys(b.fields), function(k, callback){
                    f.fields[k].validate(b, function(err, bound_field){
                        b.fields[k] = bound_field;
                        callback(err);
                    });
                }, function(err){
                    callback(err, b);
                });
            };
            b.isValid = function(){
                var form = this;
                return Object.keys(form.fields).every(function(k){
                    return form.fields[k].error == null;
                });
            };
            return b;
        },
        handle: function(obj, callbacks){
            if(obj === undefined || obj === null){
                (callbacks.empty || callbacks.other)(f);
            }
            else if(obj instanceof http.IncomingMessage){
                if(obj.method === 'GET'){
                    f.handle(parse(obj.url, 1).query, callbacks);
                }
                else if(obj.method === 'POST'){
                    var buffer = '';
                    obj.addListener('data', function(chunk){
                        buffer += chunk;
                    });
                    obj.addListener('end', function(){
                        f.handle(querystring.parse(buffer), callbacks);
                    });
                }
                else throw new Error(
                    'Cannot handle request method: ' + obj.method
                );
            }
            else if(typeof obj === 'object'){
                f.bind(obj).validate(function(err, f){
                    if(f.isValid()){
                        (callbacks.success || callbacks.other)(f);
                    }
                    else {
                        (callbacks.error || callbacks.other)(f);
                    }
                });
            }
            else throw new Error('Cannot handle type: ' + typeof obj);
        },
        toHTML: function(iterator){
            var form = this;
            return Object.keys(form.fields).reduce(function(html, k){
                return html + form.fields[k].toHTML(k, iterator);
            }, '');
        }
    };
    return f;
};
*/