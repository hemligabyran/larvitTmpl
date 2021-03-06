'use strict';

// Set search path root for resolving partials
exports.root = './public/html';

// Will be printed before the xml/html-string
exports.doctype = '<!DOCTYPE html>';

// Used to log render time to console
exports.debug = false;

// Cache used by partials engine
exports.partialCache = {'keys': [], 'results': []};

/**
 * Render HTML template + data = HTML
 *
 * @param str tmplStr
 * @param obj data
 * @param func callback(err, HTML-string)
 */
exports.render = function(tmplStr, data, callback) {
	if (exports.debug === true)
		console.time('Template render');

	var libxmljs        = require('libxmljs'),
	    resolvedTmplStr = exports.resolvePartials(tmplStr),
	    resolvedTmplStr = resolvedTmplStr.replace(/^\s+|\s+$/g, ''), // trim string
	    doc             = libxmljs.parseXmlString(resolvedTmplStr, {'noblanks': true });

	// First replace all text nodes that are not local
	var textNodes = doc.find('//text[not(@data-localvalue)]');
	for (var i = 0; i < textNodes.length; i++)
		setTextNode(textNodes[i], data);

	// Walk through all nodes with a data-value
	var nodesToFill = doc.find('//*[@data-value]');
	for (var i = 0; i < nodesToFill.length; i++)
		setNodeVal(nodesToFill[i], data);

	// Walk through all the nodes with a data-attribute
	var attribsToFill = doc.find('//*[@data-attribute]');
	for (var i = 0; i < attribsToFill.length; i++)
		setAttrVal(attribsToFill[i], data);

	// Lastly remove all nodes that are marked with removal attribute
	// After we've re-parsed the string
	// The reason we do this is removing nodes triggers a segmentation fault in libxmljs
	// if we do it while working the document. No idea why. / Lilleman 2014-10-11
	// It seems this is the reason: https://github.com/polotek/libxmljs/pull/163 / Lilleman a few minutes later
	// If we did not need to do this double parsing, performance should increase
	// For more information about this issue and possible future salvation: https://github.com/polotek/libxmljs/pull/163
	var doc2 = libxmljs.parseXmlString(doc.root().toString());
	var nodesToRemove = doc2.find('//*[@removethis = "ohyes"]');
	for (var i = 0; i < nodesToRemove.length; i++)
		nodesToRemove[i].remove();

	// We also need to make sure <textarea>-tags are not shortened,
	// since that breaks HTML parsing in many browsers
	var textareaNodes = doc2.find('//textarea');
	for (var i = 0; i < textareaNodes.length; i++)
		if (textareaNodes[i].text() == '')
			textareaNodes[i].text(' ');

	var htmlStr = exports.doctype + doc2.root().toString();

	// Strip that last space from the textareas so it wont turn up in the end output
	htmlStr = htmlStr.replace(' </textarea', '</textarea');

	if (exports.debug === true)
		console.timeEnd('Template render');

	if (typeof callback === 'function')
		callback(null, htmlStr);
	else
		console.error('larvitTmpl.js - exports.render() - callback is not passed as a function');
}

/**
 * Resolve partials in a template
 *
 * @param str or obj - doc The document to find and resolve partitials in.
 *                     If it is an object, it have to be an instance of an xml object
 * @param bol        - sub defines if this is a subcall. If it is, this setting should be set to true
 * @param func callback(err, tmplStr)
 */
exports.resolvePartials = function(xmlStr, sub) {
	if (sub !== true && exports.debug === true)
		console.time('Template resolving partials');

	var xpath = require('xpath'),
	    dom   = require('xmldom').DOMParser;

	var cacheIndex = exports.partialCache.keys.indexOf(xmlStr);
	if (cacheIndex !== -1) {
		if (sub !== true && exports.debug === true)
			console.timeEnd('Template resolving partials');

		return exports.partialCache.results[cacheIndex];
	}

	var doc      = new dom().parseFromString(xmlStr),
	    partials = xpath.select('//partial', doc),
	    tmplStr  = doc.toString();

	if ( ! partials.length)
		return tmplStr;

	for (var i = 0; i < partials.length; i++) {
		var partial     = partials[i],
		    partialName = partial.getAttribute('data-template');

		if (exports.root.substring(1, 4) == 'http') {
			// Todo: require from URL via interwebz
			console.error('larvitTmpl.js - resolvePartials() - Support for client side partials not supported yet');
			return new Error('larvitTmpl.js - resolvePartials() - Support for client side partials not supported yet');
		} else {
			// Not http-something, assume local file
			var fs              = require('fs'),
			    partialFilename = exports.root + '/' + partialName;

			var fileData = fs.readFileSync(partialFilename);
			if ( ! fileData) {
				console.error('larvitTmpl.js - resolvePartials() - file not found: ' + partialFilename);
				return new Error('Template partial not found: ' + partialFilename);
			}

			var partialStr = fileData.toString();
			partialStr = exports.resolvePartials(partialStr, true);
			if ( ! partialStr) {
				console.error('larvitTmpl.js - resolvePartials() - subResolver returned error:');
				console.error(partialStr);

				return new Error('Template subResolver returned error');
			}

			tmplStr = tmplStr.replace(partial.toString(), partialStr);
		}

		// Remove the partial-node as its no longer needed
		partial.parentNode.removeChild(partial);
	}

	exports.partialCache.keys.push(xmlStr);
	exports.partialCache.results.push(tmplStr);

	if (sub !== true && exports.debug === true)
		console.timeEnd('Template resolving partials');

	return tmplStr;
}

function setTextNode(node, data) {
	var dataKey;

	if (node.attr('data-value'))
		dataKey = node.attr('data-value').value();
	else if (node.attr('data-localvalue'))
		dataKey = node.attr('data-localvalue').value();

	var resolvedData = getValByPath(data, dataKey);
	if (typeof resolvedData == 'string' || typeof resolvedData == 'number') {
		node.name('span');
		node.text(resolvedData.toString());
	}
}

function setNodeVal(node, data) {
	if (node.attr('data-value')) {
		var dataKey      = node.attr('data-value').value(),
		    resolvedData = getValByPath(data, dataKey);

		if (resolvedData === false) {
			// Explicitly remove the node

			node.attr({'removethis':'ohyes'});
		} else if (resolvedData instanceof Array) {
			// Create a new element for each existing part of this array

			renderArray(node, data);
		} else if (resolvedData != undefined) {
			// Simply append the node with some text

			node.text(node.text() + resolvedData.toString());
		}
	} else {
		var error = new Error('setNodeVal() called, but no data-value found');
		console.error(error.stack);
	}
}

function setAttrVal(node, data) {
	var dataKeys = [];

	if (node.attr('data-attribute')) {
		dataKeys = node.attr('data-attribute').value().split(' ');
	} else if (node.attr('data-localattribute')) {
		dataKeys = node.attr('data-localattribute').value().split(' ');
	} else {
		var error = new Error('setAttrVal() called, but no data-attribute or data-localattribute found');
		console.error(error.stack);
	}

	for (var i = 0; i < dataKeys.length; i++) {
		var resolvedData = getValByPath(data, dataKeys[i]);

		if ( ! (resolvedData instanceof Array))
			resolvedData = [resolvedData];

		for (var i2 = 0; i2 < resolvedData.length; i2++) {

			// Make sure the attribute data is valid with a name (thats longer than '') and a value
			if (typeof resolvedData[i2] === 'object' && resolvedData[i2].name != undefined && resolvedData[i2].value != undefined && resolvedData[i2].name.length > 0) {

				if (node.attr(resolvedData[i2].name)) {
					// Attribute exists, append it
					var attribVal = node.attr(resolvedData[i2].name).value();
					attribVal    += ' ' + resolvedData[i2].value;
					node.attr(resolvedData[i2].name).value(attribVal);
				} else {
					// Create a new attribute
					var attrData = {};
					attrData[resolvedData[i2].name] = resolvedData[i2].value;
					node.attr(attrData);
				}
			}
		}
	}
}

function setArrNodeVal(node, data) {
	if (node.attr('data-localvalue')) {
		var localDataKey = node.attr('data-localvalue').value(),
		    localResolvedData = getValByPath(data, localDataKey);

		if (localResolvedData === false)
			node.attr({'removethis':'ohyes'});
		else if (typeof localResolvedData == 'string' || typeof localResolvedData == 'number')
			node.text(node.text() + localResolvedData.toString());
		else if (localResolvedData instanceof Array)
			renderArray(node, localResolvedData);
	} else {
		var error = new Error('setArrNodeVal() called, but no data-localvalue found');
		console.error(error.stack);
	}
}

function renderArray(node, data) {
	var libxmljs = require('libxmljs'),
	    dataKey,
	    resolvedData;

	if (data instanceof Array) {
		resolvedData = data;
	} else {
		if (node.attr('data-localvalue'))
			dataKey = node.attr('data-localValue').value();
		else if (node.attr('data-value'))
			dataKey = node.attr('data-value').value();

		resolvedData = getValByPath(data, dataKey);
	}

	if ( ! (resolvedData instanceof Array)) {
		var errorMsg = 'larvitTmpl - renderArray() called but data could not be resolved as array';
		console.error(errorMsg);
		return new Error(errorMsg);
	}

	for (var i = 0; i < resolvedData.length; i++) {
		var newNode            = node.clone(),
		    localNodesToFill   = newNode.find('./descendant::node()[@data-localvalue]'),
		    localAttribsToFill = newNode.find('./descendant::node()[@data-localattribute]');

		// Loop through data-localvalues
		for (var i2 = 0; i2 < localNodesToFill.length; i2++) {

			// If this is an array, we should produce new nodes first and then populate them
			if (resolvedData[i] instanceof Array) {
				for (var i3 = 0; i3 < resolvedData[i].length; i3++) {
					var localNewNode      = localNodesToFill[i2].clone();
					var addedLocalNewNode = localNodesToFill[i2].addPrevSibling(localNewNode);

					setArrNodeVal(addedLocalNewNode, resolvedData[i][i3]);
				}
				localNodesToFill[i2].attr({'removethis':'ohyes'});
			} else {
				setArrNodeVal(localNodesToFill[i2], resolvedData[i]);
			}
		}

		if (typeof resolvedData[i] == 'string' || typeof resolvedData[i] == 'number')
			newNode.text(resolvedData[i].toString());
		else if (typeof resolvedData[i].value == 'string' || typeof resolvedData[i].value == 'number')
			newNode.text(resolvedData[i].value.toString());

		// Loop through data-localattributes
		for (var i2 = 0; i2 < localAttribsToFill.length; i2++)
			setAttrVal(localAttribsToFill[i2], resolvedData[i]);

		// There might also be a localattribute on the node iteslf
		if (newNode.attr('data-localattribute'))
			setAttrVal(newNode, resolvedData[i]);

		// Lastly, replace text nodes. This must be done lastly, becase otherwise we might override stuff thats been done above
		var textNodes = newNode.find('./descendant-or-self::node()/text');
		for (var i2 = 0; i2 < textNodes.length; i2++)
			setTextNode(textNodes[i2], resolvedData[i]);

		node.addPrevSibling(newNode);
	}

	// Remove the original node
	node.attr({'removethis':'ohyes'});
}

/**
 * Get a deep value from an object by a string path
 * For example:
 * var foo = {'bar': {'lurker': 'someValue'}}
 * getValByPath(foo, 'bar.lurker') returns 'someValue'
 *
 * @param obj obj
 * @param str path
 * @return mixed
 */
function getValByPath(obj, path) {
	if (typeof path === 'string')
		var path = path.split('.');

	if (path.length > 1) {
		var p = path.shift();

		if (typeof obj[p] === 'object')
			return getValByPath(obj[p], path);
		else
			return undefined;

	} else {
		return obj[path[0]];
	}
}