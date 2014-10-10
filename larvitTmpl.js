// Set search path root for resolving partials
exports.root = './public/html';

// Will be printed before the xml/html-string
exports.doctype = '<!DOCTYPE html>';

/**
 * Render HTML template + data = HTML
 *
 * @param str tmplStr
 * @param obj data
 * @param func callback(err, HTML-string)
 */
exports.render = function(tmplStr, data, callback) {
	console.time('Template render');

	var libxmljs        = require('libxmljs'),
	    resolvedTmplStr = exports.resolvePartials(tmplStr),
	    doc             = libxmljs.parseXmlString(resolvedTmplStr, { noblanks: true });

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

	console.timeEnd('Template render');
	if (typeof callback === 'function')
		callback(null, exports.doctype + doc.root().toString());
	else
		console.error('larvitTmpl.js - exports.render() - callback is not passed as a function');
}

/**
 * Resolve partials in a template
 *
 * @param str or obj - doc The document to find and resolve partitials in.
 *                     If it is an object, it have to be an instance of an xml object
 * @param func callback(err, tmplStr)
 */
exports.resolvePartials = function(doc) {
	var xpath = require('xpath'),
	    dom   = require('xmldom').DOMParser,
	    cache = {}; // Caches the resolves

	if (typeof doc === 'string') {
		if (cache[doc] !== undefined)
			return cache[doc];

		doc = new dom().parseFromString(doc);
	}

	var partials = xpath.select('//partial', doc);
	var tmplStr  = doc.toString();

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
			partialStr = exports.resolvePartials(partialStr);
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

	cache[doc] = tmplStr;
	return tmplStr;
}

function setTextNode(node, data) {
	var dataKey;

	if (node.attr('data-value'))
		dataKey = node.attr('data-value').value();
	else if (node.attr('data-localvalue'))
		dataKey = node.attr('data-localvalue').value();

	resolvedData = getValByPath(data, dataKey);
	if (typeof resolvedData == 'string' || typeof resolvedData == 'number') {
		node.name('span');
		node.text(resolvedData.toString());
	}
}

function setNodeVal(node, data) {
	var dataKey      = node.attr('data-value').value(),
	    resolvedData = getValByPath(data, dataKey);

	if (resolvedData === false) {
		// Explicitly remove the node

		node.remove();
	} else if (resolvedData instanceof Array) {
		// Create a new element for each existing part of this array

		renderArray(node, data);
	} else if (resolvedData != undefined) {
		// Simply append the node with some text

		node.text(node.text() + resolvedData.toString());
	}
}

function setAttrVal(node, data) {
	var dataKeys;

	if (node.attr('data-attribute'))
		dataKeys = node.attr('data-attribute').value().split(' ');
	else if (node.attr('data-localattribute'))
		dataKeys = node.attr('data-localattribute').value().split(' ');

	for (var i = 0; i < dataKeys.length; i++) {
		var resolvedData = getValByPath(data, dataKeys[i]);

		if ( ! (resolvedData instanceof Array))
			resolvedData = [resolvedData];

		for (var i2 = 0; i2 < resolvedData.length; i2++) {
			if (typeof resolvedData[i2] === 'object' && resolvedData[i2].name != undefined && resolvedData[i2].value != undefined) {

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
	var localDataKey      = node.attr('data-localvalue').value(),
	    localResolvedData = getValByPath(data, localDataKey);

	if (localResolvedData === false)
		node.remove();
	if (typeof localResolvedData == 'string' || typeof localResolvedData == 'number')
		node.text(node.text() + localResolvedData.toString());
	else if (localResolvedData instanceof Array)
		renderArray(node, localResolvedData);
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
				localNodesToFill[i2].remove();
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
	node.remove();
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