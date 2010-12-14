var wrapWith = function(tag) {
    return function(name, field) {
        var label = this.label;
        if (!label) {
            label = name[0].toUpperCase() + name.substr(1).replace('_', ' ');
        }
        var html = '<' + tag + ' class="' + field.classes().join(' ') + '">';
        // TODO: Make rendering responsibility of widget, thus
        // avoid special cases for specific types of widgets.
        if (field.widget.type == 'multipleCheckbox' ||
           field.widget.type == 'multipleRadio') {
            html += '<fieldset>' +
                '<legend>' + field.labelText(name) + '</legend>' +
                field.errorHTML() +
                field.widget.toHTML(name, field) +
            '</fieldset>';
        }
        else {
            html += field.errorHTML();
            if (field.widget.type == 'checkbox') {
                html += field.widget.toHTML(name, field) +
                field.labelHTML(name);
            }
            else {
                html += field.labelHTML(name) +
                field.widget.toHTML(name, field);
            }
        }
        return html + '</' + tag + '>';
    };
};
exports.div = wrapWith('div');
exports.p = wrapWith('p');
exports.li = wrapWith('li');

exports.table = function(name, field) {
    return '<tr class="' + field.classes().join(' ') + '">' +
        '<th>' + field.labelHTML(name) + '</th>' +
        '<td>' +
            field.errorHTML() +
            field.widget.toHTML(name, field) +
        '</td>' +
    '</tr>';
};
