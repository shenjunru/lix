/*!
 * LiX JavaScript CSS selector engine
 * Project since: 2009-02-18
 * Version: 1.0.4 build 20090706
 * 
 * Copyright (c) 2009 Shen Junru
 * Released under the MIT, BSD, and GPL Licenses.
*/
(function(){
// Selectors Frag Class
var Frag = function(){
	this.prev = null;
	this.next = null;
	this.group = 0;
	this.tag = '*';
	this.id = '';
	this.type = '';
	this.feature = {};
},
// CSS Pattern
PATTERN = {
	CHAR: /^\s*([>~+#\*\w\u00c0-\uFFFF_\-.:\[,])/,
	SPLIT: /^\s*,\s*/,
	TAG: /^\s*(\*|[\w\u00c0-\uFFFF_-]+)/,
	ID: /^(\s*)#(\*|[\w\u00c0-\uFFFF_-]+)/,
	FILTER: /^\s*([>~+])\s*(\*|[\w\u00c0-\uFFFF_-]+)/,
	CLASS: /^(\s*)\.([\w\d\u00C0-\uFFFF_-]+)/,
	PSEUDO: /^\s*:(\w[\w\-]*)(?:\((?:(['"])(.+)\2|([^\)]+\(.+\))|([^\)]+))\))?/,
	ATTR: /^\s*\[\s*([\w\d]+)\s*(?:([!~$|*^]?=)\s*([\w\d\-\.\u00C0-\uFFFF]+|"([^"]*)"|'([^']*)')\s*)?\]/,
	NTH: /(-?)(\d*)n((?:\+|-)?\d*)/
},
$break = {},
// throw syntax error
syntaxErr = function(i){
	return new SyntaxError('css parse error, char:' + i);
},
// bind data to selector frag
model = {
	'.': function(frag, match, i){
		frag.feature['.'] = frag.feature['.'] || [];
		frag.feature['.'].push(match[2]);
	},
	':': function(frag, match, i){
		try {
			frag.feature[':'] = frag.feature[':'] || [];
			var name = match[1].toLowerCase(), value = match[5] || match[4] || match[3], parser = SUB_PARSER[':'][name];
			if (value && parser) value = parser(value);
			frag.feature[':'].push({
				name: name,
				value: value
			});
		} catch (e) {
			if (e != $break) throw syntaxErr(i);
		}
	},
	'[]': function(frag, match, i){
		try {
			frag.feature['[]'] = frag.feature['[]'] || [];
			var name = match[1], expr = match[2] || '', value = match[5] || match[4] || match[3], parser = SUB_PARSER['[]'][name];
			if (value && parser) value = parser(expr, value);
			frag.feature['[]'].push({
				name: name,
				expr: expr,
				value: value,
				target: null
			});
		} catch (e) {
			if (e != $break) throw syntaxErr(i);
		}
	}
},
SUB_PARSER = {
	':': {
		'not': function(str){
			var result = {feature:{}}, i = 0, l = str.length, _str, m1, m2;
			while (i < l) {
				_str = str.slice(i, l), m1 = PATTERN.CHAR.exec(_str);
				if (!m1) break;
				switch (m1[1]) {
					// Class
					case '.':
						m2 = PATTERN.CLASS.exec(_str);
						if (m2) model['.'](result, m2);
						break;
					// PSEUDO
					case ':':
						m2 = PATTERN.PSEUDO.exec(_str);
						if (m2) model[':'](result, m2);
						break;
					// Attr
					case '[':
						m2 = PATTERN.ATTR.exec(_str);
						if (m2) model['[]'](result, m2);
						break;
				}
				i += (m2 ? m2[0] : _str).length;
			}
			return result;
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
parseCSS = function(str){
	var result = [], g = 0, i = 0, l = str.length, newGroup = true, _str, m1, m2, frag, _frag;
	while (i < l) {
		_str = str.slice(i, l), m1 = PATTERN.CHAR.exec(_str);
		
		// Throw Syntax Error
		if (!m1) throw syntaxErr(i);
		
		frag = new Frag(), frag._fragroup = g;
		switch (m1[1]) {
			// Filter
			case '>': case '~': case '+':
				m2 = PATTERN.FILTER.exec(_str);
				if (m2) {
					frag.type = m2[1], frag.tag = m2[2];
					if (_frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
			// ID
			case '#':
				m2 = PATTERN.ID.exec(_str);
				if (m2) {
					if (!m2[1]) frag = _frag || frag;
					frag.type = '#', frag.id = m2[2];
					if (m2[1] && _frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
			// Class
			case '.':
				m2 = PATTERN.CLASS.exec(_str);
				if (m2) {
					if (m2[1] && _frag) _frag.next = frag, frag.prev = _frag;
					else frag = _frag || frag;
					model['.'](frag, m2, i);
				}
				break;
			// PSEUDO
			case ':':
				m2 = PATTERN.PSEUDO.exec(_str);
				if (m2) frag = _frag || frag, model[':'](frag, m2, i);
				break;
			// Attr
			case '[':
				m2 = PATTERN.ATTR.exec(_str);
				if (m2) frag = _frag || frag, model['[]'](frag, m2, i);
				break;
			// Group split
			case ',':
				m2 = PATTERN.SPLIT.exec(_str);
				if (m2) newGroup = true, g++, _frag = frag = null;
				break;
			// Tag
			default:
				m2 = PATTERN.TAG.exec(_str);
				if (m2) {
					frag.tag = m2[1];
					if (_frag) _frag.next = frag, frag.prev = _frag;
				}
				break;
		}
		// Throw Syntax Error
		if (!m2) throw syntaxErr(i);
		i += m2[0].length;
		if (newGroup && (_frag || frag)) result.push(_frag || frag), newGroup = false;
		_frag = frag;
	}
	return result;
};

// fix document.nodeType in IE5.5
if (!document.nodeType) document.nodeType = 9;

// CSS Selectors Query Engine
var LiX = window.LiX = function(selector, context){
	context = [context || document];
	var result = [];
	if (typeof(selector) == 'string' && isElem(context[0])) {
		try {
			lixCache = 0, lixIndex++;
			var stack = parseCSS(selector), i = 0, frag;
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
},
push = function(result, node){
	// for no duplicate
	if (lixIndex != node._lixIndex) node._lixIndex = lixIndex, result.push(node);
},
tagChk = function(frag, node){
	return frag.tag == '*' ? true : node.nodeName.toLowerCase() == frag.tag.toLowerCase();
},
detect = function(frag, node, index){
	var expr, result = true;
	// class, pseudo, attr check
	for (expr in frag.feature) {
		if (!result) break;
		result = DETECTOR[expr](node, frag.feature[expr], index);
	}
	return result;
},
AttrMap = {
	'class': 'className',
	'for': 'htmlFor',
	'id': 'id'
},
isXML = function(elem){
	return elem.nodeType == 9 && elem.documentElement.nodeName != "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName != "HTML";
},
isElem = function(obj){
	return (obj && (obj.nodeType == 1 || obj.nodeType == 9));
},
contains = (function(){
	if (document.documentElement.compareDocumentPosition) return function(ancestor, descendant){
		return (ancestor.compareDocumentPosition(descendant) & 16) == 16;
	}
	if (document.documentElement.contains) return function(ancestor, descendant){
		return ancestor.contains(descendant) && ancestor != descendant;
	};
	return function(ancestor, descendant){
		while (descendant = descendant.parentNode) 
			if (descendant == ancestor) return true;
		return false;
	}
})(),
getNodeIndex = function(node){
	var i = 0, pn = node.parentNode, cn = pn.firstChild;
	if (lixCache != pn._lixCache) {
		for (; cn; cn = cn.nextSibling) 
			if (cn.nodeType == 1) cn.nodeIndex = ++i;
		pn._lixCache = lixCache;
	}
	return node.nodeIndex;
},
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
DETECTOR = {
	':': function(node, data, index){
		var result = true, i = 0, frag;
		while (result && (frag = data[i++])) {
			var probe = PROBE.PSEUDO[frag.name.toLowerCase()];
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
// Node probe : call by DETECTOR
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
// PSEUDO probe
PSEUDO: {
	// form element
	button: function(node){return 'button' == node.type || node.nodeName.toUpperCase() == 'BUTTON';},
	checkbox: function(node){return 'checkbox' == node.type;},
	file: function(node){return 'file' == node.type;},
	image: function(node){return 'image' == node.type;},
	input: function(node){return /input|select|textarea|button/i.test(node.nodeName);},
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
	has: function(node, value){return !!(new LiX(value, node)).length;},
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
	not: function(node, value, index){return !detect(value, node, index);}
}
};

// add functions to LiX
LiX.parseCSS = parseCSS;
})();