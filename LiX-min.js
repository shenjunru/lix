/*
 * LiX JavaScript CSS selector engine
 * Project since: 2009-02-18
 * Version: 1.0-3 build 20090512
 * 
 * Copyright (c) 2009 Shen Junru
 * Released under the MIT, BSD, and GPL Licenses.
 * 
 * Inspiration:
 * 	- Some functionality inspired by [jQuery.js](http://jQuery.com) Copyright (c) 2009 John Resig, [MIT and GPL licenses](http://docs.jquery.com/License)
*/
(function(){var p=function(){this.prev=null;this.next=null;this.group=0;this.tag="*";this.id="";this.filter="";this.detector={}},k={CHAR:/^\s*([>~+#\*\w\u00c0-\uFFFF_\-.:\[,])/,SPLIT:/^\s*,\s*/,TAG:/^\s*(\*|[\w\u00c0-\uFFFF_-]+)/,ID:/^(\s*)#(\*|[\w\u00c0-\uFFFF_-]+)/,FILTER:/^\s*([>~+])\s*(\*|[\w\u00c0-\uFFFF_-]+)/,CLASS:/^(\s*)\.([\w\d\u00C0-\uFFFF_-]+)/,PSEUDO:/^\s*:(\w[\w\-]*)(?:\(([^\)]+)\))?/,ATTR:/^\s*\[\s*([\w\d]+)\s*(?:([!~$|*^]?=)\s*([\w\d\-\.\u00C0-\uFFFF]+|"([^"]*)"|'([^']*)')\s*)?\]/,NTH:/(-?)(\d*)n((?:\+|-)?\d*)/},n={},e=function(w){return new SyntaxError("css parse error, char:"+w)},o={".":function(w,x,y){w.detector["."]=w.detector["."]||[];w.detector["."].push(x[2])},":":function(w,y,z){try{w.detector[":"]=w.detector[":"]||[];var x=y[1],A=y[2],C=h[":"][x];if(A&&C){A=C(A)}w.detector[":"].push({name:x,value:A})}catch(B){if(B!=n){throw e(z)}}},"[]":function(w,y,z){try{w.detector["[]"]=w.detector["[]"]||[];var x=y[1],C=y[2]||"",A=y[5]||y[4]||y[3],D=h["[]"][x];if(A&&D){A=D(C,A)}w.detector["[]"].push({name:x,expr:C,value:A,target:null})}catch(B){if(B!=n){throw e(z)}}}},h={":":{not:function(B){var z={detector:{}},A=0,w=B.length,C,y,x;while(A<w){C=B.slice(A,w),y=k.CHAR.exec(C);if(!y){break}switch(y[1]){case".":x=k.CLASS.exec(C);if(x){o["."](z,x)}break;case":":x=k.PSEUDO.exec(C);if(x){o[":"](z,x)}break;case"[":x=k.ATTR.exec(C);if(x){o["[]"](z,x)}break}A+=(x?x[0]:C).length}return z},"nth-child":function(x){if(/^\bn\b$/i.test(x)){throw n}var w=k.NTH.exec(x=="even"&&"2n"||x=="odd"&&"2n+1"||!/\D/.test(x)&&"0n+"+x||x);return{a:(w[1]+(w[2]||1))-0,b:w[3]-0}}},"[]":{"class":function(x,w){if(!w){return w}switch(x){case"*=":return w;case"|=":case"^=":return" "+w;case"$=":return w+" ";default:return" "+w+" "}}}},t=function(C){var B=[],z=0,y=C.length,A=0,w=true,E,G,D,x,F;while(z<y){E=C.slice(z,y),G=k.CHAR.exec(E);if(!G){throw e(z)}x=new p(),x.group=A;switch(G[1]){case">":case"~":case"+":D=k.FILTER.exec(E);if(D){x.filter=D[1],x.tag=D[2];if(F){F.next=x,x.prev=F}}break;case"#":D=k.ID.exec(E);if(D){if(!D[1]){x=F||x}x.filter="#",x.id=D[2];if(D[1]&&F){F.next=x,x.prev=F}}break;case".":D=k.CLASS.exec(E);if(D){if(D[1]&&F){F.next=x,x.prev=F}else{x=F||x}o["."](x,D,z)}break;case":":D=k.PSEUDO.exec(E);if(D){x=F||x,o[":"](x,D,z)}break;case"[":D=k.ATTR.exec(E);if(D){x=F||x,o["[]"](x,D,z)}break;case",":D=k.SPLIT.exec(E);if(D){w=true,A++,F=x=null}break;default:D=k.TAG.exec(E);if(D){x.tag=D[1];if(F){F.next=x,x.prev=F}}break}if(!D){throw e(z)}z+=D[0].length;if(w&&(F||x)){B.push(F||x),w=false}F=x}return B};if(!document.nodeType){document.nodeType=9}var u=function(x,z){x=x||document;this.push=Array.prototype.push;this.length=0;this.selector="";this.context=z||document;this.prevResult=null;if(x.nodeType){this.push(x);this.context=x;return}if(typeof(x)==="string"){this.selector=x;try{var w=t(x),z=new this.constructor(this.context),y=0,B;while((B=w[y++])){s(this,B,z)}}catch(A){throw A}return}x=r(x);for(var y=0;y<x.length;y++){if(x[y].nodeType){this.push(x[y])}}},d={},s=function(E,y,x){var A=y.next;if(x instanceof E.constructor){E.prevResult=x}if(A){var C=new E.constructor(),z=0;y.next=null,C.length=0,delete C[0];arguments.callee(C,y,x);C.lenght==0||arguments.callee(E,A,C);y.next=A}else{var z=0,D,w=g(y,x);d={};try{while((D=w[z++])){if(D.nodeType){l[y.filter](E,y,D)}}}catch(B){if(B!=n){throw B}}}},a=function(w,x){return w.tag=="*"?true:x.tagName.toLowerCase()==w.tag.toLowerCase()},v=function(x,z,y){var A,w=true;for(A in x.detector){if(!w){break}w=i[A](z,x.detector[A],y)}return w},q={"class":"className","for":"htmlFor",id:"id"},r=function(x){var w=[];if(x!=null){var y=x.length;if(y==null||typeof(x)==="string"||typeof(x)==="function"||x.setInterval){w[0]=x}else{while(y){w[--y]=x[y]}}}return w},m=function(w,x){if(w.compareDocumentPosition){return(w.compareDocumentPosition(x)&16)===16}if(w.contains){return w.contains(x)&&w!==x}while(x=x.parentNode){if(x==w){return true}}return false},j=function(y){var x=0,w=y.parentNode.firstChild;if(d.node&&d.node.parentNode===y.parentNode){x=d.index,w=d.node}for(;w;w=w.nextSibling){if(w===y){d.node=y,d.index=x;return ++x}else{if(w.nodeType===1){++x}}}},g=function(x,A){var B,y,z=0,w=[];switch(x.filter){case"~":while((B=A[z++])){if(B.nodeType){w.push(B);break}}while((y=B,B=A[z++])){if(m(y,B)){w.push(B)}}return w;case"":while((B=A[z++])){if(B.nodeType){w.push(B);break}}while((y=B,B=A[z++])){if(m(B,y)){w=[B]}else{if(!m(y,B)){w.push(B)}}}return w;default:return A}},c=function(x,w){if(w in q){return x[q[w]]}return x.getAttribute(w)},b=function(w,x){var y=c(x,w.name);switch(w.name){case"class":w.target=y?" "+y+" ":null;break;default:w.target=y}return w},l={"":function(x,w,A){var z=0,B,y=A.getElementsByTagName(w.tag)||[];while((B=y[z++])){if(v(w,B,null)){x.push(B)}}},"#":function(x,w,y){var z=document.getElementById(w.id);if(z&&a(w,z)&&v(w,z,null)){if(w.prev==null){x.push(z)}else{if(m(y,z)){x.push(z)}}throw n}},">":function(x,w,B){var A=0,y=1,C,z=B.childNodes||[];while((C=z[A++])){if(C.nodeType==1&&a(w,C)&&v(w,C,y++)){x.push(C)}}},"+":function(x,w,y){var z=y;while((z=z.nextSibling)){if(z.nodeType==1){if(a(w,z)&&v(w,z,null)){x.push(z)}break}}},"~":function(x,w,y){var z=y;while((z=z.nextSibling)){if(z.nodeType==1&&a(w,z)&&v(w,z,null)){x.push(z)}}}},i={":":function(A,B,y){var w=true,z=0,C;while(w&&(C=B[z++])){var x=f.PSEUDO[C.name.toLowerCase()];w=x?x(A,C.value,y):false}return w},".":function(A,B,x){if(!A.className){return false}var w=true,z=0,C,y=" "+A.className+" ";while(w&&(C=B[z++])){w=y.indexOf(C)>-1}return w},"[]":function(A,B,y){var x=true,z=0,w;while(x&&(w=B[z++])){w=b(w,A);x=f.ATTR[w.expr](w.target,w.value)}return x}},f={ATTR:{"":function(x,w){return !!x},"=":function(x,w){return x==w},"!=":function(x,w){return x!=w},"~=":function(x,w){return x?(" "+x+" ").indexOf(w)>=0:false},"^=":function(x,w){return x?x.indexOf(w)===0:false},"$=":function(x,w){return x?x.substr(x.length-w.length)===w:false},"*=":function(x,w){return x?x.indexOf(w)>=0:false},"|=":function(x,w){return x?x===w||x.substr(0,w.length+1)===w+"-":false}},PSEUDO:{button:function(w){return"button"===w.type||w.nodeName.toUpperCase()==="BUTTON"},checkbox:function(w){return"checkbox"===w.type},file:function(w){return"file"===w.type},image:function(w){return"image"===w.type},input:function(w){return/input|select|textarea|button/i.test(w.nodeName)},password:function(w){return"password"===w.type},radio:function(w){return"radio"===w.type},reset:function(w){return"reset"===w.type},submit:function(w){return"submit"===w.type},text:function(w){return"text"===w.type},enabled:function(w){return w.disabled===false&&w.type!=="hidden"},disabled:function(w){return true},checked:function(w){return w.checked===true},selected:function(w){return w.selected===true},hidden:function(w){return w.offsetWidth===0||w.offsetHeight===0},visible:function(w){return w.offsetWidth>0||w.offsetHeight>0},empty:function(w){return !w.firstChild},parent:function(w){return !!w.firstChild},contains:function(w,x){return(w.textContent||w.innerText||"").indexOf(x)>=0},has:function(w,x){return !!(new u(x,w)).length},"first-child":function(w){while(w=w.previousSibling){if(w.nodeType===1){return false}}return true},"last-child":function(x,y,w){while(x=x.nextSibling){if(x.nodeType===1){return false}}return true},"only-child":function(x){var w=x;while(w=w.previousSibling){if(w.nodeType===1){return false}}w=x;while(w=w.nextSibling){if(w.nodeType===1){return false}}return true},"nth-child":function(x,y,w){var z=(w||j(x))-y.b;if(y.a==0){return z==0}else{return(z%y.a==0&&z/y.a>=0)}},header:function(w){return/h\d/i.test(w.nodeName)},not:function(x,y,w){return !v(y,x,w)}}};u.parseCSS=t;u.regPseudo=(function(){function w(z,A){var x,y;for(x in A){y=A[x],x=x.toLowerCase();if(typeof y=="function"&&!(x in z)){z[x]=y}}}return function(y){for(var x in y){switch(x.toLowerCase()){case"parser":w(h[":"],y[x]);break;case"probe":w(f.PSEUDO,y[x]);break}}}})();window.LiX=u;window.$=function(w,x){return new u(w,x)}})();