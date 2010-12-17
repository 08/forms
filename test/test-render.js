var forms = require('../lib/forms'),
    Form = forms.Form;


var testWrap = function(tag){
    exports[tag] = function(assert){
        var form = Form.create({fields : {fieldname: forms.fields.string()}});
        var f = new form();
        f.init();

        assert.includes(
                f.toHTML(forms.render[tag]),
                '<' + tag + ' class="field">' +
                '<label for="id_fieldname">Fieldname</label>' +
                '<input type="text" name="fieldname" id="id_fieldname" class="text" />' +
                '</' + tag + '>'
                );

    };

    exports[tag + ' required'] = function(assert){
        var form = Form.create({fields: {
            fieldname: forms.fields.string({required:true})
        }});
        var f = new form();
        f.init();
        assert.includes(
                f.toHTML(forms.render[tag]),
                '<' + tag + ' class="field required">' +
                '<label for="id_fieldname">Fieldname <span class="required">*</span></label>' +
                '<input type="text" name="fieldname" id="id_fieldname" class="text" />' +
                '</' + tag + '>'
                );

    };

    exports[tag + ' bound'] = function(assert){
        var form = Form.create({fields: {name: forms.fields.string()}});
        var f = new form();
        f.instance = {name: 'val'};
        f.init();

        f.emit('validate', {}, {});

        assert.includes(
                f.toHTML(forms.render[tag]),
                '<' + tag + ' class="field">' +
                '<label for="id_name">Name</label>' +
                '<input type="text" name="name" id="id_name" class="text" value="val" />' +
                '</' + tag + '>'
                );
    };

    exports[tag + ' bound error'] = function(assert){
        var form = Form.create({fields: {
            field_name: forms.fields.string({
                            validators: [function(form, field, callback){
                                            form.errors[field.key] = 'validation error';
                                        }]
                        })
        }});
        var f = new form();
        f.instance = {field_name: 'val'};
        f.init();
        f.emit('validate', {}, {});
        
        assert.includes(
                f.toHTML(forms.render[tag]),
                '<' + tag + ' class="field error">' +
                '<p class="error_msg">validation error</p>' +
                '<label for="id_field_name">Field name</label>' +
                '<input type="text" name="field_name" id="id_field_name" class="text" ' +
                'value="val" />' +
                '</' + tag + '>'
                );
    };

    exports[tag + ' multipleCheckbox'] = function(assert){
        var form = Form.create({fields: {
            fieldname: forms.fields.string({
                           choices: {one: 'item one'},
                widget: forms.widgets.multipleCheckbox()
                       })
        }});
        var f = new form();
        f.init();
        assert.includes(
                f.toHTML(forms.render[tag]),
                '<' + tag + ' class="field">' +
                '<fieldset>' +
                '<legend>Fieldname</legend>' +
                '<input type="checkbox" name="fieldname" id="id_fieldname_one"'+
                ' class="checkbox multiple" value="one">' +
                '<label for="id_fieldname_one">item one</label>' +
                '</fieldset>' +
                '</' + tag + '>'
                );

    };

    exports[tag + ' multipleRadio'] = function(assert){
        var form = Form.create({fields: {
            fieldname: forms.fields.string({
                           choices: {one: 'item one'},
                widget: forms.widgets.multipleRadio()
                       })
        }});
        var f = new form();
        f.init();
        assert.includes(
                f.toHTML(forms.render[tag]),
                '<' + tag + ' class="field">' +
                '<fieldset>' +
                '<legend>Fieldname</legend>' +
                '<input type="radio" name="fieldname" id="id_fieldname_one"'+
                ' class="radio multiple" value="one">' +
                '<label for="id_fieldname_one">item one</label>' +
                '</fieldset>' +
                '</' + tag + '>'
                );

    };

};

testWrap('div');
testWrap('p');
testWrap('li');

exports['table'] = function(assert){
    var form = Form.create({fields: {fieldname: forms.fields.string()}});
    var f = new form();
    f.init();
    assert.includes(
            f.toHTML(forms.render.table),
            '<tr class="field">' +
            '<th><label for="id_fieldname">Fieldname</label></th>' +
            '<td>' +
            '<input type="text" name="fieldname" id="id_fieldname" class="text" />' +
            '</td>' +
            '</tr>'
            );

};

exports['table required'] = function(assert){
    var form = Form.create({fields: {
        fieldname: forms.fields.string({required:true})
    }});
    var f = new form();
    f.init();
    assert.includes(
            f.toHTML(forms.render.table),
            '<tr class="field required">' +
            '<th><label for="id_fieldname">Fieldname <span class="required">*</span></label></th>' +
            '<td>' +
            '<input type="text" name="fieldname" id="id_fieldname" class="text" />' +
            '</td>' +
            '</tr>'
            );

};

exports['table bound'] = function(assert){
    var form = Form.create({fields: {name: forms.fields.string()}});
    var f = new form();
    f.instance = {name: 'val'};
    f.init();
        f.emit('validate', {}, {});
    
    assert.includes(
            f.toHTML(forms.render.table),
            '<tr class="field">' +
            '<th><label for="id_name">Name</label></th>' +
            '<td>' +
            '<input type="text" name="name" id="id_name"' +
            ' class="text" value="val" />' +
            '</td>' +
            '</tr>'
            );
};

exports['table bound error'] = function(assert){
    var form = Form.create({fields: {
        field_name: forms.fields.string({
                        validators: [function(form, field, callback){
                                        form.errors[field.key] = 'validation error';
                                    }]
                    })
    }});
    var f = new form();
    f.instance = {field_name: 'val'};
    f.init();
        f.emit('validate', {}, {});
    
    assert.includes(
            f.toHTML(forms.render.table),
            '<tr class="field error">' +
            '<th><label for="id_field_name">Field name</label></th>' +
            '<td>' +
            '<p class="error_msg">validation error</p>' +
            '<input type="text" name="field_name"' +
            ' id="id_field_name" class="text" value="val" />' +
            '</td>' +
            '</tr>'
            );
};
