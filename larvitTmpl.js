var xpath = require('xpath'),
    dom   = require('xmldom').DOMParser,
    cache = {}; // Caches the resolves

exports.root = './public/html';

/**
 * Render HTML template + data = HTML
 *
 * @param str tmplStr
 * @param obj data
 * @param func callback(err, HTML-string)
 */
exports.render = function(tmplStr, data, callback) {
	console.time('Template render');
	resolvedTmplStr = exports.resolvePartials(tmplStr);

	var doc         = new dom().parseFromString(resolvedTmplStr),
	    nodesToFill = xpath.select('//*[@data-value]', doc);

	// Walk through all nodes with a data-value
	for (var i = 0; i < nodesToFill.length; i++) {
		setNodeVal(nodesToFill[i], data);
	}

	// Walk through all the nodes with a data-attribute
	var attribsToFill = xpath.select('//*[@data-attribute]', doc);
	for (var i = 0; i < attribsToFill.length; i++) {
		setAttrVal(attribsToFill[i], data);
	}

	console.timeEnd('Template render');
	callback(null, doc.toString());
}

/**
 * Resolve partials in a template
 *
 * @param str or obj - doc The document to find and resolve partitials in.
 *                     If it is an object, it have to be an instance of an xml object
 * @param func callback(err, tmplStr)
 */
exports.resolvePartials = function(doc) {
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

function setNodeVal(node, data) {
	var dataKey      = node.getAttribute('data-value'),
	    resolvedData = getValByPath(data, dataKey);

	if (resolvedData === false) {
		// Explicitly remove the node

		node.parentNode.removeChild(node);
	} else if (resolvedData instanceof Array) {
		// Create a new element for each existing part of this array

		renderArray(node, data);

		// Remove the original node
		node.parentNode.removeChild(node);
	} else if (resolvedData != undefined) {
		// Simply append the node with some text
		node.appendChild(node.ownerDocument.createTextNode(resolvedData.toString()));
	}
}

function setAttrVal(node, data) {
	var dataKeys = node.getAttribute('data-attribute').split(' ');

	for (var i = 0; i < dataKeys.length; i++) {
		var resolvedData = getValByPath(data, dataKeys[i]);

		if ( ! (resolvedData instanceof Array))
			resolvedData = [resolvedData];

		for (var i2 = 0; i2 < resolvedData.length; i2++) {
			if (typeof resolvedData[i2] === 'object' && resolvedData[i2].name != undefined && resolvedData[i2].value != undefined) {
				var attribVal = node.getAttribute(resolvedData[i2].name);

				if (attribVal)
					attribVal += ' ' + resolvedData[i2].value;
				else
					attribVal = resolvedData[i2].value;

				node.setAttribute(resolvedData[i2].name, attribVal);
			}
		}
	}
}

function setArrNodeVal(node, data) {
	var localDataKey      = node.getAttribute('data-localvalue'),
	    localResolvedData = getValByPath(data, localDataKey);

	if (typeof localResolvedData == 'string' || typeof localResolvedData == 'number')
		node.appendChild(node.ownerDocument.createTextNode(localResolvedData));
	else if (localResolvedData instanceof Array)
		renderArray(node, localResolvedData);
}

function setArrAttrVal(node, data) {
	var localDataKeys = node.getAttribute('data-localattribute').split(' ');

	for (var i = 0; i < localDataKeys.length; i++) {
		var localResolvedData = getValByPath(data, localDataKeys[i]);

		if (typeof localResolvedData === 'object' && localResolvedData.name != undefined && localResolvedData.value != undefined) {
			var attribVal = node.getAttribute(localResolvedData.name);

			if (attribVal)
				attribVal += ' ' + localResolvedData.value;
			else
				attribVal = localResolvedData.value;

			node.setAttribute(localResolvedData.name, attribVal);
		}
	}
}

function renderArray(node, data) {
	var dataKey;

	if (node.getAttribute('data-localvalue'))
		dataKey = node.getAttribute('data-localValue');
	else if (node.getAttribute('data-value'))
		dataKey = node.getAttribute('data-value');

	var resolvedData = getValByPath(data, dataKey);

	if ( ! (resolvedData instanceof Array)) {
		var errorMsg = 'larvitTmpl - renderArray() called but data could not be resolved as array';
		console.error(errorMsg);
		return new Error(errorMsg);
	}

	for (var i = 0; i < resolvedData.length; i++) {
		var newNode            = node.cloneNode(true),
		    localNodesToFill   = xpath.select('./descendant::node()[@data-localvalue]', newNode),
		    localAttribsToFill = xpath.select('./descendant::node()[@data-localattribute]', newNode);

		// Loop through data-localvalues
		for (var i2 = 0; i2 < localNodesToFill.length; i2++) {
			setArrNodeVal(localNodesToFill[i2], resolvedData[i]);
		}

		if (typeof resolvedData[i] == 'string' || typeof resolvedData[i] == 'number')
			newNode.appendChild(node.ownerDocument.createTextNode(resolvedData[i]));
		else if (typeof resolvedData[i].value == 'string' || typeof resolvedData[i].value == 'number')
			newNode.appendChild(node.ownerDocument.createTextNode(resolvedData[i].value));

		// Loop through data-localattributes
		for (var i2 = 0; i2 < localAttribsToFill.length; i2++) {
			setArrAttrVal(localAttribsToFill[i2], resolvedData[i]);
		}

		// There might also be a localattribute on the node iteslf
		if (newNode.getAttribute('data-localattribute')) {
			setArrAttrVal(newNode, resolvedData[i]);
		}

		node.parentNode.insertBefore(newNode, node);
	}
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