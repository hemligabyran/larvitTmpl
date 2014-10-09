larvitTmpl
==========

DOM Template engine for javascript

Tests are written for the module "nodeunit"

Example of usage:

    var larvitTmpl = require('larvitTmpl');

    var tmplStr  = '<p data-value="text" />';
    var tmplData = {'text': 'foobar'};
    larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
    	//resultStr is now '<p data-value="text">foobar</p>';
    });

For more examples, see the test folder