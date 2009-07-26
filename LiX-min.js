/*
 * LiX JavaScript CSS selector engine
 * Project since: 2009-02-18
 * Version: 1.0.5.1 build 20090726
 * 
 * Copyright (c) 2009 Shen Junru (XFSN)
 * Released under the MIT, BSD, and GPL Licenses.
*/
(function(){if(!document.nodeType){document.nodeType=9}var l={CHAR:/^\s*([>~+#*.:[,\w\u00c0-\uFFFF])/,GROUP:/^\s*,\s*/,TAG:/^\s*(\*|[\w\u00c0-\uFFFF-]+)/,ID:/^(\s*)#(\*|[\w\u00c0-\uFFFF-]+)/,FILTER:/^\s*([>~+])\s*(\*|[\w\u00c0-\uFFFF-]+)/,CLASS:/^(\s*)\.([\w\d\u00C0-\uFFFF-]+)/,PSEUDO:/^\s*:([\w\u00c0-\uFFFF-]+)(?:\((?:(['"])(.+)\2|([^\)]+\(.+\))|([^\)]+))\))?/,ATTR:/^\s*\[\s*([\w\u00c0-\uFFFF-]+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3)?\s*\]/,NTH:/(-?)(\d*)n((?:\+|-)?\d*)/},p={},o=function(x,y){return y&&y instanceof SyntaxError?y:new SyntaxError("css parse error, char:"+x)},q=function(z,C){C=C||0;var I=[],x=true,E=z.replace(/\s*$/,""),A=0,B=0,y=E.length,H,F,G,D;while(A<y){E=z.slice(A,y),H=l.CHAR.exec(E);if(!H){throw o(C)}G={tag:"*",type:"",feature:{},group:B};switch(H[1]){case">":case"~":case"+":F=l.FILTER.exec(E);if(F){G.type=F[1],G.tag=F[2];if(D){D.next=G,G.prev=D}}break;case"#":F=l.ID.exec(E);if(F){if(!F[1]){G=D||G}G.type="#",G.id=F[2];if(F[1]&&D){D.next=G,G.prev=D}}break;case".":F=l.CLASS.exec(E);if(F){if(F[1]&&D){D.next=G,G.prev=D}else{G=D||G}n.CLASS(G,F,C)}break;case":":F=l.PSEUDO.exec(E);if(F){G=D||G,n.PSEUDO(G,F,C)}break;case"[":F=l.ATTR.exec(E);if(F){G=D||G,n.ATTR(G,F,C)}break;case",":F=l.GROUP.exec(E);if(F){x=true,B++,D=G=null}break;default:F=l.TAG.exec(E);if(F){G.tag=F[1];if(D){D.next=G,G.prev=D}}break}if(!F){throw o(C)}A+=F[0].length,C+=F[0].length;if(x&&(D||G)){I.push(D||G),x=false}D=G}return I},n={CLASS:function(z,x,y){z.feature["."]=z.feature["."]||[];z.feature["."].push(x[2])},PSEUDO:function(D,y,z){try{D.feature[":"]=D.feature[":"]||[];var x=y[1].toLowerCase(),A=y[5]||y[4]||y[3],C=j.PSEUDO[x];if(A&&C){A=C(A,x.length+z+2)}D.feature[":"].push({name:x,value:A})}catch(B){if(B!=p){throw o(z,B)}}},ATTR:function(E,y,z){try{E.feature["[]"]=E.feature["[]"]||[];var x=y[1],C=y[2]||"",A=y[4],D=j.ATTR[x];if(A&&D){A=D(C,A,z)}E.feature["[]"].push({name:x,expr:C,value:A,target:null})}catch(B){if(B!=p){throw o(z,B)}}}},j={PSEUDO:{not:function(x,y){return q(x,y)},"nth-child":function(y){if(/^\bn\b$/i.test(y)){throw p}var x=l.NTH.exec(y=="even"&&"2n"||y=="odd"&&"2n+1"||!/\D/.test(y)&&"0n+"+y||y);return{a:(x[1]+(x[2]||1))-0,b:x[3]-0}}},ATTR:{"class":function(y,x){if(!x){return x}switch(y){case"*=":return x;case"|=":case"^=":return" "+x;case"$=":return x+" ";default:return" "+x+" "}}}},t=window.LiX=function(z,B,y){B=[B||document];y?y.length==null&&(y.length=0):y=[];if(typeof(z)=="string"&&r(B[0])){try{e=0,w++;var x=q(z),A=0,D;while(D=x[A++]){f(B,D,y)}}catch(C){throw C}}return y},e=0,w=0,f=function(A,z,F){var C=z.next;if(C){z.next=null;var E=arguments.callee(A,z,[]);E.lenght||arguments.callee(E,C,F);z.next=C}else{e++;var A=s(A,z),y=z.tag=="*"||z.type=="",B=0,x;try{while(x=A[B++]){if(x.nodeType){m[z.type](x,z,F||[],y)}}}catch(D){if(D!=p){throw D}}}return F},i=function(x,y){if(w!=y._lixIndex){y._lixIndex=w;Array.prototype.push.call(x,y)}},d=function(y,x){return y.nodeName.toLowerCase()==x.tag.toLowerCase()},u=function(B,y,A,z){var x=A||d(B,y),C;for(C in y.feature){if(!x){break}x=v[C](B,y.feature[C],z)}return x},r=function(x){return(x&&(x.nodeType==1||x.nodeType==9))},b=function(x){return x.nodeType==9&&x.documentElement.nodeName!="HTML"||!!x.ownerDocument&&x.ownerDocument.documentElement.nodeName!="HTML"},k=(function(){if(document.documentElement.compareDocumentPosition){return function(y,x){return(y.compareDocumentPosition(x)&16)==16}}if(document.documentElement.contains){return function(y,x){return y.contains(x)&&y!=x}}return function(y,x){while(x=x.parentNode){if(x==y){return true}}return false}})(),s=function(C,y){var B,z,A=0,x=[];switch(y.type){case"~":while(B=C[A++]){if(B.nodeType){x.push(B);break}}while(z=B,B=C[A++]){if(k(z,B)){x.push(B)}}return x;case"":while(B=C[A++]){if(B.nodeType){x.push(B);break}}while(z=B,B=C[A++]){if(k(B,z)){x=[B]}else{if(!k(z,B)){x.push(B)}}}return x;default:return C}},h={"class":"className","for":"htmlFor",id:"id"},c=function(y,x){var z=x in h?y[h[x]]:y.getAttribute(x);switch(x){case"class":z&&(z=" "+z+" ");break}return z},a=function(z){var y=0,x=z.parentNode,A=x.firstChild;if(e!=x._lixCache){for(;A;A=A.nextSibling){if(A.nodeType==1){A.nodeIndex=++y}}x._lixCache=e}return z.nodeIndex},m={"":function(B,y,x,C){var A=0,D,z=B.getElementsByTagName(y.tag);while(D=z[A++]){u(D,y,C)&&i(x,D)}},"#":function(z,y,x,A){var B=(z.ownerDocument||document).getElementById(y.id);if(B&&B.getAttributeNode("id")&&u(B,y,A)){(y.prev==null||k(z,B))&&i(x,B);throw p}},">":function(C,y,x,D){var B=0,z=1,E,A=C.childNodes||[];while(E=A[B++]){(E.nodeType==1&&u(E,y,D,z++))&&i(x,E)}},"+":function(z,y,x,A){var B=z;while(B=B.nextSibling){if(B.nodeType==1){u(B,y,A)&&i(x,B);break}}},"~":function(z,y,x,A){var B=z;while(B=B.nextSibling){(B.nodeType==1&&u(B,y,A))&&i(x,B)}}},v={":":function(C,B,z){var x=true,A=0,D,y;while(x&&(D=B[A++])){y=g.PSEUDO[D.name];x=y?y(C,D.value):false}return x},".":function(B,A){if(!B.className){return false}var z=" "+B.className+" ",x=true,y=0,C;while(x&&(C=A[y++])){x=z.indexOf(C)>-1}return x},"[]":function(A,z){var x=true,y=0,B;while(x&&(B=z[y++])){x=g.ATTR[B.expr](c(A,B.name),B.value)}return x}},g={ATTR:{"":function(y,x){return !!y},"=":function(y,x){return y==x},"!=":function(y,x){return y!=x},"~=":function(y,x){return y?(" "+y+" ").indexOf(x)>=0:false},"^=":function(y,x){return y?y.indexOf(x)==0:false},"$=":function(y,x){return y?y.substr(y.length-x.length)==x:false},"*=":function(y,x){return y?y.indexOf(x)>=0:false},"|=":function(y,x){return y?y==x||y.substr(0,x.length+1)==x+"-":false}},PSEUDO:{input:function(x){return/input|select|textarea|button/i.test(x.nodeName)},button:function(x){return"button"==x.type||x.nodeName.toUpperCase()=="BUTTON"},checkbox:function(x){return"checkbox"==x.type},file:function(x){return"file"==x.type},image:function(x){return"image"==x.type},password:function(x){return"password"==x.type},radio:function(x){return"radio"==x.type},reset:function(x){return"reset"==x.type},submit:function(x){return"submit"==x.type},text:function(x){return"text"==x.type},enabled:function(x){return x.disabled==false&&x.type!="hidden"},disabled:function(x){return true},checked:function(x){return x.checked==true},selected:function(x){return x.selected==true},hidden:function(x){return x.offsetWidth==0||x.offsetHeight==0},visible:function(x){return x.offsetWidth>0||x.offsetHeight>0},empty:function(x){return !x.firstChild},parent:function(x){return !!x.firstChild},contains:function(x,y){return(x.textContent||x.innerText||"").indexOf(y)>=0},has:function(A,B){var y=true,z=0,x;while(y&&(x=B[z++])){y=!!(f([A],x,[]).length)}return y},"first-child":function(x){while((x=x.previousSibling)&&x.nodeType!=1){}return !x},"last-child":function(x){while((x=x.nextSibling)&&x.nodeType!=1){}return !x},"only-child":function(y){var x=y;while(x=x.previousSibling){if(x.nodeType==1){return false}}x=y;while(x=x.nextSibling){if(x.nodeType==1){return false}}return true},"nth-child":function(y,z,x){var A=(x||a(y))-z.b;if(z.a==0){return A==0}else{return(A%z.a==0&&A/z.a>=0)}},"gth-child":function(y,z,x){return z<(x||a(y))},"lth-child":function(y,z,x){return z>(x||a(y))},header:function(x){return/h\d/i.test(x.nodeName)},not:function(B,C,z){var y=true,A=0,x;while(y&&(x=C[A++])){y=!u(B,x,x.tag=="*",z)}return y}}};j.PSEUDO.has=j.PSEUDO.not;t.parseSelector=q})();