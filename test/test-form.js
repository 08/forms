var forms = require('../lib/forms');
var Form = forms.Form;


exports['instance'] = function(assert){
    var form = Form.create({
        fields: { 
            field1: forms.fields.string(),
            field2: forms.fields.string({
                validators: [function(form, field, callback){
                    assert.ok(false, 'validators should not be called');
                    callback(new Error('validation error'));
                }]
            })
        }
    });

    // unbound
    var f = new form();
    f.instance = {field1: 'data one', field2: 'data two'};
    f.init();

    // bound
    assert.eql(f.fields.field1.value, 'data one');
    assert.eql(f.fields.field1.data, 'data one');
    assert.eql(f.fields.field1.error, undefined);
    assert.eql(f.fields.field2.value, 'data two');
    assert.eql(f.fields.field2.data, 'data two');
    assert.eql(f.fields.field2.error, undefined);

    assert.eql(f.instance, {field1: 'data one', field2: 'data two'});
    assert.ok(form != f, 'Instancing returns a new object.');

};

exports['validate'] = function(assert){
    var form = Form.create({
        fields: { 
            field1: forms.fields.string(),
            field2: forms.fields.string({
                validators: [
                function(form, field, callback){
                    assert.eql(field.data, 'data two');
                    assert.eql(field.value, 'data two');
                    form.errors[field.key] = 'validation error';
                }]
            })
        }
    });

    var f = new form();
    f.instance = {field1:'data one', field2:'data two'};
    f.init();

    f.emit('validate', {}, {});
    assert.eql(f.fields.field1.value, 'data one');
    assert.eql(f.fields.field1.data, 'data one');
    assert.eql(f.fields.field1.error, undefined);
    assert.eql(f.fields.field2.error, 'validation error');

    assert.eql(f.isValid(), false);
};

exports['validate valid data'] = function(assert){
    var form = Form.create({
        fields: {
            field1: forms.fields.string(),
            field2: forms.fields.string()
        }
    });

    var f = new form();
    f.instance = {field1: '1', field2: '2'};
    f.init();

    f.emit('validate', {}, {});

    assert.eql(f.isValid(), true);

    var output = f.toHTML();
    assert.includes(output, '<div class="field"><label for="id_field1">Field1</label>' +
            '<input type="text" name="field1" id="id_field1" class="text" value="1" /></div>');

    assert.includes(output, '<div class="field"><label for="id_field2">Field2</label>' +
            '<input type="text" name="field2" id="id_field2" class="text" value="2" /></div>');

};

exports['validate invalid data'] = function(assert){
    var form = Form.create({
        fields: {
            field1: forms.fields.string({
                validators: [function(form, field, callback){
                    form.errors[field.key] = 'validation error 1';
                }]
            }),
            field2: forms.fields.string({
                validators: [function(form, field, callback){
                    form.errors[field.key] = 'validation error 2';
                }]
            })
        }
    });

    var f = new form();
    f.instance = {field1: '1', field2: '2'};
    f.init();

    f.emit('validate', {}, {});

    assert.eql(f.isValid(), false);

    var output = f.toHTML();
    assert.includes(output, '<div class="field error">' +
                '<p class="error_msg">validation error 1</p>' +
                '<label for="id_field1">Field1</label>' +
                '<input type="text" name="field1" id="id_field1" class="text" value="1" />' +
            '</div>');
    assert.includes(output, '<div class="field error">' +
                '<p class="error_msg">validation error 2</p>' +
                '<label for="id_field2">Field2</label>' +
                '<input type="text" name="field2" id="id_field2" class="text" value="2" />' +
            '</div>');

};

exports['div'] = function(assert){
    var form = Form.create({
        fields: {
            field1: forms.fields.string(),
        }
    });

    var f = new form();
    f.init();

    assert.includes(
        f.toHTML(),
        '<div class="field">' +
            '<label for="id_field1">Field1</label>' +
            '<input type="text" name="field1" id="id_field1" class="text" />' +
        '</div>'
    );
};

exports['div required'] = function(assert){
    var form = Form.create({
        fields: {
            field1: forms.fields.string({required: true}),
        }
    });

    var f = new form();
    f.init();

    assert.includes(
        f.toHTML(),
        '<div class="field required">' +
            '<label for="id_field1">Field1 <span class="required">*</span></label>' +
            '<input type="text" name="field1" id="id_field1" class="text" />' +
        '</div>'
    );
};

exports['div bound'] = function(assert){
    var form = Form.create({
        fields: {
            field1: forms.fields.string(),
        }
    });

    var f = new form();
    f.instance = { field1: 'val' };
    f.init();
    assert.includes(
        f.toHTML(),
        '<div class="field">' +
            '<label for="id_field1">Field1</label>' +
            '<input type="text" name="field1" id="id_field1" class="text" value="val" />' +
        '</div>'
    );
};



exports['div bound error'] = function(assert){
    var form = Form.create({
        fields: { 
            field1: forms.fields.string({
                validators: [
                function(form, field, callback){
                    form.errors[field.key] = 'validation error';
                }]
            })
        }
    });

    var f = new form();
    f.instance = {field1: 'val'};
    f.init();

    f.emit('validate', {}, {});

    var output = f.toHTML();
    assert.includes(output, '<div class="field error">' +
                '<p class="error_msg">validation error</p>' +
                '<label for="id_field1">Field1</label>' +
                '<input type="text" name="field1" id="id_field1" class="text" value="val" />' +
            '</div>');
};


/*

exports['handle empty'] = function(assert){
    test.expect(3);
    var f = forms.create({field1: forms.fields.string()});
    f.bind = function(){
        assert.ok(false, 'bind should not be called');
    };
    f.handle(undefined, {
        empty: function(form){
            assert.ok(true, 'empty called');
            assert.eql(form, f);
        },
        success: function(form){
            assert.ok(false, 'success should not be called');
        },
        error: function(form){
            assert.ok(false, 'error should not be called');
        },
        other: function(form){
            assert.ok(false, 'other should not be called');
        }
    });
    f.handle(null, {
        other: function(form){
            assert.ok(true, 'other called');
        }
    });
    setTimeout(test.done, 50);
};

exports['handle success'] = function(assert){
    test.expect(7);
    var f = forms.create({field1: forms.fields.string()});
    var call_order = [];
    f.bind = function(raw_data){
        call_order.push('bind');
        assert.ok(true, 'bind called');
        f.isValid = function(){return true;};
        return f;
    };
    f.validate = function(callback){
        assert.ok(true, 'validate called');
        callback(null, f);
    };
    f.handle({field1: 'test'}, {
        empty: function(form){
            assert.ok(false, 'empty should not be called');
        },
        success: function(form){
            assert.ok(true, 'success called');
            assert.eql(form, f);
        },
        error: function(form){
            assert.ok(false, 'error should not be called');
        },
        other: function(form){
            assert.ok(false, 'other should not be called');
        }
    });
    f.handle({field1: 'test'}, {
        other: function(form){
            assert.ok(true, 'other called');
            test.done();
        }
    });
};

exports['handle error'] = function(assert){
    test.expect(7);
    var f = forms.create({field1: forms.fields.string()});
    f.bind = function(raw_data, callback){
        assert.ok(true, 'bind called');
        f.fields.field1.error = 'some error';
        f.isValid = function(){return false;};
        return f;
    };
    f.validate = function(callback){
        assert.ok(true, 'validate called');
        callback(null, f);
    };
    f.handle({}, {
        empty: function(form){
            assert.ok(false, 'empty should not be called');
        },
        success: function(form){
            assert.ok(false, 'success should not be called');
        },
        error: function(form){
            assert.ok(true, 'error called');
            assert.eql(form, f);
        },
        other: function(form){
            assert.ok(false, 'other should not be called');
        }
    });
    f.handle({}, {
        other: function(form){
            assert.ok(true, 'other called');
        }
    });
    setTimeout(test.done, 50);
};

exports['handle ServerRequest GET'] = function(assert){
    var f = forms.create({field1: forms.fields.string()});
    var req = new http.IncomingMessage();
    req.method = 'GET';
    req.url = '/?field1=test';
    f.handle(req, {
        success: function(form){
            assert.eql(form.data.field1, 'test');
            test.done();
        }
    });
};

exports['handle ServerRequest POST'] = function(assert){
    var f = forms.create({field1: forms.fields.string()});
    var req = new http.IncomingMessage();
    req.method = 'POST';
    f.handle(req, {
        success: function(form){
            assert.eql(form.data.field1, 'test');
            test.done();
        }
    });
    req.emit('data', 'field1=test');
    req.emit('end');
};
*/
