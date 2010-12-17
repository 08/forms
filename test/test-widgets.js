var forms = require('../lib/forms');

var test_input = function(type){
    return function(assert){
        assert.eql(
            forms.widgets[type]().toHTML('field1'),
            '<input type="' + type + '" name="field1" id="id_field1" class="' + type + '" />'
        );
        var w = forms.widgets[type]({classes: ['test1', 'test2', 'test3']});
        assert.eql(
            w.toHTML('field2', {id:'form2_field2'}),
            '<input type="' + type + '" name="field2" id="form2_field2"' +
            ' class="test1 test2 test3" />'
        );
        assert.eql(
            forms.widgets[type]().toHTML('field1', {value:'some value'}),
            '<input type="' + type + '" name="field1" id="id_field1" class="' + type + '"' +
            ' value="some value" />'
        );
        assert.eql(forms.widgets[type]().type, type);
        
    };
};

exports['text'] = test_input('text');
exports['password'] = test_input('password');
exports['hidden'] = test_input('hidden');

exports['checkbox'] = function(assert){
    assert.eql(
        forms.widgets.checkbox().toHTML('field1'),
        '<input type="checkbox" name="field1" id="id_field1" class="checkbox" />'
    );
    var w = forms.widgets.checkbox({classes: ['test1', 'test2', 'test3']});
    assert.eql(
        w.toHTML('field2', {id:'form2_field2'}),
        '<input type="checkbox" name="field2" id="form2_field2"' +
        ' class="test1 test2 test3" />'
    );
    assert.eql(
        forms.widgets.checkbox().toHTML('field', {value:true}),
        '<input type="checkbox" name="field" id="id_field" class="checkbox" checked="checked" />'
    );
    assert.eql(
        forms.widgets.checkbox().toHTML('field', {value:false}),
        '<input type="checkbox" name="field" id="id_field" class="checkbox" />'
    );
    assert.eql(forms.widgets.checkbox().type, 'checkbox');
    
};

exports['select'] = function(assert){
    assert.eql(
        forms.widgets.select().toHTML('name', {choices: {
            val1:'text1',
            val2:'text2'
        }}),
        '<select name="name" id="id_name" class="select">' +
            '<option value="val1">text1</option>' +
            '<option value="val2">text2</option>' +
        '</select>'
    );
    assert.eql(
        forms.widgets.select({classes: ['one', 'two']}).toHTML('name', {
            choices: {
                val1:'text1',
                val2:'text2'
            },
            id: 'someid',
            value: 'val2'
        }),
        '<select name="name" id="someid" class="one two">' +
            '<option value="val1">text1</option>' +
            '<option value="val2" selected="selected">text2</option>' +
        '</select>'
    );
    assert.eql(forms.widgets.select().type, 'select');
    
};

exports['textarea'] = function(assert){
    assert.eql(
        forms.widgets.textarea().toHTML('name', {}),
        '<textarea name="name" id="id_name" class="textarea"></textarea>'
    );
    assert.eql(
        forms.widgets.textarea({
            classes: ['one', 'two'],
            rows: 20,
            cols: 80
        }).toHTML('name', {id: 'someid', value: 'value'}),
        '<textarea name="name" id="someid" class="one two" rows="20"' +
        ' cols="80">value</textarea>'
    );
    assert.eql(forms.widgets.textarea().type, 'textarea');
    
};

exports['multipleCheckbox'] = function(assert){
    var w = forms.widgets.multipleCheckbox();
    var field = {
        choices: {one:'Item one',two:'Item two',three:'Item three'},
        value: 'two'
    };
    assert.eql(
        w.toHTML('name', field),
        '<input type="checkbox" name="name" id="id_name_one" class="checkbox multiple" value="one">' +
        '<label for="id_name_one">Item one</label>' +
        '<input type="checkbox" name="name" id="id_name_two" class="checkbox multiple" value="two"' +
        ' checked="checked">' +
        '<label for="id_name_two">Item two</label>' +
        '<input type="checkbox" name="name" id="id_name_three" class="checkbox multiple" value="three">' +
        '<label for="id_name_three">Item three</label>'
    );
    assert.eql(forms.widgets.multipleCheckbox().type, 'multipleCheckbox');
    
};

exports['multipleCheckbox mutliple selected'] = function(assert){
    var w = forms.widgets.multipleCheckbox();
    var field = {
        choices: {one:'Item one',two:'Item two',three:'Item three'},
        value: ['two', 'three']
    };
    assert.eql(
        w.toHTML('name', field),
        '<input type="checkbox" name="name" id="id_name_one" class="checkbox multiple" value="one">' +
        '<label for="id_name_one">Item one</label>' +
        '<input type="checkbox" name="name" id="id_name_two" class="checkbox multiple" value="two"' +
        ' checked="checked">' +
        '<label for="id_name_two">Item two</label>' +
        '<input type="checkbox" name="name" id="id_name_three" class="checkbox multiple" value="three"' +
        ' checked="checked">' +
        '<label for="id_name_three">Item three</label>'
    );
    assert.eql(forms.widgets.multipleCheckbox().type, 'multipleCheckbox');
    
};

exports['multipleRadio'] = function(assert){
    var w = forms.widgets.multipleRadio();
    var field = {
        choices: {one:'Item one',two:'Item two',three:'Item three'},
        value: 'two'
    };
    assert.eql(
        w.toHTML('name', field),
        '<input type="radio" name="name" id="id_name_one" class="radio multiple" value="one">' +
        '<label for="id_name_one">Item one</label>' +
        '<input type="radio" name="name" id="id_name_two" class="radio multiple" value="two"' +
        ' checked="checked">' +
        '<label for="id_name_two">Item two</label>' +
        '<input type="radio" name="name" id="id_name_three" class="radio multiple" value="three">' +
        '<label for="id_name_three">Item three</label>'
    );
    assert.eql(forms.widgets.multipleRadio().type, 'multipleRadio');
    
};

exports['multipleRadio mutliple selected'] = function(assert){
    var w = forms.widgets.multipleRadio();
    var field = {
        choices: {one:'Item one',two:'Item two',three:'Item three'},
        value: ['two', 'three']
    };
    assert.eql(
        w.toHTML('name', field),
        '<input type="radio" name="name" id="id_name_one" class="radio multiple" value="one">' +
        '<label for="id_name_one">Item one</label>' +
        '<input type="radio" name="name" id="id_name_two" class="radio multiple" value="two"' +
        ' checked="checked">' +
        '<label for="id_name_two">Item two</label>' +
        '<input type="radio" name="name" id="id_name_three" class="radio multiple" value="three"' +
        ' checked="checked">' +
        '<label for="id_name_three">Item three</label>'
    );
    assert.eql(forms.widgets.multipleRadio().type, 'multipleRadio');
    
};

exports['multipleSelect'] = function(assert){
    assert.eql(
        forms.widgets.multipleSelect().toHTML('name', {choices: {
            val1:'text1',
            val2:'text2'
        }}),
        '<select multiple="mulitple" name="name" id="id_name" class="select multiple">' +
            '<option value="val1">text1</option>' +
            '<option value="val2">text2</option>' +
        '</select>'
    );
    assert.eql(
        forms.widgets.multipleSelect({classes: ['one', 'two']}).toHTML('name', {
            choices: {
                val1:'text1',
                val2:'text2',
                val3:'text3'
            },
            id: 'someid',
            value: ['val2','val3']
        }),
        '<select multiple="mulitple" name="name" id="someid" class="one two">' +
            '<option value="val1">text1</option>' +
            '<option value="val2" selected="selected">text2</option>' +
            '<option value="val3" selected="selected">text3</option>' +
        '</select>'
    );
    assert.eql(forms.widgets.multipleSelect().type, 'multipleSelect');
    
};
