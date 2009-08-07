/*!
 * LiX JavaScript CSS selector engine
 * Project since: 2009-02-18
 * Version: 1.0.6.1 build 20090807
 * 
 * Copyright (c) 2009 Shen Junru (XFSN)
 * Released under the MIT, BSD, and GPL Licenses.
*/

(function(){
// fix document.nodeType in IE5.5
if (!document.nodeType) document.nodeType = 9;

var
// the patterns for selector fragment.
PATTERN = {
	CHAR: /^\s*([>~+#*.:[,\w\u00c0-\uFFFF])/,
	GROUP: /^\s*,\s*/,
	TAG: /^\s*(\*|[\w\u00c0-\uFFFF-]+)/,
	ID: /^(\s*)#([\w\u00c0-\uFFFF-]+)/,
	FILTER: /^\s*([>~+])\s*(\*|[\w\u00c0-\uFFFF-]+)/,
	CLASS: /^(\s*)\.([\w\d\u00C0-\uFFFF-]+)/,
	PSEUDO: /^\s*:([\w\u00c0-\uFFFF-]+)(?:\((?:(['"])(.+)\2|([^\)]+\(.+\))|([^\)]+))\))?/,
	ATTR: /^\s*\[\s*([\w\u00c0-\uFFFF-]+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3)?\s*\]/,
	NTH: /(-?)(\d*)n((?:\+|-)?\d*)/
},
$break = {},
attrMap = {
	'class': 'className',
	'for': 'htmlFor'
},
/**
 * Creates syntax error message with start index of error fragment in the selector.
 * @param {Number} i start index of error selector fragment
 * @param {Object} e
 * @returns syntax error object
 * @type {SyntaxError}
 * @private
 */
syntaxErr = function(i, e){
	return e && e instanceof SyntaxError ? e : new SyntaxError('css parse error, char:' + i);
},
/**
 * parses CSS selectors string to Array object.
 * @param {String} selector CSS selectors string
 * @param {Number} index 
 * @return an array of selector fragments
 * @type {Array}
 */
parseSelector = function(selector, index){
	index = index || 0;
	var result = [], newGroup = true,
	str = selector.replace(/\s*$/, ''),
	i = 0, g = 0, l = str.length,
	m1, m2, frag, _frag;
	while (i < l) {
		str = selector.slice(i, l), m1 = PATTERN.CHAR.exec(str);
		if (!m1) throw syntaxErr(index);
		
		frag = {
			tag: '*',
			type: '',
			feature: {},
			group: g
		};
		switch (m1[1]) {
			// Filter
			case '>': case '~': case '+':
				m2 = PATTERN.FILTER.exec(str);
				if (m2) {
					frag.type = m2[1], frag.tag = m2[2];
					if (_frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
			// ID
			case '#':
				m2 = PATTERN.ID.exec(str);
				if (m2) {
					if (!m2[1]) frag = _frag || frag;
					frag.type = '#', frag.id = m2[2];
					if (m2[1] && _frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
			// Class
			case '.':
				m2 = PATTERN.CLASS.exec(str);
				if (m2) {
					if (m2[1] && _frag) _frag.next = frag, frag.prev = _frag;
					else frag = _frag || frag;
					PARSER.CLASS(frag, m2, index);
				}
				break;
			// PSEUDO
			case ':':
				m2 = PATTERN.PSEUDO.exec(str);
				if (m2) frag = _frag || frag, PARSER.PSEUDO(frag, m2, index);
				break;
			// Attr
			case '[':
				m2 = PATTERN.ATTR.exec(str);
				if (m2) frag = _frag || frag, PARSER.ATTR(frag, m2, index);
				break;
			// Group
			case ',':
				m2 = PATTERN.GROUP.exec(str);
				if (m2) newGroup = true, g++, _frag = frag = null;
				break;
			// Tag
			default:
				m2 = PATTERN.TAG.exec(str);
				if (m2) {
					frag.tag = m2[1];
					if (_frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
		}
		if (!m2) throw syntaxErr(index);
		
		i += m2[0].length, index += m2[0].length;
		if (newGroup && (_frag || frag)) result.push(_frag || frag), newGroup = false;
		
		_frag = frag;
	}
	return result;
},
// the parsers for selector fragment.
PARSER = {
	/**
	 * parse Class selector
	 * @param {Object} frag a selector fragment
	 * @param {Array} match matched result
	 * @param {Number} i the fragment start index in the selector
	 * @private
	 */
	CLASS: function(frag, match, i){
		frag.feature['.'] = frag.feature['.'] || [];
		frag.feature['.'].push(match[2]);
	},
	/**
	 * parse Pseudo-Class selector
	 * @param {Object} frag a selector fragment
	 * @param {Array} match matched result
	 * @param {Number} i the fragment start index in the selector
	 * @private
	 */
	PSEUDO: function(frag, match, i){
		try {
			var name = match[1].toLowerCase(), value = match[5] || match[4] || match[3], parser = SUB_PARSER.PSEUDO[name];
			if (value && parser) value = parser(value, name.length + i + 2);
			(frag.feature[':'] || (frag.feature[':'] = [])).push({
				name: name,
				value: value
			});
		} catch (e) {
			if (e != $break) throw syntaxErr(i, e);
		}
	},
	/**
	 * parse Attribute selector
	 * @param {Object} frag a selector fragment
	 * @param {Array} match matched result
	 * @param {Number} i the fragment start index in the selector
	 * @private
	 */
	ATTR: function(frag, match, i){
		try {
			var name = match[1], expr = match[2] || '',
			value = match[4],
			parser = SUB_PARSER.ATTR[name];
			if (value && parser) value = parser(expr, value, i);
			(frag.feature['[]'] || (frag.feature['[]'] = [])).push({
				name: attrMap[name] || name,
				expr: expr,
				value: value
			});
		} catch (e) {
			if (e != $break) throw syntaxErr(i, e);
		}
	}
},
// the parsers for special sub selector.
SUB_PARSER = {
	PSEUDO: {
		/**
		 * parse the :not sub selectors
		 * @param {String} selector sub selector
		 * @private
		 */
		not: function(selector, i){
			return parseSelector(selector, i);
		},
		/**
		 * parse the :nth-child value
		 * @param {String} selector sub selector
		 * @private
		 */
		'nth-child': function(selector){
			if (/^\bn\b$/i.test(selector)) throw $break;
			// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
			var m = PATTERN.NTH.exec(selector == 'even' && '2n' ||
			selector == 'odd' && '2n+1' ||
			!/\D/.test(selector) && '0n+' + selector ||
			selector);
			
			// calculate the numbers (a)n+(b) including if they are negative
			return {
				a: (m[1] + (m[2] || 1)) - 0,
				b: m[3] - 0
			};
		}
	},
	ATTR:{
		/**
		 * parse the [class] value
		 * @param {String} expr comparison symbols
		 * @param {String} value comparison value
		 * @private
		 */
		'class': function(expr, value){
			if (!value) return value;
			switch (expr) {
				case '*=':
					return value;
				case '|=':
				case '^=':
					return ' ' + value;
				case '$=':
					return value + ' ';
				default:
					return ' ' + value + ' ';
			}
		}
	}
},
/** 
 * The primary method of calling LiX - pass in a selector and an optional context (if no context is provided the root 'document' is used).
 * Runs the specified selector and returns an array of matched DOMElements.
 * @param {String} selector CSS selectors
 * @param {DOMElement} context context
 * @param {Object} result custom result sets object
 * @return an array of matched DOMElements
 * @type {Array}
 * @throws syntax error
 */
LiX = window.LiX = function(selector, context, result){
	context = [context || document];
	result ? result.length == null && (result.length = 0) : result = [];
	if (typeof(selector) == 'string' && isElem(context[0])) {
		try {
			lixCache = 0, lixIndex++;
			var stack = parseSelector(selector), i = 0, frag;
			while (frag = stack[i++]) 
				query(context, frag, result);
		} catch (e) {
			throw e;
		}
	}
	return result;
},
lixCache = 0, // for compute node index
lixIndex = 0, // for no duplicate
/**
 * gets matched elements from contexts by selector.
 * @param {Array} contexts an array of DOM elements
 * @param {Object} selector a selector fragment
 * @param {Array,Object} result result custom result sets object
 * @return an array of all matched elements
 * @type {Array,Object}
 * @private
 */
query = function(contexts, selector, result){
	var next = selector.next;
	if (next) {
		selector.next = null;
		var curResult = arguments.callee(contexts, selector, []);
		curResult.lenght || arguments.callee(curResult, next, result);
		// restore the selector fragment link
		selector.next = next;
	} else {
		lixCache++;
		var contexts = contextsFilter(contexts, selector), 
		allTag = selector.tag == '*' || selector.type == '',
		i = 0, context;
		try {
			while (context = contexts[i++]) 
				if (context.nodeType) FILTER[selector.type](context, selector, result || [], allTag);
		} catch (e) {
			if (e != $break) throw e;
		}
	}
	return result;
},
/**
 * inserts element to result sets, no duplicate.
 * @param {Object} result result sets
 * @param {DOMElement} node element to be insert
 * @private
 */
push = function(result, node){
	// for no duplicate
	if (lixIndex != node._lixIndex) {
		node._lixIndex = lixIndex;
		Array.prototype.push.call(result, node);
	}
},
/**
 * checks node tag.
 * @param {DOMElement} detected element
 * @param {Object} selector a selector fragment
 * @type {Boolean}
 * @private
 */
isTag = function(node, selector){
	return node.nodeName.toLowerCase() == selector.tag.toLowerCase();
},
/**
 * checks node features.
 * @param {DOMElement} detected element
 * @param {Object} selector a selector fragment
 * @param {Boolean} allTag
 * @param {Number} index node index
 * @type {Boolean}
 * @private
 */
detect = function(node, selector, allTag, index){
	var result = allTag || isTag(node, selector), expr;
	// checks class, pseudo, attribute
	for (expr in selector.feature) {
		if (!result) break;
		result = DETECT[expr](node, selector.feature[expr], index);
	}
	return result;
},
/**
 * checks object is dom element or dom document.
 * @param {Object} node detected object
 * @type {Boolean}
 * @private
 */
isElem = function(node){
	return (node && (node.nodeType == 1 || node.nodeType == 9));
},
/**
 * checks object is xml dom element or xml dom document.
 * @param {Object} node detected object
 * @type {Boolean}
 * @private
 */
isXML = function(node){
	return node.nodeType == 9 && node.documentElement.nodeName != "HTML" ||
		!!node.ownerDocument && node.ownerDocument.documentElement.nodeName != "HTML";
},
/** checks node A contains node B.
 * @param {DOMElement} nodeA detected node A
 * @param {DOMElement} nodeB detected node B
 * @type {Boolean}
 * @private
 */
contains = (function(){
	if (document.documentElement.compareDocumentPosition) return function(nodeA, nodeB){
		return (nodeA.compareDocumentPosition(nodeB) & 16) == 16;
	}
	if (document.documentElement.contains) return function(nodeA, nodeB){
		return nodeA.contains(nodeB) && nodeA != nodeB;
	};
	return function(nodeA, nodeB){
		while (nodeB = nodeB.parentNode) 
			if (nodeB == nodeA) return true;
		return false;
	}
})(),
/**
 * filters out the first context node from the parent nodes of the context nodes.
 * @param {Array} contexts
 * @param {Object} selector
 * @return an array of filtered contexts
 * @type {Array}
 */
contextsFilter = function(contexts, selector){
	var node, prevNode, i = 0, result = [];
	switch (selector.type) {
		case '~':{
			while (node = contexts[i++]) 
				if (node.nodeType) {result.push(node);break;}
			while (prevNode = node, node = contexts[i++])
				if (contains(prevNode, node)) result.push(node);
			return result;
		}
		case '':
		case '.':{
			while (node = contexts[i++]) 
				if (node.nodeType) {result.push(node);break;}
			while (prevNode = node, node = contexts[i++])
				if (contains(node, prevNode)) result = [node];
				else if (!contains(prevNode, node)) result.push(node);
			return result;
		}
		default:{
			return contexts;
		}
	}
},
attrHandle = {
	href: function(node){
		return node.getAttribute('href', 2);
	},
	src: function(node){
		return node.getAttribute('src', 2);
	},
	className: function(node){
		var value = node.className || node.getAttribute('class');
		return value ? ' ' + value + ' ' : value;
	}
},
/**
 * gets element's attribute value.
 * @param {DOMElement} node
 * @param {String} name
 * @return element's attribute value
 * @type {Object}
 * @private
 */
getAttr = function(node, name){
	return attrHandle[name] ? attrHandle[name](node) : node[name] != null ? node[name] : node.getAttribute(name);
},
/**
 * gets node index(begins at 1).
 * @param {DOMElement} detected node
 * @type {Number}
 * @private
 */
getNodeIndex = function(node){
	var i = 0, pn = node.parentNode, cn = pn.firstChild;
	if (lixCache != pn._lixCache) {
		for (; cn; cn = cn.nextSibling) 
			if (cn.nodeType == 1) cn.nodeIndex = ++i;
		pn._lixCache = lixCache;
	}
	return node.nodeIndex;
},
// Relation Filter
FILTER = {
	'': function(context, selector, result, allTag){
		var i = 0, node, nodes = context.getElementsByTagName(selector.tag);
		while (node = nodes[i++]) 
			detect(node, selector, allTag) && push(result, node);
	},
	'#': function(context, selector, result, allTag){
		var node = (context.ownerDocument || document).getElementById(selector.id);
		if (node && node.getAttributeNode('id') && detect(node, selector, allTag)) {
			(selector.prev == null || contains(context, node)) && push(result, node);
			throw $break;
		}
	},
	'>': function(context, selector, result, allTag){
		var i = 0, j = 1, node, children = context.childNodes || [];
		while (node = children[i++]) 
			(node.nodeType == 1 && detect(node, selector, allTag, j++)) && push(result, node);
	},
	'+': function(context, selector, result, allTag){
		var node = context;
		while (node = node.nextSibling) 
			if (node.nodeType == 1) {
				detect(node, selector, allTag) && push(result, node);
				break;
			}
	},
	'~': function(context, selector, result, allTag){
		var node = context;
		while (node = node.nextSibling) 
			(node.nodeType == 1 && detect(node, selector, allTag)) && push(result, node);
	},
	'.': function(context, selector, result, allTag){
		if (typeof(context.getElementsByClassName) == 'function') {
			var nodes = context.getElementsByClassName(selector['.'].join(' ')), i = 0, node;
			while (node = nodes[i++]) 
				detect(node, selector, allTag) && push(result, node);
		} else {
			selector.feature['.'] = selector['.'];
			FILTER[''](context, selector, result, allTag);
			selector['.'] = selector.feature['.'];
		}
	}
},
returnFalse = function(){return false;},
// Feature detect
DETECT = {
	':': function(node, features, index){
		var result = true, i = 0, data;
		while (result && (data = features[i++])) {
			result = (PROBE.PSEUDO[data.name] || returnFalse)(node, data.value);
		}
		return result;
	},
	'.': function(node, features){
		var classes = node.className || node.getAttribute('class'), result = true, i = 0, data;
		if(!classes) return false;
		classes = ' ' + classes + ' ';
		while (result && (data = features[i++]))
			result = classes.indexOf(data) > -1;
		return result;
	},
	'[]': function(node, features){
		var result = true, i = 0, data;
		while (result && (data = features[i++])) 
			result = (PROBE.ATTR[data.expr] || returnFalse)(getAttr(node, data.name), data.value);
		return result;
	}
},
// Node probes : call by DETECT
PROBE = {
// Attribute probes
ATTR: {
	'': function(target, value){
		return !!target;
	},
	'=': function(target, value){
		return target == value;
	},
	'!=': function(target, value){
		return target != value;
	},
	'~=': function(target, value){
		return target ? (' ' + target + ' ').indexOf(value) >= 0 : false;
	},
	'^=': function(target, value){
		return target ? target.indexOf(value) == 0 : false;
	},
	'$=': function(target, value){
		return target ? target.substr(target.length - value.length) == value : false;
	},
	'*=': function(target, value){
		return target ? target.indexOf(value) >= 0 : false;
	},
	'|=': function(target, value){
		return target ? target == value || target.substr(0, value.length + 1) == value + '-' : false;
	}
},
// PSEUDO probes
PSEUDO: {
	// form element
	input: function(node){return /input|select|textarea|button/i.test(node.nodeName);},
	button: function(node){return 'button' == node.type || node.nodeName.toUpperCase() == 'BUTTON';},
	checkbox: function(node){return 'checkbox' == node.type;},
	file: function(node){return 'file' == node.type;},
	image: function(node){return 'image' == node.type;},
	password: function(node){return 'password' == node.type;},
	radio: function(node){return 'radio' == node.type;},
	reset: function(node){return 'reset' == node.type;},
	submit: function(node){return 'submit' == node.type;},
	text: function(node){return 'text' == node.type;},
	// form element state
	enabled: function(node){return node.disabled == false && node.type != 'hidden';},
	disabled: function(node){return true;},
	checked: function(node){return node.checked == true;},
	selected: function(node){return node.selected == true;},
	// visibility
	hidden: function(node){return node.offsetWidth == 0 || node.offsetHeight == 0;},
	visible: function(node){return node.offsetWidth > 0 || node.offsetHeight > 0;},
	// content
	empty: function(node){return !node.firstChild;},
	parent: function(node){return !!node.firstChild;},
	contains: function(node, value){return (node.textContent || node.innerText || '').indexOf(value) >= 0;},
	has: function(node, value){
		var result = true, i = 0, selector;
		while (result && (selector = value[i++])) 
			result = !!(query([node], selector, []).length);
		return result;
	},
	// child
	'first-child': function(node){
		while ((node = node.previousSibling) && node.nodeType != 1);
		return !node;
	},
	'last-child': function(node){
		while ((node = node.nextSibling) && node.nodeType != 1);
		return !node;
	},
	'only-child': function(node){
		var tmp = node;
		while (tmp = tmp.previousSibling) 
			if (tmp.nodeType == 1) return false;
		tmp = node;
		while (tmp = tmp.nextSibling) 
			if (tmp.nodeType == 1) return false;
		return true;
	},
	// index
	'nth-child': function(node, value, index){
		var diff = (index || getNodeIndex(node)) - value.b;
		if (value.a == 0) return diff == 0;
		else return (diff % value.a == 0 && diff / value.a >= 0);
	},
	'gth-child': function(node, value, index){return value < (index || getNodeIndex(node));},
	'lth-child': function(node, value, index){return value > (index || getNodeIndex(node));},
	// other
	header: function(node){return /h\d/i.test(node.nodeName);},
	not: function(node, value, index){
		var result = true, i = 0, selector;
		while (result && (selector = value[i++])) {
			if(selector.type == '.') selector.type = '', selector.feature['.'] = selector['.']; 
			result = !detect(node, selector, selector.tag == '*', index);
		}
		return result;
	}
}
};

if (document.getElementsByClassName && document.documentElement.getElementsByClassName) (function(){
	var node = document.createElement('p');
	node.innerHTML = '<a class="test e"></a><a class="test"></a>';

	// can't find a second class (in Opera 9.6)
	if (node.getElementsByClassName('test e').length == 0) return;

	// caches class attributes, doesn't catch changes (in Safari 3.2)
	node.lastChild.className = 'e';
	if (node.getElementsByClassName('e').length == 1) return;

	PARSER.CLASS = function(frag, match, i){
		if (frag.type) {
			frag.feature['.'] = frag.feature['.'] || [];
			frag.feature['.'].push(match[2]);
		} else {
			frag.type = '.';
			frag['.'] = frag['.'] || [];
			frag['.'].push(match[2]);
		}
	};
	node = null; // release memory in IE
})();

SUB_PARSER.PSEUDO.has = SUB_PARSER.PSEUDO.not;

// Extension API
LiX.$break = $break,
LiX.syntaxErr = syntaxErr,
LiX.parse = parseSelector,
LiX.index = function(){return lixIndex;},
LiX.cache = function(){return lixCache;},
LiX.match = function(selector, sets, context){
	LiX(selector, context);
	var ret = [], i = 0;
	for (; i < sets.length; i++) 
		lixIndex == sets[i]._lixIndex && ret.push(sets[i]);
	return ret;
},
LiX.attr = {
	map : attrMap,
	handle: attrHandle,
	parser: SUB_PARSER.ATTR,
	probe: PROBE.ATTR
},
LiX.pseudo = {
	parser: SUB_PARSER.PSEUDO,
	probe: PROBE.PSEUDO
};
})();