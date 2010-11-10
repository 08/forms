# Note

Experimental refactoring of caolan's code. Nothing to see yet :)


# Forms

Constructing a good form by hand is a lot of work. Popular frameworks like
Ruby on Rails and Django contain code to make this process less painful.
This module is an attempt to provide the same sort of helpers for node.js.

    npm install forms

## Contribute

This code is still in its infancy, and I'd really appreciate any contributions,
bug reports or advice. Especially on the following key areas:

* __Creating sensible default rendering functions that generate flexible,
  accessible markup__. This is an early priority because without being
  confident that the standard markup won't change under their feet, developers
  will not be able to adopt the module for any sort of production use.
* __Exploring write-once validation that works on the client and the server__.
  There are some unique advantages to using the same language at both ends,
  let's try and make the most of it!
* __Ensuring it's easy to use with existing node web frameworks__. Ideally this
  module would integrate well with projects using any of the popular frameworks.
### Contributors

* [luddep](http://github.com/luddep)


## Example

    /**
     * Handles a GET/POST request for a form.
     */
    function handle_request(request, response, next) {
        forms = require('forms');
        var form = new forms.Form(function(callback){

            // Load an item from the database. This can be asynchronous.
            item.load(function(item) {

                // Build the form definition and pass it on to the callback.
                callback({
                    /**
                     * Form method. Optional. Default: POST.
                     */
                    method: 'GET',

                    /**
                     * Form action. Optional. Default: ''.
                     */
                    action: '/update',

                    /**
                     * Returns an object describing a form. Mandatory.
                     */
                    fields: function() {
                        var forms = require('forms');
                        var field_def = {};
                        // Generate form depending on loaded item.
                        for (var i in items.attributes) {
                            var field = items.attributes[i];
                            field_def[field.id] = forms.fields.string({
                                label: field.label,
                                value: item.data[field.id]
                            });
                        }
                        // Add a submit button.
                        field_def['submit'] = forms.fields.submit({
                            value: 'Submit',
                            submit: function(form, request, response, next) {
                                for (var i in item.attributes) {
                                    if (form.data[i]) {
                                        item.data[i] = form.data[i];
                                    }
                                }
                                item.save(function() {
                                    response.redirect('/' + item.path)
                                });
                            }
                        });
                        return field_def;
                    },

                    /**
                     * Renders form. Mandatory.
                     */
                    render: function(form, request, response, next) {
                        response.render(
                            'content', {
                                locals: item.renderForm(request, form)
                        });
                    }
                });
            });
        });
    }

## Available types

A list of the fields, widgets, validators and renderers available as part of
the forms module. Each of these components can be switched with customised
components following the same API.

### Fields

* string
* number
* boolean
* array
* password
* email
* url
* submit
* html

### Widgets

* text
* password
* hidden
* checkbox
* select
* textarea
* multipleCheckbox
* multipleRadio
* multipleSelect
* submit
* html

### Validators

* matchField
* min
* max
* range
* minLength
* maxLength
* rangeLength
* regexp
* email
* url

### Renderers

* div
* p
* li
* table


## API

A more detailed look at the methods and attributes available. Most of these
you will not need to use directly.

### Form object

#### Attributes

* fields - Object literal containing the field objects passed to the create
  function

#### form.handle(req, callbacks)
Inspects a request or object literal and binds any data to the correct fields.

#### form.bind(data)
Binds data to correct fields, returning a new bound form object.

#### form.toHTML(iterator)
Runs toHTML on each field returning the result. If an iterator is specified,
it is called for each field with the field name and object as its arguments,
the iterator's results are concatenated to create the HTML output, allowing
for highly customised markup.


### Bound Form object

TODO: not accurate atm.

Contains the same methods as the unbound form, plus:

#### Attributes

* data - Object containing all the parsed data keyed by field name
* fields - Object literal containing the field objects passed to the create
  function

#### form.validate(callback)
Calls validate on each field in the bound form and returns the resulting form
object to the callback.

#### form.isValid()
Checks all fields for an error attribute. Returns false if any exist, otherwise
returns true.

#### form.toHTML(iterator)
Runs toHTML on each field returning the result. If an iterator is specified,
it is called for each field with the field name and object as its arguments,
the iterator's results are concatenated to create the HTML output, allowing
for highly customised markup.


### Field object

#### Attributes

* label - Optional label text which overrides the default
* required - Boolean describing whether the field is mandatory
* validators - An array of functions which validate the field data
* widget - A widget object to use when rendering the field
* id - An optional id to override the default
* choices - A list of options, used for multiple choice fields

#### field.parse(rawdata)

Coerces the raw data from the request into the correct format for the field,
returning the result, e.g. '123' becomes 123 for the number field.

#### field.bind(rawdata)

Returns a new bound field object. Calls parse on the data and stores in the
bound field's data attribute, stores the raw value in the value attribute.

#### field.errorHTML()

Returns a string containing a HTML element containing the fields error
message, or an empty string if there is no error associated with the field.

#### field.labelText(name)

Returns a string containing the label text from field.label, or defaults to
using the field name with underscores replaced with spaces and the first
letter capitalised.

#### field.labelHTML(name, id)

Returns a string containing a label element with the correct 'for' attribute
containing the text from field.labelText(name).

#### field.classes()

Returns an array of default CSS classes considering the field's attributes,
e.g. ['field', 'required', 'error'] for a required field with an error message.

#### field.toHTML(name, iterator)

Calls the iterator with the name and field object as arguments. Defaults to
using forms.render.div as the iterator, which returns a HTML representation of
the field label, error message and widget wrapped in a div.

### Bound Field object

_same as field object, but with a few extensions_

#### Attributes

* value - The raw value from the request data
* data - The request data coerced to the correct format for this field
* error - An error message if the field fails validation

#### validate(callback)

Checks if the field is required and whether it is empty. Then runs the
validator functions in order until one fails or they all pass. If a validator
fails, the resulting message is stored in the field's error attribute.


### Widget object

#### Attributes

* classes - Custom classes to add to the rendered widget
* type - A string representing the widget type, e.g. 'text' or 'checkbox'

#### toHTML(name, field)

Returns a string containing a HTML representation of the widget for the given
field.


### Validator

A function that accepts a bound form, bound field and a callback as arguments.
It should apply a test to the field to assert its validity. Once processing
has completed it must call the callback with no arguments if the field is
valid or with an error message if the field is invalid.


### Renderer

A function which accepts a name and field as arguments and returns a string
containing a HTML representation of the field.
