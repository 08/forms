var validators = require('forms').validators,
    async = require('async');


exports['matchField'] = function(assert){
    var v = validators.matchField('field1');
    var data = {
        fields: {
            field1: {data: 'one'},
            field2: {data: 'two'}
        }
    };
    v(data, data.fields.field2, function(err){
        assert.eql(err, 'Does not match field1.');
        data.fields.field2.data = 'one';
        v(data, data.fields.field2, function(err){
            assert.eql(err, undefined);
            
        });
    });
};

exports['min'] = function(assert){
    validators.min(100)('form', {data: 50}, function(err){
        assert.eql(err, 'Please enter a value greater than or equal to 100.');
        validators.min(100)('form', {data: 100}, function(err){
            assert.eql(err, undefined);
            
        });
    });
};

exports['max'] = function(assert){
    validators.max(100)('form', {data: 150}, function(err){
        assert.eql(err, 'Please enter a value less than or equal to 100.');
        validators.max(100)('form', {data: 100}, function(err){
            assert.eql(err, undefined);
            
        });
    });
};

exports['range'] = function(assert){
    validators.range(10, 20)('form', {data: 50}, function(err){
        assert.eql(err, 'Please enter a value between 10 and 20.');
        validators.range(10, 20)('form', {data: 15}, function(err){
            assert.eql(err, undefined);
            
        });
    });
};

exports['regexp'] = function(assert){
    validators.regexp(/^\d+$/)('form', {data: 'abc123'}, function(err){
        assert.eql(err, 'Invalid format.');
        validators.regexp(/^\d+$/)('form', {data: '123'}, function(err){
            assert.eql(err, undefined);
            var v = validators.regexp('^\\d+$', 'my message');
            v('form', {data: 'abc123'}, function(err){
                assert.eql(err, 'my message');
                
            });
        });
    })
};

exports['email'] = function(assert){
    validators.email()('form', {data: 'asdf'}, function(err){
        assert.eql(err, 'Please enter a valid email address.');
        validators.email()('form', {data: 'asdf@asdf.com'}, function(err){
            assert.eql(err, undefined);
            validators.email()('form', {data: 'a←+b@f.museum'}, function(err){
                assert.eql(err, undefined);
                
            });
        });
    })
};

exports['url'] = function(assert){
    validators.url()('form', {data: 'asdf.com'}, function(err){
        assert.eql(err, 'Please enter a valid URL.');
        validators.url()('form', {data: 'http://asdf.com'}, function(err){
            assert.eql(err, undefined);
            
        });
    })
};

exports['minlength'] = function(assert){
    validators.minlength(5)('form', {data:'1234'}, function(err){
        assert.eql(err, 'Please enter at least 5 characters.');
        validators.minlength(5)('form', {data:'12345'}, function(err){
            assert.eql(err, undefined);
            
        });
    });
};

exports['maxlength'] = function(assert){
    validators.maxlength(5)('form', {data:'123456'}, function(err){
        assert.eql(err, 'Please enter no more than 5 characters.');
        validators.maxlength(5)('form', {data:'12345'}, function(err){
            assert.eql(err, undefined);
            
        });
    });
};

exports['rangelength'] = function(assert){
    async.parallel([
        function(callback){
            validators.rangelength(2,4)('form', {data:'12345'}, function(err){
                assert.eql(
                    err, 'Please enter a value between 2 and 4 characters long.'
                );
                callback();
            });
        },
        function(callback){
            validators.rangelength(2,4)('form', {data:'1'}, function(err){
                assert.eql(
                    err, 'Please enter a value between 2 and 4 characters long.'
                );
                callback();
            });
        },
        function(callback){
            validators.rangelength(2,4)('form', {data:'12'}, function(err){
                assert.eql(err, undefined);
                callback();
            });
        },
        function(callback){
            validators.rangelength(2,4)('form',{data:'1234'}, function(err){
                assert.eql(err, undefined);
                callback();
            });
        },
    ], test.done);
};
