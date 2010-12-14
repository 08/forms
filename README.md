# Note

Experimental refactoring of caolan's code. Nothing to see yet :)


# Forms

Constructing a good form by hand is a lot of work. Popular frameworks like
Ruby on Rails and Django contain code to make this process less painful.
This module is an attempt to provide the same sort of helpers for node.js.

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

    // Generate a new form.
    var userLoginForm = forms.Form.create({
        // Provide a view object to use with response.render.
        // If none is provided, output will simply be printed without
        // themeing.
        view: view('content'),

        // Local variables for use in the view.
        // The form output will be placed in the 'content'
        // local.
        locals: {
          title: 'Login',
          pageTitle: 'Login',
        },

        // Fields to display in form.
        fields: {
            name: forms.fields.string({
                label: 'Name',
                required: true,
                widget: forms.widgets.text({classes: ['text']})
            }),
            password: forms.fields.password({
                label: 'Password',
                required: true,
                widget: forms.widgets.password({classes: ['text password']})
            }),
            login: forms.fields.submit({
                value: 'Login'
            }),
        },

    });

    // Forms are event emitters, listen for the following events:

    // Validate the form.
    userLoginForm.on('validate', function(req, res) {
        user = require('./user');
        if (user.loadUser(this.instance.name, this.instance.password) === null) {
            // Set the error for each individual field.
            // Any errors will cause validation to fail.
            this.errors['name'] = 'Invalid login credentials';
            this.errors['password'] = true;
        }
    });

    // Actions to take when validation succeeds.
    userLoginForm.on('success', function(req, res) {
        var user = require('./user');
        var name = this.instance.name || null;
        var password = this.instance.password || null;

        // Redirect once we have been logged in.
        user.authenticate(name, password, req, function(err) {
            if (!err) {
                console.log('Logged in ' + name);
                res.redirect('/user');
            }
        });
    });

    // Page handlers for this form.
    app.get('/login', userLoginForm.load(), function(req, res) {
      req.form.render(req, res); // display the form on get requests
    });

    app.post('/login', userLoginForm.load(), function(req, res) {
      req.form.process(req, res); // process the form on submission
    });



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

#### form.toHTML(iterator)
Runs toHTML on each field returning the result. If an iterator is specified,
it is called for each field with the field name and object as its arguments,
the iterator's results are concatenated to create the HTML output, allowing
for highly customised markup.


#### form.isValid()
Checks all fields for an error attribute. Returns false if any exist, otherwise
returns true.

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
