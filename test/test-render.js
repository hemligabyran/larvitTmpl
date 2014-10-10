var larvitTmpl = require('../larvitTmpl.js');

// Tests basic value declaration
exports.basicValue = function(test) {
	var tmplStr     = '<!DOCTYPE html><html><head><title data-value="title" /></head><body>test</body></html>',
	    tmplData    = {'title': 'foobar'},
	    expectedStr = '<!DOCTYPE html><html><head><title data-value="title">foobar</title></head><body>test</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Tests basic attribute declaration
exports.basicAttribute = function(test) {
	var tmplStr     = '<!DOCTYPE html><html><head><title>test</title></head><body data-attribute="foo">test</body></html>',
	    tmplData    = {'foo': {'name': 'class', 'value': 'yes'}},
	    expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body data-attribute="foo" class="yes">test</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
}

// Tests deep value declaration
exports.deepValue = function(test) {
	var tmplStr     = '<!DOCTYPE html><html><head><title data-value="foo.title" /></head><body>test</body></html>',
	    tmplData    = {'foo': {'title': 'foobar'}},
	    expectedStr = '<!DOCTYPE html><html><head><title data-value="foo.title">foobar</title></head><body>test</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Tests deep attribute declaration
exports.deepAttribute = function(test) {
	var tmplStr     = '<!DOCTYPE html><html><head><title>test</title></head><body data-attribute="foo.bar">test</body></html>',
	    tmplData    = {'foo': {'bar': {'name': 'class', 'value': 'yes'}}},
	    expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body data-attribute="foo.bar" class="yes">test</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
}

// Tests multiple attribute declaration
exports.multipleAttribute = function(test) {
	var tmplStr     = '<!DOCTYPE html><html><head><title>test</title></head><body data-attribute="foo.bar bang">test</body></html>',
	    tmplData    = {
	    	'foo': {
	    		'bar': {
	    			'name': 'class',
	    			'value': 'yes'
	    		}
	    	},
	    	'bang': {
	    		'name': 'lang',
	    		'value': 'sv'
	    	}
	    },
	    expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body data-attribute="foo.bar bang" class="yes" lang="sv">test</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
}

// Render simple array
exports.simpleArray = function(test) {
	var tmplStr     = '<!DOCTYPE html><html><head><title>test</title></head><body><p data-value="parags" /></body></html>',
	    tmplData    = {'parags': ['foo','bar']},
	    expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body><p data-value="parags">foo</p><p data-value="parags">bar</p></body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Render deep array
exports.deepArray = function(test) {
	var tmplStr = '<!DOCTYPE html><html><head><title>test</title></head><body><div data-value="lvlone"><p data-localvalue="lvltwo" /></div></body></html>';

	var tmplData = {
		'lvlone': [
			[
				{'lvltwo': 'foo'},
				{'lvltwo': 'bar'}
			],
			[
				{'lvltwo': 'bing'},
				{'lvltwo': 'bong'}
			]
		]
	};

	var expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body>' +
	    '<div data-value="lvlone"><p data-localvalue="lvltwo">foo</p><p data-localvalue="lvltwo">bar</p></div>' +
	    '<div data-value="lvlone"><p data-localvalue="lvltwo">bing</p><p data-localvalue="lvltwo">bong</p></div>' +
	    '</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Render very deep array
exports.veryDeepArray = function(test) {
	var tmplStr = '<!DOCTYPE html><html><head><title>test</title></head><body>' +
	    '<ul>' +
	    	'<li data-value="vehicles">' +
	    		'<h2 data-localvalue="type" />' +
	    		'<p>Models:</p>' +
	    		'<ul>' +
	    			'<li data-localvalue="models">' +
	    				'<p data-localattribute="skabb" data-localvalue="year">Year: </p>' +
	    				'<p>Name: <span data-localvalue="name" /></p>' +
	    			'</li>' +
	    		'</ul>' +
	    	'</li>' +
	    '</ul>' +
	    '</body></html>';

	var tmplData = {
		'vehicles': [
			{
				'type': 'car',
				'models': [
					{
						'year': 2012,
						'name': 'volvo xc',
						'skabb': {
							'name': 'class',
							'value': 'a'
						}
					},
					{
						'year': 2013,
						'name': 'volvo xc',
						'skabb': {
							'name': 'class',
							'value': 'b'
						}
					}
				]
			},
			{
				'type': 'bicycle',
				'models': [
					{
						'year': 1983,
						'name': 'crecent',
						'skabb': {
							'name': 'class',
							'value': 'c'
						}
					},
					{
						'year': 2013,
						'name': 'superawsome bike',
						'skabb': {
							'name': 'class',
							'value': 'd'
						}
					}
				]
			},
			{
				'type': 'truck',
				'models': [
					{
						'year': 2014,
						'name': 'Ford Raptor',
						'skabb': {
							'name': 'class',
							'value': 'e'
						}
					},
					{
						'year': 1987,
						'name': 'Ford Bronco',
						'skabb': {
							'name': 'class',
							'value': 'f'
						}
					}
				]
			}
		]
	};

	var expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body><ul><li data-value="vehicles"><h2 data-localvalue="type">car</h2><p>Models:</p><ul><li data-localvalue="models"><p data-localattribute="skabb" data-localvalue="year" class="a">Year: 2012</p><p>Name: <span data-localvalue="name">volvo xc</span></p></li><li data-localvalue="models"><p data-localattribute="skabb" data-localvalue="year" class="b">Year: 2013</p><p>Name: <span data-localvalue="name">volvo xc</span></p></li></ul></li><li data-value="vehicles"><h2 data-localvalue="type">bicycle</h2><p>Models:</p><ul><li data-localvalue="models"><p data-localattribute="skabb" data-localvalue="year" class="c">Year: 1983</p><p>Name: <span data-localvalue="name">crecent</span></p></li><li data-localvalue="models"><p data-localattribute="skabb" data-localvalue="year" class="d">Year: 2013</p><p>Name: <span data-localvalue="name">superawsome bike</span></p></li></ul></li><li data-value="vehicles"><h2 data-localvalue="type">truck</h2><p>Models:</p><ul><li data-localvalue="models"><p data-localattribute="skabb" data-localvalue="year" class="e">Year: 2014</p><p>Name: <span data-localvalue="name">Ford Raptor</span></p></li><li data-localvalue="models"><p data-localattribute="skabb" data-localvalue="year" class="f">Year: 1987</p><p>Name: <span data-localvalue="name">Ford Bronco</span></p></li></ul></li></ul></body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Simple disable node
exports.simpleDisable = function(test) {
	var tmplStr = '<!DOCTYPE html><html><head><title>test</title></head><body><div data-value="foo" />dummy</body></html>';

	var tmplData = {'foo': false};

	var expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body>dummy</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Disable node in array
exports.disableInArray = function(test) {
	var tmplStr = '<!DOCTYPE html><html><head><title>test</title></head><body><div data-value="foo"><p>bar</p><p data-localvalue="blubb">hidden</p></div>dummy</body></html>';

	var tmplData = {
		'foo': [
			{'blubb': false}
		]
	};

	var expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body><div data-value="foo"><p>bar</p></div>dummy</body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};
/* These does not work now, since plain text nodes are converted to <span>:s since libxmljs seems to lack support for plain text nodes
// Simple plain text node
exports.simpleTextNode = function(test) {
	var tmplStr = '<!DOCTYPE html><html><head><title>test</title></head><body><p><text data-value="foo" /></p></body></html>';

	var tmplData = {'foo': 'bar'};

	var expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body><p>bar</p></body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};

// Nested plain text node
exports.nestedTextNode = function(test) {
	var tmplStr = '<!DOCTYPE html><html><head><title>test</title></head><body><p data-value="parags"><text data-localvalue="foo" /></p></body></html>';

	var tmplData = {
		'parags': [
			{'foo':'bar'},
			{'foo':'blupp'}
		]
	};

	var expectedStr = '<!DOCTYPE html><html><head><title>test</title></head><body><p data-value="parags">bar</p><p data-value="parags">blupp</p></body></html>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
};*/

// Array of selectboxes with array of options
exports.selectBoxes = function(test) {
	var tmplStr = '<select data-value="type_select"><option data-localvalue="options" data-localattribute="optionval selected" /></select>';

	var tmplData = {
		'type_select': [
			{
				'options': [
					{
						'value': '--Choose--'
					},
					{
						'value': 'a',
						'optionval': {
							'name': 'value',
							'value': 'a'
						}
					},
					{
						'value': 'b',
						'optionval': {
							'name': 'value',
							'value': 'b'
						},
						'selected': {
							'name': 'selected',
							'value': 'selected'
						}
					}
				],
			}
		]
	};

	var expectedStr = '<!DOCTYPE html><select data-value="type_select"><option data-localvalue="options" data-localattribute="optionval selected">--Choose--</option><option data-localvalue="options" data-localattribute="optionval selected" value="a">a</option><option data-localvalue="options" data-localattribute="optionval selected" value="b" selected="selected">b</option></select>';

	larvitTmpl.render(tmplStr, tmplData, function(err, resultStr){
		test.equal(resultStr, expectedStr);
	});

	test.done();
}