/*!
 * LiX JavaScript CSS selector engine
 * Project since: 2009-02-18
 * Version: 1.0.5 build 20090723
 * 
 * Copyright (c) 2009 Shen Junru (XFSN)
 * Released under the MIT, BSD, and GPL Licenses.
*/

(function(){
// fix document.nodeType in IE5.5
if (!document.nodeType) document.nodeType = 9;

var
/**
 * @class Selector Fragment
 * @constructor
 * @private
 */
Frag = function(){
	this.prev = null;
	this.next = null;
	this.group = 0;
	this.tag = '*';
	this.id = '';
	this.type = '';
	this.feature = {};
},
// the patterns for selector fragment.
PATTERN = {
	CHAR: /^\s*([>~+#*.:[,\w\u00c0-\uFFFF])/,
	GROUP: /^\s*,\s*/,
	TAG: /^\s*(\*|[\w\u00c0-\uFFFF-]+)/,
	ID: /^(\s*)#(\*|[\w\u00c0-\uFFFF-]+)/,
	FILTER: /^\s*([>~+])\s*(\*|[\w\u00c0-\uFFFF-]+)/,
	CLASS: /^(\s*)\.([\w\d\u00C0-\uFFFF-]+)/,
	PSEUDO: /^\s*:(\w[\w-]*)(?:\((?:(['"])(.+)\2|([^\)]+\(.+\))|([^\)]+))\))?/,
	ATTR: /^\s*\[\s*([\w\d]+)\s*(?:([!~$|*^]?=)\s*([\w\d\u00C0-\uFFFF.-]+|"([^"]*)"|'([^']*)')\s*)?\]/,
	NTH: /(-?)(\d*)n((?:\+|-)?\d*)/
},
$break = {},
/**
 * Creates syntax error message with start index of error fragment in the selector.
 * @param {Number} i start index of error fragment
 * @param {Object} e
 * @returns syntax error object
 * @type {SyntaxError}
 * @private
 */
syntaxErr = function(i, e){
	return e && e instanceof SyntaxError ? e : new SyntaxError('css parse error, char:' + i);
},
/**
 * The method of parse CSS selectors string to JavaScript object.
 * @param {String} selector
 * @return an array of selector fragments
 * @type {Array} 
 */
parseSelector = function(selector, ei){
	ei = ei || 0;
	var result = [], g = 0, i = 0, l = selector.length, newGroup = true, _selector, m1, m2, frag, _frag;
	while (i < l) {
		_selector = selector.slice(i, l), m1 = PATTERN.CHAR.exec(_selector);
		
		// throw syntax error
		if (!m1) throw syntaxErr(ei);
		
		frag = new Frag(), frag._fragroup = g;
		switch (m1[1]) {
			// Filter
			case '>': case '~': case '+':
				m2 = PATTERN.FILTER.exec(_selector);
				if (m2) {
					frag.type = m2[1], frag.tag = m2[2];
					if (_frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
			// ID
			case '#':
				m2 = PATTERN.ID.exec(_selector);
				if (m2) {
					if (!m2[1]) frag = _frag || frag;
					frag.type = '#', frag.id = m2[2];
					if (m2[1] && _frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
			// Class
			case '.':
				m2 = PATTERN.CLASS.exec(_selector);
				if (m2) {
					if (m2[1] && _frag) _frag.next = frag, frag.prev = _frag;
					else frag = _frag || frag;
					PARSER.CLASS(frag, m2, ei);
				}
				break;
			// PSEUDO
			case ':':
				m2 = PATTERN.PSEUDO.exec(_selector);
				if (m2) frag = _frag || frag, PARSER.PSEUDO(frag, m2, ei);
				break;
			// Attr
			case '[':
				m2 = PATTERN.ATTR.exec(_selector);
				if (m2) frag = _frag || frag, PARSER.ATTR(frag, m2, ei);
				break;
			// Group
			case ',':
				m2 = PATTERN.GROUP.exec(_selector);
				if (m2) newGroup = true, g++, _frag = frag = null;
				break;
			// Tag
			default:
				m2 = PATTERN.TAG.exec(_selector);
				if (m2) {
					frag.tag = m2[1];
					if (_frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
		}
		// Throw Syntax Error
		if (!m2) throw syntaxErr(ei);
		i += m2[0].length, ei += m2[0].length;
		if (newGroup && (_frag || frag)) result.push(_frag || frag), newGroup = false;
		_frag = frag;
	}
	return result;
},
// the parsers for selector fragment.
PARSER = {
	/**
	 * parse Class selector
	 * @param {Frag} frag an instance of Frag
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
	 * @param {Frag} frag an instance of Frag
	 * @param {Array} match matched result
	 * @param {Number} i the fragment start index in the selector
	 * @private
	 */
	PSEUDO: function(frag, match, i){
		try {
			frag.feature[':'] = frag.feature[':'] || [];
			var name = match[1].toLowerCase(), value = match[5] || match[4] || match[3], parser = SUB_PARSER.PSEUDO[name];
			if (value && parser) value = parser(value, name.length + i + 2);
			frag.feature[':'].push({
				name: name,
				value: value
			});
		} catch (e) {
			if (e != $break) throw syntaxErr(i, e);
		}
	},
	/**
	 * parse Attribute selector
	 * @param {Frag} frag an instance of Frag
	 * @param {Array} match matched result
	 * @param {Number} i the fragment start index in the selector
	 * @private
	 */
	ATTR: function(frag, match, i){
		try {
			frag.feature['[]'] = frag.feature['[]'] || [];
			var name = match[1], expr = match[2] || '',
			value = match[5] || match[4] || match[3],
			parser = SUB_PARSER.ATTR[name];
			if (value && parser) value = parser(expr, value, i);
			frag.feature['[]'].push({
				name: name,
				expr: expr,
				value: value,
				target: null
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
		 * @param {String} selector
		 */
		not: function(selector, i){
			return parseSelector(selector, i);
		},
		/**
		 * parse the :nth-child value
		 * @param {String} selector
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
		 * @param {String} expr
		 * @param {String} value
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
 * @param {Object} result custom result set object
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
				query(result, frag, context);
		} catch (e) {
			throw e;
		}
	}
	return result;
},
lixCache = 0, // for compute node index
lixIndex = 0, // for no duplicate
query = function(result, frag, context){
	var next = frag.next;
	if (next) {
		var current = [], i = 0;
		frag.next = null;
		arguments.callee(current, frag, context);
		current.lenght == 0 || arguments.callee(result, next, current);
		// restore the selector frag link
		frag.next = next;
	} else {
		if(!context.length) context = document;
		var i = 0, temp, _context = contextFilter(frag, context);
		lixCache++;
		try {
			while (temp = _context[i++]) 
				if (temp.nodeType) FILTER[frag.type](result, frag, temp);
		} catch (e) {
			if (e != $break) throw e;
		}
	}
	return result;
},
push = function(result, node){
	// for no duplicate
	if (lixIndex != node._lixIndex) {
		node._lixIndex = lixIndex;
		Array.prototype.push.call(result, node);
	}
},
/**
 * checks node tag.
 * @param {Frag} frag an instance of Frag
 * @param {DOMElement} detected element
 * @type {Boolean}
 * @private
 */
tagChk = function(frag, node){
	return frag.tag == '*' ? true : node.nodeName.toLowerCase() == frag.tag.toLowerCase();
},
/**
 * checks node features.
 * @param {Frag} frag an instance of Frag
 * @param {DOMElement} detected element
 * @param {Object} index node index
 * @type {Boolean}
 * @private
 */
detect = function(frag, node, index){
	var expr, result = true;
	// class, pseudo, attr check
	for (expr in frag.feature) {
		if (!result) break;
		result = DETECT[expr](node, frag.feature[expr], index);
	}
	return result;
},
AttrMap = {
	'class': 'className',
	'for': 'htmlFor',
	'id': 'id'
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
/**
 * checks object is dom element or dom document.
 * @param {Object} node detected object
 * @type {Boolean}
 * @private
 */
isElem = function(node){
	return (node && (node.nodeType == 1 || node.nodeType == 9));
},
/** checks node A is contains node B.
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
/**
 * filters out the first context node from the parent nodes of the context nodes.
 * @param {Object} frag
 * @param {Object} context
 * @return an array of filter results
 * @type {Array}
 */
contextFilter = function(frag, context){
	var node, prevNode, i = 0, result = [];
	switch (frag.type) {
		case '~':{
			while (node = context[i++]) 
				if (node.nodeType) {result.push(node);break;}
			while (prevNode = node, node = context[i++])
				if (contains(prevNode, node)) result.push(node);
			return result;
		}
		case '':{
			while (node = context[i++]) 
				if (node.nodeType) {result.push(node);break;}
			while (prevNode = node, node = context[i++])
				if (contains(node, prevNode)) result = [node];
				else if (!contains(prevNode, node)) result.push(node);
			return result;
		}
		default:{
			return context;
		}
	}
},
getAttr = function(node, name){
	if (name in AttrMap) return node[AttrMap[name]];
	return node.getAttribute(name);
},
setAttrTarget = function(attr, node){
	var target = getAttr(node, attr.name);
	switch (attr.name) {
		case 'class':{
			attr.target = target ? ' ' + target + ' ' : null;
			break;
		}
		default:{
			attr.target = target;
		}
	}
	return attr;
},
// Relation Filter
FILTER = {
	'': function(result, frag, context){
		var i = 0, node, nodes = context.getElementsByTagName(frag.tag) || [];
		while (node = nodes[i++]) 
			if (detect(frag, node, null)) push(result, node);
	},
	'#': function(result, frag, context){
		var node = (context.ownerDocument || document).getElementById(frag.id);
		if (node && node.getAttributeNode('id') && tagChk(frag, node) && detect(frag, node, null)) {
			if (frag.prev == null || contains(context, node)) push(result, node);
			throw $break;
		}
	},
	'>': function(result, frag, context){
		var i = 0, j = 1, node, children = context.childNodes || [];
		while (node = children[i++]) 
			if (node.nodeType == 1 && tagChk(frag, node) && detect(frag, node, j++)) push(result, node);
	},
	'+': function(result, frag, context){
		var node = context;
		while (node = node.nextSibling) 
			if (node.nodeType == 1) {
				if (tagChk(frag, node) && detect(frag, node, null)) push(result, node);
				break;
			}
	},
	'~': function(result, frag, context){
		var node = context;
		while (node = node.nextSibling) 
			if (node.nodeType == 1 && tagChk(frag, node) && detect(frag, node, null)) push(result, node);
	}
},
// Feature detect
DETECT = {
	':': function(node, data, index){
		var result = true, i = 0, frag;
		while (result && (frag = data[i++])) {
			var probe = PROBE.PSEUDO[frag.name];
			result = probe ? probe(node, frag.value, index) : false;
		}
		return result;
	},
	'.': function(node, data, index){
		if(!node.className) return false;
		var result = true, i = 0, frag, classes = ' ' + node.className + ' ';
		while (result && (frag = data[i++]))
			result = classes.indexOf(frag) > -1;
		return result;
	},
	'[]': function(node, data, index){
		var result = true, i = 0, attr;
		while (result && (attr = data[i++])) {
			attr = setAttrTarget(attr, node);
			result = PROBE.ATTR[attr.expr](attr.target, attr.value);
		}
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
	has: function(node, stack, index){
		var i = 0, frag, result = true;
		while (result && (frag = stack[i++])) 
			result = !!(query([], frag, [node]).length);
		return result;
	},
//	has: function(node, value){return !!(new LiX(value, node)).length;},
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
	not: function(node, stack, index){
		var i = 0, frag, result = true;
		while (result && (frag = stack[i++])) 
			result = !(tagChk(frag, node) && detect(frag, node, index));
		return result;
	}
}
};

SUB_PARSER.PSEUDO.has = SUB_PARSER.PSEUDO.not;

// add functions to LiX
LiX.parseSelector = parseSelector;
})();