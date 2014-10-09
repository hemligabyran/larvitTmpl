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
