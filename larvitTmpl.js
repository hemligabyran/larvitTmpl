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
		var dataKey      = nodesToFill[i].getAttribute('data-value'),
		    resolvedData = getValByPath(data, dataKey);

		if (resolvedData === false) {
			// Explicitly remove the node

			nodesToFill[i].parentNode.removeChild(nodesToFill[i]);
		} else if (resolvedData instanceof Array) {
			// Create a new element for each existing part of this array

			exports.renderArray(nodesToFill[i], data);

			// Remove the original node
			nodesToFill[i].parentNode.removeChild(nodesToFill[i]);
		} else if (resolvedData != undefined) {
			// Simply append the node with some text
			nodesToFill[i].appendChild(doc.createTextNode(resolvedData.toString()));
		}
	}

	// Walk through all the nodes with a data-attribute
	var attribsToFill = xpath.select('//*[@data-attribute]', doc);
	for (var i = 0; i < attribsToFill.length; i++) {
		var dataKey      = attribsToFill[i].getAttribute('data-attribute'),
		    resolvedData = getValByPath(data, dataKey);

		if (typeof resolvedData === 'object' && resolvedData.name != undefined && resolvedData.value != undefined) {
			var attribVal = attribsToFill[i].getAttribute(resolvedData.name);

			if (attribVal)
				attribVal += ' ' + resolvedData.value;
			else
				attribVal = resolvedData.value;

			attribsToFill[i].setAttribute(resolvedData.name, attribVal);
		}
	}

	console.timeEnd('Template render');
	callback(null, doc.toString());
}

exports.renderArray = function(node, data) {
	var dataKey      = node.getAttribute('data-value'),
	    resolvedData = getValByPath(data, dataKey);

	if ( ! (resolvedData instanceof Array)) {
		console.error('larvitTmpl - exports.renderArray() called but data could not be resolved as array');
		return;
	}

	for (var i = 0; i < resolvedData.length; i++) {
		var newNode          = node.cloneNode(true),
		    localNodesToFill = xpath.select('./descendant::node()[@data-localvalue]', newNode);

		// Loop through data-localvalues
		for (var i2 = 0; i2 < localNodesToFill.length; i2++) {
			var localNode         = localNodesToFill[i2],
			    localDataKey      = localNode.getAttribute('data-localvalue'),
			    localResolvedData = getValByPath(resolvedData[i], localDataKey);

			if (typeof localResolvedData == 'string' || typeof localResolvedData == 'number')
				localNode.appendChild(node.ownerDocument.createTextNode(localResolvedData));
			else if (localResolvedData instanceof Array)
				exports.renderLocalArray(localNode, localResolvedData);
		}

		if (typeof resolvedData[i] == 'string' || typeof resolvedData[i] == 'number')
			newNode.appendChild(node.ownerDocument.createTextNode(resolvedData[i]));
		else if (typeof resolvedData[i].value == 'string' || typeof resolvedData[i].value == 'number')
			newNode.appendChild(node.ownerDocument.createTextNode(resolvedData[i].value));

		if (newNode.getAttribute('data-localattribute')) {
			var localDataKey      = newNode.getAttribute('data-localattribute'),
			    localResolvedData = getValByPath(resolvedData[i], localDataKey);

			if (typeof localResolvedData === 'object' && localResolvedData.name != undefined && localResolvedData.value != undefined) {
				var attribVal = newNode.getAttribute(localResolvedData.name);

				if (attribVal)
					attribVal += ' ' + localResolvedData.value;
				else
					attribVal = localResolvedData.value;

				newNode.setAttribute(localResolvedData.name, attribVal);
			}
		}

		node.parentNode.insertBefore(newNode, node);
	}
}

exports.renderLocalArray = function(node, data) {
	var dataKey = node.getAttribute('data-localvalue');

	if ( ! (data instanceof Array)) {
		console.error('larvitTmpl - exports.renderLocalArray() called but data could not be resolved as array');
		return;
	}

	for (var i = 0; i < data.length; i++) {
		var newNode            = node.cloneNode(true),
		    localNodesToFill   = xpath.select('./descendant::node()[@data-localvalue]', newNode),
		    localAttribsToFill = xpath.select('./descendant::node()[@data-localattribute]', newNode);

		// Loop through localvalues
		for (var i2 = 0; i2 < localNodesToFill.length; i2++) {
			var localNode         = localNodesToFill[i2],
			    localDataKey      = localNode.getAttribute('data-localvalue'),
			    localResolvedData = getValByPath(data[i], localDataKey);

			if (typeof localResolvedData == 'string' || typeof localResolvedData == 'number')
				localNode.appendChild(node.ownerDocument.createTextNode(localResolvedData));
			else if (localResolvedData instanceof Array)
				exports.renderLocalArray(localNode, localResolvedData);
		}

		// If this data entry is a string or anumber, add it as a text node directly
		if (typeof data[i] == 'string' || typeof data[i] == 'number')
			newNode.appendChild(node.ownerDocument.createTextNode(data[i]));

		// Walk through all the nodes with a data-localattribute
		for (var i2 = 0; i2 < localAttribsToFill.length; i2++) {
			var dataKey      = localAttribsToFill[i2].getAttribute('data-localattribute'),
			    resolvedData = getValByPath(data, dataKey);

			if (typeof resolvedData === 'object' && resolvedData.name != undefined && resolvedData.value != undefined) {
				var attribVal = localAttribsToFill[i2].getAttribute(resolvedData.name);

				if (attribVal)
					attribVal += ' ' + resolvedData.value;
				else
					attribVal = resolvedData.value;

				localAttribsToFill[i2].setAttribute(resolvedData.name, attribVal);
			}
		}

		node.parentNode.insertBefore(newNode, node);
	}

	// Remove the original node
	node.parentNode.removeChild(node);
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