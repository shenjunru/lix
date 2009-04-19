/*!
 * LiX JavaScript CSS selector engine
 * Project began: 2009-02-18
 * Version: 1.0-1 build 20090419
 * 
 * Copyright (c) 2009 Shen Junru
 * Dual licensed under the MIT and GPL licenses.
 * 
 * Inspiration:
 * 	- Some functionality inspired by [jQuery.js](http://jQuery.com) Copyright (c) 2009 John Resig, [MIT and GPL licenses](http://docs.jquery.com/License)
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
// Bind data to selector
_model = {
	'.': function(selector, match){
		selector.detector['.'] = selector.detector['.'] || [];
		selector.detector['.'].push(match[2]);
	},
	':': function(selector, match){
		selector.detector[':'] = selector.detector[':'] || [];
		var ret = { name: match[1], value: match[2] };
		
		if (ret.value) {
			switch (ret.name) {
				case 'not':{
					ret.value = _parseSimple(ret.value);
					break;
				}
				case 'nth-child':{
					// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
					var m = PATTERN.NTH.exec(ret.value == 'even' && '2n' ||
					ret.value == 'odd' && '2n+1' ||
					!/\D/.test(ret.value) && '0n+' + ret.value ||
					ret.value);
					
					// calculate the numbers (a)n+(b) including if they are negative
					ret.value = {
						a: (m[1] + (m[2] || 1)) - 0,
						b: m[3] - 0
					};
					break;
				}
			}
		}
		selector.detector[':'].push(ret);
	},
	'[]': function(selector, match){
		selector.detector['[]'] = selector.detector['[]'] || [];
		var ret = {
			name: match[1],
			match: match[2] || '',
			value: match[5] || match[4] || match[3],
			target: null
		};
		
		switch (ret.name) {
			case 'class':{
				var value = ret.value;
				if (!value) break;
				switch (ret.match) {
					case '*=':
						break;
					case '|=': case '^=':
						value = ' ' + value;
						break;
					case '$=':
						value = value + ' ';
						break;
					default:
						value = ' ' + value + ' ';
						break;
				}
				ret.value = value;
				break;
			}
		}
		selector.detector['[]'].push(ret);
	}
},
_parseSimple = function(str){
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
_parseCSS = function(str){
	var ret = [], i = 0, l = str.length, g = 0, ng = true, _str, m1, m2, sl, _sl;
	while (i < l) {
		_str = str.slice(i, l), m1 = PATTERN.CHAR.exec(_str);
		if (!m1) break;
		sl = new Selector(), sl.group = g;
		switch (m1[1]) {
			// Filter
			case '>': case '~': case '+':{
				m2 = PATTERN.FILTER.exec(_str);
				if (m2) sl.filter = m2[1], sl.tag = m2[2];
				if (_sl) _sl.next = sl, sl.prev = _sl;
				break;
			}
			// ID
			case '#':{
				m2 = PATTERN.ID.exec(_str);
				if (m2) {
					if (!m2[1]) sl = _sl || sl;
					sl.filter = '#', sl.id = m2[2];
					if (m2[1] && _sl) _sl.next = sl, sl.prev = _sl;
				}
				break;
			}
			// Class
			case '.':{
				m2 = PATTERN.CLASS.exec(_str);
				if (m2) {
					if (m2[1] && _sl) _sl.next = sl, sl.prev = _sl;
					else sl = _sl || sl;
					_model['.'](sl, m2);
				}
				break;
			}
			// PSEUDO
			case ':':{
				m2 = PATTERN.PSEUDO.exec(_str);
				if (m2) sl = _sl || sl, _model[':'](sl, m2);
				break;
			}
			// Attr
			case '[':{
				m2 = PATTERN.ATTR.exec(_str);
				if (m2) sl = _sl || sl, _model['[]'](sl, m2);
				break;
			}
			// Group split
			case ',':{
				m2 = PATTERN.SPLIT.exec(_str);
				ng = true, g++, _sl = sl = null;
				break;
			}
			// Tag
			default:{
				m2 = PATTERN.TAG.exec(_str);
				sl.tag = m2[1];
				if (_sl) _sl.next = sl, sl.prev = _sl;
				break;
			}
		}
		i += (m2 ? m2[0] : _str).length;
		if (ng && (_sl || sl)) ret.push(_sl || sl), ng = false;
		_sl = sl;
	}
	return ret;
};
// CSS query engine
var CSSQuery = function(selector, context){
	// Arguments Fix
	selector = selector || document;
	
	// Initialization
	this.push = Array.prototype.push;
	this.length = 0;
	this.selector = '';
	this.context = context || document;
	this.prevResult = null;
	
	// Handle: DOM Node
	if (selector.nodeType) {
		this.push(selector);
		this.context = selector;
		return;
	}
	
	// Handle: String
	if (typeof(selector) === 'string') {
		this.selector = selector;
		var stack = _parseCSS(selector), context = new this.constructor(this.context), i = 0, frag;
		while ((frag = stack[i++]))
			_query(this, frag, context);
		return;
	}
	
	// Handle: Array
	selector = _makeArray(selector);
	for (var i = 0; i < selector.length; i++)
		if (selector[i].nodeType) this.push(selector[i]);
},
_query = function(result, selector, context){
	var next = selector.next;
	if (context instanceof result.constructor) result.prevResult = context;
	if (next) {
		var current = new result.constructor(), i = 0;
		selector.next = null, current.length = 0, delete current[0];
		arguments.callee(current, selector, context);
		current.lenght == 0 || arguments.callee(result, next, current);
		// restore the selector link
		selector.next = next;
	} else {
		var i = 0, temp, _context = _contextFilter(selector, context);
		try {
			while ((temp = _context[i++])) 
				if (temp.nodeType) _FN.FILTER[selector.filter](result, selector, temp);
		} catch (e) {
			if (e != $break) throw e;
		}
	}
},
_tagChk = function(selector, node){
	return selector.tag == '*' ? true : node.tagName.toLowerCase() == selector.tag.toLowerCase();
},
_detector = function(selector, node, index){
	var expr, result = true;
	// class, pseudo, attr check
	for (expr in selector.detector) {
		if (!result) break;
		result = _FN.DETECTOR[expr](node, selector.detector[expr], index);
	}
	return result;
},
_AttrMap = {
	'class': 'className',
	'id': 'id'
},
_makeArray = function(object){
	var result = [];
	if (object != null) {
		var i = object.length;
		// The window, strings (and functions) also have 'length'
		if (i == null || typeof(object) === 'string' || typeof(object) === 'function' || object.setInterval) result[0] = object;
		else while (i) 
			result[--i] = object[i];
	}
	return result;
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
	for (; tmp; tmp = tmp.nextSibling) 
		if (tmp.nodeType === 1) if (tmp === node) return ++i;
		else ++i;
},
_contextFilter = function(selector, context){
	var node, prevNode, i = 0, result = [];
	switch (selector.filter) {
		case '~':{
			while ((node = context[i++])) 
				if (node.nodeType) {result.push(node);break;}
			while ((prevNode = node, node = context[i++]))
				if (_contains(prevNode, node)) result.push(node);
			return result;
		}
		case '':{
			while ((node = context[i++])) 
				if (node.nodeType) {result.push(node);break;}
			while ((prevNode = node, node = context[i++]))
				if (_contains(node, prevNode)) result = [node];
				else if (!_contains(prevNode, node)) result.push(node);
			return result;
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
_FN = {
// Relation Filters
FILTER: {
	'#': function(result, selector, context){
		var node = document.getElementById(selector.id);
		if (node && _tagChk(selector, node) && _detector(selector, node, null)) {
			if (selector.prev == null) result.push(node);
			else if(_contains(context, node)) result.push(node);
			throw $break;
		}
	},
	'': function(result, selector, context){
		var i = 0, node, nodes = context.getElementsByTagName(selector.tag) || [];
		while((node = nodes[i++])) if(_detector(selector, node, null)) result.push(node);
	},
	'>': function(result, selector, context){
		var i = 0, node, children = context.childNodes || [];
		while ((node = children[i++])) if(node.nodeType == 1 && _tagChk(selector, node) && _detector(selector, node, i)) result.push(node);
	},
	'+': function(result, selector, context){
		var i = 0, node = context;
		while ((node = node.nextSibling)) 
			if (node.nodeType == 1) {
				if (_tagChk(selector, node) && _detector(selector, node, i++)) result.push(node);
				break;
			}
	},
	'~': function(result, selector, context){
		var i = 0, node = context;
		while ((node = node.nextSibling))
			if(node.nodeType == 1 && _tagChk(selector, node) && _detector(selector, node, i++)) result.push(node);
	}
},
// Detectors
DETECTOR: {
	':': function(node, data, index){
		var result = true, i = 0, frag;
		while (result && (frag = data[i++])) {
			var detector = _FN.PSEUDO[frag.name.toLowerCase()];
			result = detector ? detector(node, frag.value, index) : false;
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
			attr = _setAttrTarget(attr, node);
			result = _FN.ATTR[attr.match](attr.target, attr.value);
		}
		return result;
	}
},
// Attribute Detectors
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
// PSEUDO Detectors
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
	has: function(node, value){return !!(new CSSQuery(value, node)).length;},
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
		var diff = (index || _getNodeIndex(node)) - value.b;
		if (value.a == 0) return diff == 0;
		else return (diff % value.a == 0 && diff / value.a >= 0);
	},
	// Other
	header: function(node){return /h\d/i.test(node.nodeName);},
	not: function(node, value, index){return !_detector(value, node, index);}
}
};
// Expose
window.$ = function(selector, context){
	return new CSSQuery(selector, context);
};
})();