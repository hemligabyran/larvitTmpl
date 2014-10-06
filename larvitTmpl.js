var xpath = require('xpath'),
    dom   = require('xmldom').DOMParser;

exports.root = './public/html';

/**
 * Render HTML template + data = HTML
 *
 * @param str tmplStr
 * @param obj data
 * @param func callback(err, HTML-string)
 */
exports.render = function(tmplStr, data, callback) {
	exports.resolvePartials(tmplStr, function(err, resolvedTmplStr){
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

		callback(null, doc.toString());
	});
}

exports.renderArray = function(node, data) {
	var dataKey      = node.getAttribute('data-value'),
	    resolvedData = getValByPath(data, dataKey);

	if (resolvedData instanceof Array) {
		for (var i = 0; i < resolvedData.length; i++) {
			var newNode          = node.cloneNode(true),
			    localNodesToFill = xpath.select('./descendant::node()[@data-localvalue]', newNode);

			// Loop through localvalue-attribute nodes
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

			node.parentNode.insertBefore(newNode, node);
		}
	} else {
		console.error('larvitTmpl - exports.renderArray() called but data could not be resolved as array');
	}
}

exports.renderLocalArray = function(node, data) {
	var dataKey = node.getAttribute('data-localvalue');

	if (data instanceof Array) {
		for (var i = 0; i < data.length; i++) {
			var newNode          = node.cloneNode(true),
			    localNodesToFill = xpath.select('./descendant::node()[@data-localvalue]', newNode);

			// Loop through localvalue-attribute nodes
			for (var i2 = 0; i2 < localNodesToFill.length; i2++) {
				var localNode         = localNodesToFill[i2],
				    localDataKey      = localNode.getAttribute('data-localvalue'),
				    localResolvedData = getValByPath(data[i], localDataKey);

				if (typeof localResolvedData == 'string' || typeof localResolvedData == 'number')
					localNode.appendChild(node.ownerDocument.createTextNode(localResolvedData));
				else if (localResolvedData instanceof Array)
					exports.renderLocalArray(localNode, localResolvedData);
			}

			if (typeof data[i] == 'string' || typeof data[i] == 'number')
				newNode.appendChild(node.ownerDocument.createTextNode(data[i]));

			node.parentNode.insertBefore(newNode, node);
		}

		// Remove the original node
		node.parentNode.removeChild(node);
	} else {
		console.error('larvitTmpl - exports.renderLocalArray() called but data could not be resoled as array');
	}
}

/**
 * Resolve partials in a template
 *
 * @param str or obj - doc The document to find and resolve partitials in.
 *                     If it is an object, it have to be an instance of an xml object
 * @param func callback(err, tmplStr)
 */
exports.resolvePartials = function(doc, callback) {
	// Todo: This should cache the results!

	if (typeof doc === 'string') {
		doc = new dom().parseFromString(doc);
	}

	var partials = xpath.select('//partial', doc);
	var tmplStr  = doc.toString();

	if ( ! partials.length)
		callback(null, tmplStr);

	for (var i = 0; i < partials.length; i++) {
		var partial     = partials[i],
		    partialName = partial.getAttribute('data-template');

		if (exports.root.substring(1, 4) == 'http') {
			// Todo: require from URL via interwebz
			console.error('larvitTmpl.js - resolvePartials() - Support for client side partials not supported yet');
		} else {
			// Not http-something, assume local file
			var fs              = require('fs'),
			    partialFilename = exports.root + '/' + partialName;

			fs.readFile(partialFilename, function(err, fileData){
				if (err) {
					console.error('larvitTmpl.js - resolvePartials() - file not found: ' + partialFilename);
					callback(new Error('Template partial not found: ' + partialFilename));
				} else {
					var partialStr = fileData.toString();

					exports.resolvePartials(partialStr, function(err, subTmplStr){
						if (err) {
							console.error('larvitTmpl.js - resolvePartials() - subResolver returned error:');
							console.error(err);
							callback(new Error('Template subResolver returned error'));
						} else {
							tmplStr = tmplStr.replace(partial.toString(), subTmplStr);

							callback(null, tmplStr);
						}
					});
				}
			});
		}

		// Remove the partial-node as its no longer needed
		partial.parentNode.removeChild(partial);
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