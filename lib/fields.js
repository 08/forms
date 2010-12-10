var forms = require('./forms'),
    async = require('async');

exports.string = function(opt){
    opt = opt || {};

    var f = {};

    for(var k in opt) f[k] = opt[k];
    f.widget = f.widget || forms.widgets.text();
    f.__defineGetter__('value', function() {
      return this.form.instance[this.key] || this.form.defaults[this.key] || this.default || '';
    });
    f.__defineGetter__('data', function() {
      return this.parse(this.value);
    });
    f.__defineGetter__('error', function() {
      return this.form.errors[this.key] || '';
    });

    f.parse = function(raw_data){
        if(raw_data !== undefined && raw_data !== null){
            return String(raw_data);
        }
        return '';
    };
    f.validate = function(form){
        raw_data = this.value;
        if(raw_data === '' || raw_data === null || raw_data === undefined){
            // don't validate empty fields, but check if required
            if (this.required) {
              this.form.errors[f.key] =  f.label + ' is required';
            }
        }
        else {
            (this.validators || []).forEach( function(element, key) {
                this.validators[key].call(this, this.form, this, function(err) {
                   if (err !== undefined) {
                       form.errors[key] = err;
                   }
                });
            }, this);
        }
    };

    f.errorHTML = function(){
        return (typeof this.error === 'string') ? '<p class="error_msg">' + this.error + '</p>': '';
    };
    f.labelText = function(name){
        var label = this.label;
        if(!label){
            label = name[0].toUpperCase() + name.substr(1).replace('_', ' ');
        }
        return label;
    };
    f.labelHTML = function(name, id){
        return '<label for="' + (id || 'id_'+name) + '">' +
            this.labelText(name, id) +
            (this.required ? ' <span class="required">*</span>' : '')
        '</label>';
    };
    f.classes = function(){
        var r = ['field'];
        if(opt.classes) r = r.concat(opt.classes);
        if(this.error) r.push('error');
        if(this.required) r.push('required');
        return r;
    },
    f.toHTML = function(name){
        return forms.render.div(name, this);
    };

    return f;
};

// TODO this one should not be extending string.
exports.html = function(opt){
    opt = opt || {};
    var f = exports.string(opt);
    f.widget = forms.widgets.html();
    // Do not support labels on plain html fields.
    f.labelText = function(name){
        return '';
    };
    return f;
};

exports.number = function(opt){
    opt = opt || {};
    var f = exports.string(opt);

    f.parse = function(raw_data){
        if(raw_data === null || raw_data === ''){
            return NaN;
        }
        return Number(raw_data);
    };
    return f;
};

exports.boolean = function(opt){
    opt = opt || {};
    var f = exports.string(opt);

    f.widget = opt.widget || forms.widgets.checkbox();
    f.parse = function(raw_data){
        return Boolean(raw_data);
    };
    return f;
};

exports.email = function(opt){
    opt = opt || {};
    var f = exports.string(opt);
    if(f.validators){
        f.validators.unshift(forms.validators.email());
    }
    else {
        f.validators = [forms.validators.email()];
    }
    return f;
};

exports.password = function(opt){
    opt = opt || {};
    var f = exports.string(opt);
    f.widget = opt.widget || forms.widgets.password();
    return f;
};

exports.url = function(opt){
    opt = opt || {};
    var f = exports.string(opt);
    if(f.validators){
        f.validators.unshift(forms.validators.url());
    }
    else {
        f.validators = [forms.validators.url()];
    }
    return f;
};

exports.array = function(opt){
    opt = opt || {};
    var f = exports.string(opt);
    f.parse = function(raw_data){
        if(raw_data === undefined) return [];
        if(raw_data instanceof Array) return raw_data;
        else return [raw_data];
    };
    return f;
};

exports.submit = function(opt){
    var f = exports.string(opt);
    // Do not support labels on buttons.
    f.labelText = function(name){
        return '';
    };
    f.widget = opt.widget || forms.widgets.submit();
    return f;
};
