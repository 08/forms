var forms = require('../lib/forms');
var Form = forms.Form;


exports['create'] = function(assert){
    var testform = Form.create({
        action: '/test',
        method: 'POST',
        fields: {
            field1: forms.fields.string(),
            field2: forms.fields.string(),
         },
    });

    f = new testform();
    f.init();

    var output = f.toHTML();

    assert.includes(output, '<div class="field"><label for="id_field1">Field1</label>' +
            '<input type="text" name="field1" id="id_field1" class="text" /></div>');

    assert.includes(output, '<div class="field"><label for="id_field2">Field2</label>' +
            '<input type="text" name="field2" id="id_field2" class="text" /></div>');
};
