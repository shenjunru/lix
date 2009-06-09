/*!
 * LiX JavaScript CSS selector engine
 * Project since: 2009-02-18
 * Version: 1.0.3.2 build 20090609
 * 
 * Copyright (c) 2009 Shen Junru
 * Released under the MIT, BSD, and GPL Licenses.
 * 
 * Inspiration:
 * 	- Some functionality inspired by [sizzle.js](http://sizzlejs.com)
*/
(function(){
// Selector Object
var Selector = function(){
	this.prev = null;
	this.next = null;
	this.group = 0;
	this.tag = '*';
	this.id = '';
	this.filter = '';
	this.detector = {};
},
// CSS Pattern
PATTERN = {
	CHAR: /^\s*([>~+#\*\w\u00c0-\uFFFF_\-.:\[,])/,
	SPLIT: /^\s*,\s*/,
	TAG: /^\s*(\*|[\w\u00c0-\uFFFF_-]+)/,
	ID: /^(\s*)#(\*|[\w\u00c0-\uFFFF_-]+)/,
	FILTER: /^\s*([>~+])\s*(\*|[\w\u00c0-\uFFFF_-]+)/,
	CLASS: /^(\s*)\.([\w\d\u00C0-\uFFFF_-]+)/,
	PSEUDO: /^\s*:(\w[\w\-]*)(?:\(([^\)]+)\))?/,
	ATTR: /^\s*\[\s*([\w\d]+)\s*(?:([!~$|*^]?=)\s*([\w\d\-\.\u00C0-\uFFFF]+|"([^"]*)"|'([^']*)')\s*)?\]/,
	NTH: /(-?)(\d*)n((?:\+|-)?\d*)/
},
$break = {},
// Throw Syntax Error
_syntaxError = function(i){
	return new SyntaxError('css parse error, char:' + i);
},
// Bind data to Selector Object
_model = {
	'.': function(selector, match, i){
		selector.detector['.'] = selector.detector['.'] || [];
		selector.detector['.'].push(match[2]);
	},
	':': function(selector, match, i){
		try {
			selector.detector[':'] = selector.detector[':'] || [];
			var name = match[1], value = match[2], parser = SUB_PARSER[':'][name];
			if (value && parser) value = parser(value);
			selector.detector[':'].push({
				name: name,
				value: value
			});
		} catch (e) {
			if (e != $break) throw _syntaxError(i);
		}
	},
	'[]': function(selector, match, i){
		try {
			selector.detector['[]'] = selector.detector['[]'] || [];
			var name = match[1], expr = match[2] || '', value = match[5] || match[4] || match[3], parser = SUB_PARSER['[]'][name];
			if (value && parser) value = parser(expr, value);
			selector.detector['[]'].push({
				name: name,
				expr: expr,
				value: value,
				target: null
			});
		} catch (e) {
			if (e != $break) throw _syntaxError(i);
		}
	}
},
SUB_PARSER = {
	':': {
		'not': function(str){
			var ret = {detector:{}}, i = 0, l = str.length, _str, m1, m2;
			while (i < l) {
				_str = str.slice(i, l), m1 = PATTERN.CHAR.exec(_str);
				if (!m1) break;
				switch (m1[1]) {
					// Class
					case '.':
						m2 = PATTERN.CLASS.exec(_str);
						if (m2) _model['.'](ret, m2);
						break;
					// PSEUDO
					case ':':
						m2 = PATTERN.PSEUDO.exec(_str);
						if (m2) _model[':'](ret, m2);
						break;
					// Attr
					case '[':
						m2 = PATTERN.ATTR.exec(_str);
						if (m2) _model['[]'](ret, m2);
						break;
				}
				i += (m2 ? m2[0] : _str).length;
			}
			return ret;
		},
		'nth-child': function(str){
			if (/^\bn\b$/i.test(str)) throw $break;
			// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
			var m = PATTERN.NTH.exec(str == 'even' && '2n' ||
			str == 'odd' && '2n+1' ||
			!/\D/.test(str) && '0n+' + str ||
			str);
			
			// calculate the numbers (a)n+(b) including if they are negative
			return {
				a: (m[1] + (m[2] || 1)) - 0,
				b: m[3] - 0
			};
		}
	},
	'[]':{
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
_parseCSS = function(str){
	var ret = [], i = 0, l = str.length, g = 0, ng = true, _str, m1, m2, sl, _sl;
	while (i < l) {
		_str = str.slice(i, l), m1 = PATTERN.CHAR.exec(_str);
		
		// Throw Syntax Error
		if (!m1) throw _syntaxError(i);
		
		sl = new Selector(), sl.group = g;
		switch (m1[1]) {
			// Filter
			case '>': case '~': case '+':
				m2 = PATTERN.FILTER.exec(_str);
				if (m2) {
					sl.filter = m2[1], sl.tag = m2[2];
					if (_sl) _sl.next = sl, sl.prev = _sl;
				}
				break;
			// ID
			case '#':
				m2 = PATTERN.ID.exec(_str);
				if (m2) {
					if (!m2[1]) sl = _sl || sl;
					sl.filter = '#', sl.id = m2[2];
					if (m2[1] && _sl) _sl.next = sl, sl.prev = _sl;
				}
				break;
			// Class
			case '.':
				m2 = PATTERN.CLASS.exec(_str);
				if (m2) {
					if (m2[1] && _sl) _sl.next = sl, sl.prev = _sl;
					else sl = _sl || sl;
					_model['.'](sl, m2, i);
				}
				break;
			// PSEUDO
			case ':':
				m2 = PATTERN.PSEUDO.exec(_str);
				if (m2) sl = _sl || sl, _model[':'](sl, m2, i);
				break;
			// Attr
			case '[':
				m2 = PATTERN.ATTR.exec(_str);
				if (m2) sl = _sl || sl, _model['[]'](sl, m2, i);
				break;
			// Group split
			case ',':
				m2 = PATTERN.SPLIT.exec(_str);
				if (m2) ng = true, g++, _sl = sl = null;
				break;
			// Tag
			default:
				m2 = PATTERN.TAG.exec(_str);
				if (m2) {
					sl.tag = m2[1];
					if (_sl) _sl.next = sl, sl.prev = _sl;
				}
				break;
		}
		// Throw Syntax Error
		if (!m2) throw _syntaxError(i);
		i += m2[0].length;
		if (ng && (_sl || sl)) ret.push(_sl || sl), ng = false;
		_sl = sl;
	}
	return ret;
};

// Fix document.nodeType in IE5.5
if (!document.nodeType) document.nodeType = 9;

// CSS query engine
var LiX = function(selector, context){
	context = _toElems(context || document);
	var ret = [];
	
	if (selector.nodeType) {
		// Handle: DOM Node
		ret.push(selector);
	} else if (typeof(selector) === 'string') {
		// Handle: String
		try {
			var stack = _parseCSS(selector), i = 0, frag;
			while ((frag = stack[i++])) 
				_query(ret, frag, context);
		} catch (e) {
			throw e;
		}
	} else {
		ret = _toElems(selector);
	}
	return ret;
},
_cache = {},
_query = function(ret, selector, context){
	var next = selector.next;
	if (next) {
		var current = [], i = 0;
		selector.next = null;
		arguments.callee(current, selector, context);
		current.lenght == 0 || arguments.callee(ret, next, current);
		// restore the selector link
		selector.next = next;
	} else {
		if(!context.length) context = document;
		var i = 0, temp, _context = _contextFilter(selector, context);
		_cache = {};
		try {
			while ((temp = _context[i++])) 
				if (temp.nodeType) FILTER[selector.filter](ret, selector, temp);
		} catch (e) {
			if (e != $break) throw e;
		}
	}
},
_tagChk = function(selector, node){
	return selector.tag == '*' ? true : node.tagName.toLowerCase() == selector.tag.toLowerCase();
},
_detector = function(selector, node, index){
	var expr, ret = true;
	// class, pseudo, attr check
	for (expr in selector.detector) {
		if (!ret) break;
		ret = DETECTOR[expr](node, selector.detector[expr], index);
	}
	return ret;
},
_AttrMap = {
	'class': 'className',
	'for': 'htmlFor',
	'id': 'id'
},
_isElem = function(obj){
	return (obj && (obj.nodeType === 1 || obj.nodeType === 9));
},
_toElems = function(obj){
	var ret = [];
	if (obj != null) {
		if (_isElem(obj)) return [obj];
		if (obj.length && typeof(obj) !== 'string' && typeof(obj) !== 'function' && !obj.setInterval) {
			for (var i = 0; i < obj.length; i++) 
				if (_isElem(obj[i])) ret.push(obj[i]);
		}
	}
	return ret;
},
_contains = function(ancestor, descendant){
	if (ancestor.compareDocumentPosition) return (ancestor.compareDocumentPosition(descendant) & 16) === 16;
	if (ancestor.contains) return ancestor.contains(descendant) && ancestor !== descendant;
	while (descendant = descendant.parentNode) 
		if (descendant == ancestor) return true;
	return false;
},
_getNodeIndex = function(node){
	var i = 0, tmp = node.parentNode.firstChild;
	if (_cache.node && _cache.node.parentNode === node.parentNode) i = _cache.index, tmp = _cache.node;
	
	for (; tmp; tmp = tmp.nextSibling) 
		if (tmp === node) {
			_cache.node = node, _cache.index = i;
			return ++i;
		} else if (tmp.nodeType === 1) ++i;
},
_contextFilter = function(selector, context){
	var node, prevNode, i = 0, ret = [];
	switch (selector.filter) {
		case '~':{
			while ((node = context[i++])) 
				if (node.nodeType) {ret.push(node);break;}
			while ((prevNode = node, node = context[i++]))
				if (_contains(prevNode, node)) ret.push(node);
			return ret;
		}
		case '':{
			while ((node = context[i++])) 
				if (node.nodeType) {ret.push(node);break;}
			while ((prevNode = node, node = context[i++]))
				if (_contains(node, prevNode)) ret = [node];
				else if (!_contains(prevNode, node)) ret.push(node);
			return ret;
		}
		default:{
			return context;
		}
	}
},
_getAttr = function(node, name){
	if (name in _AttrMap) return node[_AttrMap[name]];
	return node.getAttribute(name);
},
_setAttrTarget = function(attr, node){
	var target = _getAttr(node, attr.name);
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
	'': function(ret, selector, context){
		var i = 0, node, nodes = context.getElementsByTagName(selector.tag) || [];
		while ((node = nodes[i++])) 
			if (_detector(selector, node, null)) ret.push(node);
	},
	'#': function(ret, selector, context){
		var node = (context.ownerDocument || document).getElementById(selector.id);
		if (node && _tagChk(selector, node) && _detector(selector, node, null)) {
			if (selector.prev == null) ret.push(node);
			else if (_contains(context, node)) ret.push(node);
			throw $break;
		}
	},
	'>': function(ret, selector, context){
		var i = 0, j = 1, node, children = context.childNodes || [];
		while ((node = children[i++])) 
			if (node.nodeType == 1 && _tagChk(selector, node) && _detector(selector, node, j++)) ret.push(node);
	},
	'+': function(ret, selector, context){
		var node = context;
		while ((node = node.nextSibling)) 
			if (node.nodeType == 1) {
				if (_tagChk(selector, node) && _detector(selector, node, null)) ret.push(node);
				break;
			}
	},
	'~': function(ret, selector, context){
		var node = context;
		while ((node = node.nextSibling)) 
			if (node.nodeType == 1 && _tagChk(selector, node) && _detector(selector, node, null)) ret.push(node);
	}
},
// Result detector : call by filter
DETECTOR = {
	':': function(node, data, index){
		var ret = true, i = 0, frag;
		while (ret && (frag = data[i++])) {
			var probe = PROBE.PSEUDO[frag.name.toLowerCase()];
			ret = probe ? probe(node, frag.value, index) : false;
		}
		return ret;
	},
	'.': function(node, data, index){
		if(!node.className) return false;
		var ret = true, i = 0, frag, classes = ' ' + node.className + ' ';
		while (ret && (frag = data[i++]))
			ret = classes.indexOf(frag) > -1;
		return ret;
	},
	'[]': function(node, data, index){
		var ret = true, i = 0, attr;
		while (ret && (attr = data[i++])) {
			attr = _setAttrTarget(attr, node);
			ret = PROBE.ATTR[attr.expr](attr.target, attr.value);
		}
		return ret;
	}
},
// Element probe : call by detector
PROBE = {
// Attribute probe
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
		return target ? target.indexOf(value) === 0 : false;
	},
	'$=': function(target, value){
		return target ? target.substr(target.length - value.length) === value : false;
	},
	'*=': function(target, value){
		return target ? target.indexOf(value) >= 0 : false;
	},
	'|=': function(target, value){
		return target ? target === value || target.substr(0, value.length + 1) === value + '-' : false;
	}
},
// PSEUDO probe
PSEUDO: {
	// Form Element
	button: function(node){return 'button' === node.type || node.nodeName.toUpperCase() === 'BUTTON';},
	checkbox: function(node){return 'checkbox' === node.type;},
	file: function(node){return 'file' === node.type;},
	image: function(node){return 'image' === node.type;},
	input: function(node){return /input|select|textarea|button/i.test(node.nodeName);},
	password: function(node){return 'password' === node.type;},
	radio: function(node){return 'radio' === node.type;},
	reset: function(node){return 'reset' === node.type;},
	submit: function(node){return 'submit' === node.type;},
	text: function(node){return 'text' === node.type;},
	// Form Element State
	enabled: function(node){return node.disabled === false && node.type !== 'hidden';},
	disabled: function(node){return true;},
	checked: function(node){return node.checked === true;},
	selected: function(node){return node.selected === true;},
	// Visibility
	hidden: function(node){return node.offsetWidth === 0 || node.offsetHeight === 0;},
	visible: function(node){return node.offsetWidth > 0 || node.offsetHeight > 0;},
	// Content
	empty: function(node){return !node.firstChild;},
	parent: function(node){return !!node.firstChild;},
	contains: function(node, value){return (node.textContent || node.innerText || '').indexOf(value) >= 0;},
	has: function(node, value){return !!(new LiX(value, node)).length;},
	// Child
	'first-child': function(node){
		while (node = node.previousSibling) 
			if (node.nodeType === 1) return false;
		return true;
	},
	'last-child': function(node, value, index){
		while (node = node.nextSibling) 
			if (node.nodeType === 1) return false;
		return true;
	},
	'only-child': function(node){
		var tmp = node;
		while (tmp = tmp.previousSibling) 
			if (tmp.nodeType === 1) return false;
		tmp = node;
		while (tmp = tmp.nextSibling) 
			if (tmp.nodeType === 1) return false;
		return true;
	},
	'nth-child': function(node, value, index){
		// if (value.a == 1 && value.b == 0) return true;
		var diff = (index || _getNodeIndex(node)) - value.b;
		if (value.a == 0) return diff == 0;
		else return (diff % value.a == 0 && diff / value.a >= 0);
	},
	// Other
	header: function(node){return /h\d/i.test(node.nodeName);},
	not: function(node, value, index){return !_detector(value, node, index);}
}
};

// add functions to LiX
LiX.parseCSS = _parseCSS;
LiX.regPseudo = (function(){
	function reg(target, from){
		var name, fn;
		for (name in from) {
			fn = from[name], name = name.toLowerCase();
			if (typeof fn == 'function' && !(name in target)) target[name] = fn;
		}
	}
	return function(obj){
		for (var name in obj) {
			switch (name.toLowerCase()) {
				case 'parser':
					reg(SUB_PARSER[':'], obj[name]);
					break;
				case 'probe':
					reg(PROBE.PSEUDO, obj[name]);
					break;
			}
		}
	}
})();

// Expose
window.LiX = LiX;
window.$ = function(selector, context){
	return new LiX(selector, context);
};
})();