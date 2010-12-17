var forms = require('../lib/forms'),
    fields = forms.fields,
    Form = forms.Form;


var testField = function(field){

    function _test_field(field_def, instance) {
        var myfields = {}
        myfields[field] = fields[field](field_def || {});
        var testform = Form.create({
            fields: myfields,
        });

        var form = new testform();
        form.instance = {}

        form.instance[field] = instance || undefined;
        form.init();

        return form.fields[field];
    }

    exports[field + ' options'] = function(assert){
        var fn1 = function(){return 'one'};

        var f = fields[field]({
            required: true,
            label: 'test label',
            validators: [fn1],
            widget: 'some widget',
            choices: {one:'option one', two:'option two'}
        });

        assert.eql(f.required, true);
        assert.eql(f.label, 'test label');
        assert.eql(f.validators[f.validators.length-1], fn1);
        assert.eql(f.widget, 'some widget');
        assert.eql(f.choices, {one:'option one', two:'option two'});
    };

    exports[field + ' value and parse'] = function(assert){
        var f = _test_field({
            label: 'test label',
            validators: [
                function(form, field, callback){
                    assert.ok(false, 'validators should not be called');
                }
            ]
        }, 'some data');


        f.parse = function(){
            assert.eql(this.value, 'some data');
            return 'some data parsed';
        };

        assert.eql(f.label, 'test label');
        assert.eql(f.value, 'some data');
        assert.eql(f.data, 'some data parsed');
        assert.eql(f.error, undefined);
        assert.ok(f.validate instanceof Function);
    };

    exports[field + ' validate'] = function(assert){
        var f = _test_field({label: 'test label'}, 'some data');

        f.validators = [
            function(form, field, callback){
                assert.eql(field.data, 'some data parsed');
                assert.eql(field.value, 'some data');
            },
            function(form, field, callback){
                assert.eql(field.data, 'some data parsed');
                assert.eql(field.value, 'some data');
                form.errors[field.key] = 'validation error';
            }
        ];

        f.parse = function(){
            assert.eql(this.value, 'some data');
            return 'some data parsed';
        };

        f.form.emit('validate', {}, {});

        assert.eql(f.label, 'test label');
        assert.eql(f.value, 'some data');
        assert.eql(f.data, 'some data parsed');
        assert.eql(f.error, 'validation error');
            
    };


    //TODO : this test makes no sense, why should more errors not be run ?

    exports[field + ' validate multiple errors'] = function(assert){

        var f = _test_field({}, 'some data');
        
        f.validators = [
            function(form, field, callback){
                form.errors[field.key] = 'error one';
            },
            function(form, field, callback){
               // assert.ok(false, 'second validator should not be called');
                form.errors[field.key] = 'error two';
            }
        ];

        f.parse = function(data){
            return 'some data parsed';
        };

        f.form.emit('validate', {}, {});

//        assert.eql(f.error, 'error one');
            
    };

    exports[field + ' validate empty'] = function(assert){
        var f = _test_field({
            validators: [function(form, field, callback){
                assert.ok(false, 'validators should not be called');
                form.errors[field.key] = 'some error';
            }]
        });

        f.parse = function(data){
            return;
        };

        f.form.emit('validate', {}, {});

        assert.eql(f.error, undefined);
    };

    exports[field + ' validate required'] = function(assert){
        var f = _test_field({
            label: field,
            required: true,
            validators: []
        }, undefined);

        f.form.emit('validate', {}, {});
        assert.eql(f.value, undefined);
        assert.eql(f.error, f.label + ' is required');


        var f2 = _test_field({ required: true }, 'val');
        f2.validators = [];
        f2.parse = function(val){return val;}
        f2.form.emit('validate', {}, {});
        assert.eql(f2.value, 'val');
        assert.eql(f2.data, 'val');
        assert.eql(f2.error, undefined);
    };

    exports[field + ' validate no validators'] = function(assert){
        var f = _test_field({
            validators: []
        }, 'some data');


        f.parse = function(){
            assert.eql(this.value, 'some data');
            return 'some data parsed';
        };
        f.form.emit('validate', {}, {});

        assert.eql(f.value, 'some data');
        assert.eql(f.data, 'some data parsed');
        assert.eql(f.error, undefined);
    };
};

testField('string');
exports['string parse'] = function(assert){
    var f = fields.string();

    delete f.value;

    f.value = undefined;
    assert.eql(f.parse(), '');

    f.value = null;
    assert.eql(f.parse(), '');

    f.value = 0;
    assert.eql(f.parse(), '0');

    f.value = '';
    assert.eql(f.parse(), '');

    f.value = 'some string';
    assert.eql(f.parse(), 'some string');
    
};

/*
exports['string toHTML'] = function(assert){
    test.expect(3);
    assert.eql(
        fields.string().toHTML('fieldname'),
        '<div class="field">' +
            '<label for="id_fieldname">Fieldname</label>' +
            '<input type="text" name="fieldname" id="id_fieldname" />' +
        '</div>'
    );
    var f = fields.string();
    f.widget.toHTML = function(name, field){
        assert.eql(name, 'fieldname');
        assert.eql(field, f);
        
    };
    f.toHTML('fieldname');
};

*/
testField('number');
/*
exports['number parse'] = function(assert){
    assert.ok(isNaN(fields.number().parse()));
    assert.ok(isNaN(fields.number().parse(null)));
    assert.eql(fields.number().parse(0), 0);
    assert.ok(isNaN(fields.number().parse('')));
    assert.eql(fields.number().parse('123'), 123);
    
};

exports['number toHTML'] = function(assert){
    assert.eql(
        fields.number().toHTML('fieldname'),
        '<div class="field">' +
            '<label for="id_fieldname">Fieldname</label>' +
            '<input type="text" name="fieldname" id="id_fieldname" />' +
        '</div>'
    );
    
};
*/

testField('boolean');
/*
exports['boolean parse'] = function(assert){
    assert.eql(fields.boolean().parse(), false);
    assert.eql(fields.boolean().parse(null), false);
    assert.eql(fields.boolean().parse(0), false);
    assert.eql(fields.boolean().parse(''), false);
    assert.eql(fields.boolean().parse('on'), true);
    assert.eql(fields.boolean().parse('true'), true);
    
};

exports['boolean toHTML'] = function(assert){
    assert.eql(
        fields.boolean().toHTML('fieldname'),
        '<div class="field">' +
            '<label for="id_fieldname">Fieldname</label>' +
            '<input type="checkbox" name="fieldname" id="id_fieldname" />' +
        '</div>'
    );
    
};
*/
testField('email');
/*
exports['email parse'] = function(assert){
    assert.eql(
        fields.email().parse.toString(),
        fields.string().parse.toString()
    );
    
};

exports['email toHTML'] = function(assert){
    assert.eql(
        fields.email().toHTML.toString(),
        fields.string().toHTML.toString()
    );
    
};

exports['email validators'] = function(assert){
    assert.eql(
        fields.email().validators[0].toString(),
        forms.validators.email().toString()
    );
    var fn1 = function(){return 'one';};
    var fn2 = function(){return 'two';};
    var f = fields.email({validators: [fn1, fn2]});
    assert.eql(
        f.validators[0].toString(),
        forms.validators.email().toString()
    );
    assert.eql(f.validators.slice(1), [fn1, fn2]);
    
};
*/
testField('password');
/*
exports['password parse'] = function(assert){
    assert.eql(
        fields.password().parse.toString(),
        fields.string().parse.toString()
    );
    
};

exports['password toHTML'] = function(assert){
    assert.eql(
        fields.password().toHTML.toString(),
        fields.string().toHTML.toString()
    );
    
};
*/
testField('url');
/*
exports['url parse'] = function(assert){
    assert.eql(
        fields.url().parse.toString(),
        fields.string().parse.toString()
    );
    
};

exports['url toHTML'] = function(assert){
    assert.eql(
        fields.url().toHTML.toString(),
        fields.string().toHTML.toString()
    );
    
};

exports['url validators'] = function(assert){
    assert.eql(
        fields.url().validators[0].toString(),
        forms.validators.url().toString()
    );
    var fn1 = function(){return 'one';};
    var fn2 = function(){return 'two';};
    var f = fields.url({validators: [fn1, fn2]});
    assert.eql(
        f.validators[0].toString(),
        forms.validators.url().toString()
    );
    assert.eql(f.validators.slice(1), [fn1, fn2]);
    
};
*/
testField('array');
/*
exports['array parse'] = function(assert){
    assert.eql(fields.array().parse(), []);
    assert.eql(fields.array().parse(null), [null]);
    assert.eql(fields.array().parse(0), [0]);
    assert.eql(fields.array().parse(''), ['']);
    assert.eql(fields.array().parse('abc'), ['abc']);
    assert.eql(
        fields.array().parse(['one','two','three']), ['one','two','three']
    );
    
};

exports['array toHTML'] = function(assert){
    assert.eql(
        fields.array().toHTML.toString(),
        fields.string().toHTML.toString()
    );
    
};
*/
