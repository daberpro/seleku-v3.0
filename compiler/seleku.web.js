const { parse, serialize } = require('parse5');
const beautify = require('js-beautify').js;
const fs = require("fs");
const prettify = require('html-prettify');
const {highlight} = require('cardinal');
const { parse: ASTParse, walk, binaryExpressionReduction, replace, generate, find, each, traverse } = require('abstract-syntax-tree');

const HTMLElementTag = { "a": "a", "abbr": "abbr", "acronym": "acronym", "address": "address", "applet": "applet", "area": "area", "article": "article", "aside": "aside", "audio": "audio", "b": "b", "base": "base", "basefont": "basefont", "bdi": "bdi", "bdo": "bdo", "bgsound": "bgsound", "big": "big", "blink": "blink", "blockquote": "blockquote", "body": "body", "br": "br", "button": "button", "canvas": "canvas", "caption": "caption", "center": "center", "cite": "cite", "code": "code", "col": "col", "colgroup": "colgroup", "content": "content", "data": "data", "datalist": "datalist", "dd": "dd", "decorator": "decorator", "del": "del", "details": "details", "dfn": "dfn", "dir": "dir", "div": "div", "dl": "dl", "dt": "dt", "element": "element", "em": "em", "embed": "embed", "fieldset": "fieldset", "figcaption": "figcaption", "figure": "figure", "font": "font", "footer": "footer", "form": "form", "frame": "frame", "frameset": "frameset", "h1": "h1", "h2": "h2", "h3": "h3", "h4": "h4", "h5": "h5", "h6": "h6", "head": "head", "header": "header", "hgroup": "hgroup", "hr": "hr", "html": "html", "i": "i", "iframe": "iframe", "img": "img", "input": "input", "ins": "ins", "isindex": "isindex", "kbd": "kbd", "keygen": "keygen", "label": "label", "legend": "legend", "li": "li", "link": "link", "listing": "listing", "main": "main", "map": "map", "mark": "mark", "marquee": "marquee", "menu": "menu", "menuitem": "menuitem", "meta": "meta", "meter": "meter", "nav": "nav", "nobr": "nobr", "noframes": "noframes", "noscript": "noscript", "object": "object", "ol": "ol", "optgroup": "optgroup", "option": "option", "output": "output", "p": "p", "param": "param", "plaintext": "plaintext", "pre": "pre", "progress": "progress", "q": "q", "rp": "rp", "rt": "rt", "ruby": "ruby", "s": "s", "samp": "samp", "script": "script", "section": "section", "select": "select", "shadow": "shadow", "small": "small", "source": "source", "spacer": "spacer", "span": "span", "strike": "strike", "strong": "strong", "style": "style", "sub": "sub", "summary": "summary", "sup": "sup", "table": "table", "tbody": "tbody", "td": "td", "template": "template", "textarea": "textarea", "tfoot": "tfoot", "th": "th", "thead": "thead", "time": "time", "title": "title", "tr": "tr", "track": "track", "tt": "tt", "u": "u", "ul": "ul", "var": "var", "video": "video", "wbr": "wbr", "xmp": "xmp" }

let countIndex = 0;
const componentFunctionName = {};
let stateVariabel = {};
let stateIdentifier = {};

function toString(b) {

	let c = Object.keys(b).map(e => {

		if (/\<.*?>.*?<\/.*?>/igm.test(b[e])) {

			return `"${e}": ${b[e]}`

		}

		if (b[e] instanceof Array) {
			return `"${e}":[${b[e]}]`
		}

		if (b[e] instanceof Object && typeof b[e] !== "function") {

			return `"${e}":${toString(b[e])}`

		}

		// if (typeof b[e] === "string") return `""${e}"":"${b[e]}"`;

		return `"${e}":${b[e]}`

	});

	let g = "{";

	for (let x in c) {

		if (parseInt(x) === c.length - 1) {

			g += c[x] + "}"

		} else {

			g += c[x] + ","
		}
	}

	if (g === "{") return "{}"

	return g;

}


String.prototype.replaceBetween = function (start, end, what) {
	return this.substring(0, start - 1) + what + this.substring(end - 1);
};

function uuidv4() {
	return ([1e7] + 1e3).replace(/[018]/g, c =>
		(c ^ crypto.randomUUID(new Uint8Array(1))[0] & 15 >> c / 4).toString("36")
	);
}

function callComponent(Component, arrayResult, src, isFirstChild = false, address, parentAttr, rootAttr) {

	const rawAttrs = src.substring(Component.sourceCodeLocation.startCol - 1, Component.sourceCodeLocation.endCol - 1).match(/<[a-zA-Z]+(>|.*?[^?]>)/)?.[0].replace(/(?<=\<(\w.*))(\}(\s+|\t|\r|\n)\})/igm, "}}").match(/(?<=\<(\w.*))((\$.(\w*))|(\w*((\=(\".*?\"))|(\=(\{.*?(\}{1,}))))))/igm)?.map(e => ({
		[e.split("=")[0]]: (e.split("=")[1]) ? e.split("=")[1].replace(/(^\{|\}$)/igm, "") : null
	})) || [];

	let attr = {};

	for (let x of rawAttrs) {

		Object.assign(attr, x);

	}

	let cAttr = {};
	
	for (let x of rawAttrs) {

		if(!x.hasOwnProperty("condition") &&
		!x.hasOwnProperty("async") &&
		!x.hasOwnProperty("loop") && 
		!x.hasOwnProperty("") ) Object.assign(cAttr, x);

	}

	const tagName = src.substring(Component.sourceCodeLocation.startCol, Component.sourceCodeLocation.startCol + Component.tagName.length);
	
	arrayResult.push({
		component: `
			const ${'$$'+tagName+'_component'} = Node.Render(${attr.hasOwnProperty("async")? "await " : ""}${tagName}(${toString(cAttr)},${address? address : '$$_parent'}),${address? address : '$$_parent'});
			${Object.keys(cAttr).filter(e => !(/(\"|\'|\`)/igm.test(cAttr[e]))).map(e => `_Observer.subscribe("${cAttr[e]}",(data)=> ${'$$'+tagName+'_component'}.update(void 0, data,"${e}",data["${cAttr[e]}"]));`).join(' ')}
		`,
		location: Component.sourceCodeLocation,
		parent: address,
		parentAttr,
		rootAttr,
		componentName: '$$'+tagName+'_component',
		props: cAttr,
	});

	return arrayResult;

}

function createHTML(Component, arrayResult, src, isFirstChild = false, address,parentAttr,rootAttr) {

	countIndex++;

	const rawAttrs = src.substring(Component.sourceCodeLocation.startCol - 1, Component.sourceCodeLocation.endCol - 1).match(/<[a-zA-Z]+(>|.*?[^?]>)/)?.[0].replace(/(?<=\<(\w.*))(\}(\s+|\t|\r|\n)\})/igm, "}}").match(/(?<=\<(\w.*))((\$.(\w*))|(\w*((\=(\".*?\"))|(\=(\{.*?(\}{1,}))))))/igm)?.map(e => ({
		[e.split("=")[0]]: (e.split("=")[1]) ? e.split("=")[1].replace(/(^\{|\}$)/igm, "") : null
	})) || [];

	let attr = {}; 

	for (let x of rawAttrs) {

		attr = Object.assign(attr, x);

	}

	let cAttr = {};
	
	for (let x of rawAttrs) {

		if(!x.hasOwnProperty("condition") &&
		!x.hasOwnProperty("async") &&
		!x.hasOwnProperty("loop") && 
		!x.hasOwnProperty("") ) Object.assign(cAttr, x);

	}

	const tagName = src.substring(Component.sourceCodeLocation.startCol, Component.sourceCodeLocation.startCol + Component.tagName.length);

	if(!(tagName in HTMLElementTag)){

		componentFunctionName[tagName] = null;
		return callComponent(Component, arrayResult, src, false, address,parentAttr,rootAttr);

	}

	const TagName = tagName + countIndex;

	Component.childNodes.map(e =>{
		if(e.nodeName === "#text"){
			return e.value
		}
	}).join(" ").match(/\$\{.*?\}/igm)?.forEach((e)=>{

		stateVariabel = {
			...stateVariabel,
			[e.split('.')[0].replace(/(\{|\}|\$)/igm,"")]: null,
		};

		stateIdentifier = {
			...stateIdentifier,
			[e.split('.')[0].replace(/(\{|\}|\$)/igm,"")]: null,
		}

	})

	arrayResult.push({
		component: `
			const ${TagName} = Seleku.createElement("${tagName}");
			const ${TagName}_attribute = Seleku.createAttribute(${TagName},${toString(cAttr)});
			const ${TagName}_content = Seleku.createContent(
				${TagName},
				"${Component.childNodes.map(e =>{
					if(e.nodeName === "#text"){
						return e.value
					}
				}).join(" ").replace(/\s+/igm,' ')}",
				{
					${Component.childNodes.map(e =>{
						if(e.nodeName === "#text"){
							return e.value
						}
					}).join(" ").match(/\$\{.*?\}/igm)?.map((e)=>{

						if (/\./igm.test(e)){

							return e.split('.')[0];

						}else{

							let isThereLiteral = false;
							let isThereIdentifier = false;
							let allIdentifier = [];

							find(ASTParse(e.replace(/(\{|\}|\$)/igm,"")),{type: 'Literal'}).forEach(e =>{
								isThereLiteral = true;
							});

							find(ASTParse(e.replace(/(\{|\}|\$)/igm,"")),{type: 'Identifier'}).forEach(e =>{
								allIdentifier.push(e.name);
								isThereIdentifier = true;
							});

							if(isThereLiteral && isThereIdentifier){
								return `${TagName}_${uuidv4()}: ${e},${allIdentifier}`;
							}else if(isThereLiteral){
								return `${TagName}_${uuidv4()}: ${e}`;
							}else{
								return e;
							}
						
						}

					})?.join(",\n").replace(/(\{|\}|\$)/igm,"") || ''}
				}
			);
			${attr.hasOwnProperty("condition")? `
			${
				find(ASTParse(attr.condition),{
					type: 'Identifier'
				}).map((e,i)=>{

					let addContext = '';

					if(!stateVariabel.hasOwnProperty(e.name)){

						stateVariabel = {
							...stateVariabel,
							[e.name]: null,
						};

						stateIdentifier = {
							...stateIdentifier,
							[e.name]: null,
						}

					}

					return `
					${addContext}
					_Observer.subscribe("${e.name}",()=>{

						if(${attr.condition.replace(/\b(?!(false|true)\b)\w+/igm,'$&')}){
							
							Node.Render(${TagName},${address? address : '$$_parent'});
				
						}else{
					
							${TagName}.remove();
				
						}
				
					});
					`

				}).join(' ')
			}
			`:""}
			${attr.hasOwnProperty("parent")? `Node.Render(${TagName},${address});`:""}
			Node.registerContext( ${TagName}_content,_Observer);${isFirstChild? "" :`Node.Render(${TagName},${address});`}
			`,
		location: Component,
		attr,
		parentAttr,
		rootAttr,
		componentName: TagName,
		parent: address,
		content: Component.childNodes.map(e =>{
			if(e.nodeName === "#text"){
				return e.value
			}
		}).join(" "),
		componentFunctionName,
		cAttr,
		rawSyntax: src.substring(Component.sourceCodeLocation.startCol - 1, Component.sourceCodeLocation.endCol - 1),
	});

	if (Component.childNodes.length > 0) for (let x of Component.childNodes) {

		if (x.nodeName !== "#text") createHTML(x, arrayResult, src, false, TagName,attr,parentAttr? {...parentAttr,...attr} : attr);

	}
	return arrayResult;

}

module.exports.updateRegisterHTMLElement = (element) =>{ HTMLElementTag[element] = element }
module.exports.transform = function (_source, callbackComponentArrowFunction, isFirst, API) {

	let source = _source.replace(/(\r|\t|\n|\s+)/igm," ");
	let raw = {
		source
	}

	// raw data
	let data = parse(source, {
		sourceCodeLocationInfo: true
	}).childNodes[0].childNodes[1].childNodes.filter(e => e.nodeName !== "#text");

	let result = [];

	for (let x of data) {

		const a = createHTML(x, [], source, true, "");
		
		//Seleku Access API to Compiler
		// a.forEach(e => console.log(e.location))
		if(API.getComponent) API.getComponent(a,stateIdentifier);

		let loopChild = "";
		let loopArgs = "";
		let loopTarget = [];
		let currentComponentParent = "";
		let loopComponent = [];
		let nameOfChildContent = [];
		let loopMethod = "";
		let calledComponent = {}; 
		const unuseComponentIndex = [];
		const rawComponentString = a.map((e,i) =>{

			if(e.rootAttr?.hasOwnProperty("loop")){

				calledComponent[e.componentName] = e.props;

				if(currentComponentParent !== e.parent){
				
					currentComponentParent = e.parent;
					loopComponent[i] = e.componentName;
				
				}else{

					unuseComponentIndex.push(Number(i) - 1);
					loopComponent[i-1] = e.componentName;

				}
				
				if(loopTarget[loopTarget.length-1] !== e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")){

					loopTarget.push(e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,""));
					stateVariabel[e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")] = null;

				}
				
				if(loopArgs !== e.rootAttr['loop']){
				
					loopArgs = e.rootAttr['loop'];
					loopChild = "";
					loopChild += e.component;
					nameOfChildContent = [];
					nameOfChildContent.push(e.componentName);
				
				}else {
				
					loopChild += e.component;
					nameOfChildContent.push(e.componentName);
				
				}

				loopMethod = `
					for(let $$LoopData in ${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")}){
						if(Number.isInteger(parseInt($$LoopData))){
							${loopComponent.map((de)=> `ArrayOfComponent_${de}.push($$Template_Function_${de}({
								target: null,
							    data: ${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")},
							    index: parseInt($$LoopData),
							},Node));`).join(" ")}
						}
					}

					${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")} = ArrayWatcher(${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")},{
					watch(target,from,object,property){

							if(from === "set"){

								${loopTarget.map((e,i)=>{
									return `
										_Observer.emit("${e}_"+target,{data: object, index: property, target});
									`
								}).join('\n')}

							}

							return 1;
						}
					});
				`

				return `
				
				const ArrayOfComponent_${e.componentName} = [];
				const $$Template_Function_${e.componentName} = ({target,data,index}, Node)=> { 
					
					let ${e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")} = data[index];
					${loopChild}

					return {
						update(props){
							${nameOfChildContent.filter(_e => _e).map(__e =>{
								if(/\_component$/igm.test(__e)){
									return `${__e}.update(undefined,{${
										(calledComponent[__e]) ? Object.keys(calledComponent[__e]).map(d =>{
											return `${d}: props['${e.rootAttr.loop.split(" ")[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")}']`
										}).join(', ')+',...props' 
										: 
										'...props'
									}});`;
								}else{
									return `${__e}_content.update(undefined,{${
										(calledComponent[__e]) ? Object.keys(calledComponent[__e]).map(d =>{
											return `${d}: props['${e.rootAttr.loop.split(" ")[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")}']`
										}).join(', ') +',...props'
										: 
										'...props,'
									}});`;
								}
							}).join(" ")}
						},
						destroy(){
							${nameOfChildContent.filter(e => e).map(e =>{

								if(/\_component$/igm.test(e)){
									return `Node.destroy(${e}.element);`;
								}else {
									return `Node.destroy(${e});`;
								}

							}).join(" ")}
						}
					}
				
				}

				const loopHandler_${e.componentName} = {
					push(props){
						ArrayOfComponent_${e.componentName}.push($$Template_Function_${e.componentName}(props,Node));
					},
					unshift(props){
						ArrayOfComponent_${e.componentName}.unshift($$Template_Function_${e.componentName}({...props,index: 0},{Render: Node.RenderBefore, destroy: Node.destroy}));
					},
					shift(props){
						if(ArrayOfComponent_${e.componentName}.length > 0){
							ArrayOfComponent_${e.componentName}[0].destroy(props);
							ArrayOfComponent_${e.componentName}.shift();
						}
					},
					pop(props){
						const {index,data} = props;
						if(ArrayOfComponent_${e.componentName}.length > 0){
							ArrayOfComponent_${e.componentName}[data.length].destroy(props);
							ArrayOfComponent_${e.componentName}.pop();
						}
					},
					update(props){
						const {data, index} = props;
						if(ArrayOfComponent_${e.componentName}.length > 0) ArrayOfComponent_${e.componentName}[index].update({${e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")}: data[index]});
					}
				}
				
				for(let x in loopHandler_${e.componentName}){
				
					_Observer.subscribe("${e.rootAttr.loop.split(" ")[2].replace(/(\n|\r|\t|\"|\'|\`)/igm,"")}_"+x,loopHandler_${e.componentName}[x]);
					
				}
				`
			}
			return e.component
		
		});

		for(let x of unuseComponentIndex){
			rawComponentString[x] = '';
		}

		result.push({
			component: rawComponentString.join(" ")+loopMethod,
			start: a[0].location.sourceCodeLocation.startCol,
			end: a[0].location.sourceCodeLocation.endCol,
			uid: uuidv4()
		});

	}

	const JSX = [];
	const NON_JSX = [];

	result.forEach((e,i) =>{

		JSX.push({
			component: e.component,
			raw: source.substring(e.start-1,e.end-1),
			position: i
		});

		if(i !== 0) NON_JSX.push({
			raw: source.substring(result[i-1].end-1,result[i].start-1),
			position: i
		})
		else if(i === 0 && NON_JSX.length === 0) NON_JSX.push({
			raw: source.substring(0,result[i].start-1),
			position: i
		})

	});

	NON_JSX.push({
		raw: source.substring(result[result.length-1].end-1,source.length),
		position: NON_JSX.length
	})

	let lastResult = "";

	for(let x in NON_JSX){

		if(parseInt(x) < NON_JSX.length-1) lastResult += NON_JSX[x].raw + JSX[x].component
		else lastResult += NON_JSX[x].raw

	}

	const SelekuResult = beautify(lastResult.replace(/(\n\n)/igm, "\n"), { indent_size: 2, space_in_empty_paren: true });
	
	const tree = ASTParse(SelekuResult);

	let selekuComponent = {};
	walk(tree,(node,parent)=>{

		if(node.type === 'VariableDeclarator'){

			if(node.init?.type === 'ArrowFunctionExpression' && 
			   node.id.type === 'Identifier'){

				node.init?.body?.body?.forEach((e,i)=>{

					if(e.type === 'VariableDeclaration' && 
					e.declarations[0].init.type === 'CallExpression' && 
					e.declarations[0].init.callee.type === 'MemberExpression' && 
					e.declarations[0].init.callee.object.name === 'Seleku'){
						selekuComponent[node.id.name] = null;
					}
				});

				callbackComponentArrowFunction({node,from: 'ArrowFunctionExpression'});
			}
		}

		if(node.type === 'VariableDeclarator'){

			if(node.init?.type === 'FunctionExpression' && 
			   node.id.type === 'Identifier'){

			   
				node.init?.body?.body?.forEach((e,i)=>{

					if(e.type === 'VariableDeclaration' && 
					e.declarations[0].init.type === 'CallExpression' && 
					e.declarations[0].init.callee.type === 'MemberExpression' && 
					e.declarations[0].init.callee.object.name === 'Seleku'){
						
						selekuComponent[node.id.name] = null;
					}

					if(e.type === 'VariableDeclaration' && !onceTime && e.declarations[0]?.init?.callee?.object?.name === 'Seleku'){
						node.init?.body?.body.push({
						  type: 'ReturnStatement',
						  argument: ASTParse(`({element: ${e.declarations[0].id.name},update(content,data,state,value){
							  	${component_loop_child.map(d =>{
							  		return `
							  			
							  			${d.replace(/\_content/igm,'_attribute')}.update(data);
							  			${d}.update(content,data);
							  			`
							  	}).join(' ')+'$$State.state[state]=value;'}}})`)
						});

						onceTime = true;
					}

				});

				callbackComponentArrowFunction({node,from: 'ArrowFunctionExpression'});
			}
		}

		if(node.type === 'FunctionDeclaration'){

			node.body?.body?.forEach((e,i)=>{

				if(e.type === 'VariableDeclaration' && 
					e.declarations[0].init.type === 'CallExpression' && 
					e.declarations[0].init.callee.type === 'MemberExpression' && 
					e.declarations[0].init.callee.object.name === 'Seleku'){
					selekuComponent[node.id.name] = null;
				}

			});

			callbackComponentArrowFunction({node,from: 'FunctionDeclaration'});
		}
	});

	let parents = '';
	walk(tree,(node, parent)=>{

		if(node.type === 'VariableDeclarator'){

			if(node.init?.type === 'ArrowFunctionExpression' && 
			   node.id.type === 'Identifier'){

			   	let onceTime = false;
			    let state = {};
			    let component_loop_child = [];

			    node.init?.body?.body?.forEach((e,i)=>{
			    	if(e.type === 'VariableDeclaration'){
						if(/\_content/igm.test(e.declarations[0].id.name)) component_loop_child.push(e.declarations[0].id.name);
					}
			    });

				node.init?.body?.body?.forEach((e,i)=>{

					if(e.type === 'VariableDeclaration' && 
					e.declarations[0].init.type === 'CallExpression' && 
					e.declarations[0].init.callee.type === 'MemberExpression' && 
					e.declarations[0].init.callee.object.name === 'Seleku'){
						componentFunctionName[node.id?.name] = null;
						parents = node.id?.name;
					}

					if(e.type === 'VariableDeclaration' && !onceTime && e.declarations[0]?.init?.callee?.object?.name === 'Seleku'){
						node.init?.body?.body.push({
						  type: 'ReturnStatement',
						  argument: ASTParse(`({element: ${e.declarations[0].id.name},update(content,data,state,value){
							  	${component_loop_child.map(d =>{
							  		return `
							  			
							  			${d.replace(/\_content/igm,'_attribute')}.update(data);
							  			${d}.update(content,data);
							  			`
							  	}).join(' ')+'$$State.state[state]=value;'}}})`)
						});
						onceTime = true;
					}

				});

				callbackComponentArrowFunction({node,from: 'ArrowFunctionExpression'});
			}
		}

		if(node.type === 'VariableDeclarator'){

			if(node.init?.type === 'FunctionExpression' && 
			   node.id.type === 'Identifier'){

			   	let onceTime = false;
			    let state = {};
			    let component_loop_child = [];

			    node.init?.body?.body?.forEach((e,i)=>{
			    	if(e.type === 'VariableDeclaration'){
						if(/\_content/igm.test(e.declarations[0].id.name)) component_loop_child.push(e.declarations[0].id.name);
					}
			    });

				node.init?.body?.body?.forEach((e,i)=>{

					if(e.type === 'VariableDeclaration' && 
					e.declarations[0].init.type === 'CallExpression' && 
					e.declarations[0].init.callee.type === 'MemberExpression' && 
					e.declarations[0].init.callee.object.name === 'Seleku'){
						componentFunctionName[node.id?.name] = null;
						parents = node.id?.name;
						
					}

					if(e.type === 'VariableDeclaration' && !onceTime && e.declarations[0]?.init?.callee?.object?.name === 'Seleku'){
						node.init?.body?.body.push({
						  type: 'ReturnStatement',
						  argument: ASTParse(`({element: ${e.declarations[0].id.name},update(content,data,state,value){
							  	${component_loop_child.map(d =>{
							  		return `
							  			
							  			${d.replace(/\_content/igm,'_attribute')}.update(data);
							  			${d}.update(content,data);
							  			`
							  	}).join(' ')+'$$State.state[state]=value;'}}})`)
						});

						onceTime = true;
					}

					if(e.type === 'VariableDeclaration' && e.declarations[0].id.name in stateVariabel){

						state[e.declarations[0].id.name] = null;
						if(/\_content/igm.test(e.declarations[0].id.name)) component_loop_child.push(e.declarations[0].id.name);

					}

					if(e.type === 'ExpressionStatement' && (e.expression.type === 'UpdateExpression')){
						if(!(e.expression.argument.name in state)){
							e.expression.argument.name = `$$State.state.${e.expression.argument.name}`;
						}
					}

					if(e.type === 'ExpressionStatement' && e.expression.type === 'AssignmentExpression'){
						if(!(e.expression.left.name in state)){
							e.expression.left.name = `$$State.state.${e.expression.left.name}`;	
						}
					}

				});

				callbackComponentArrowFunction({node,from: 'ArrowFunctionExpression'});
			}
		}

		if(node.type === 'FunctionDeclaration'){
			let onceTime = false;
			let state = {};
			let component_loop_child = [];

			node.body?.body?.forEach((e,i)=>{
		    	if(e.type === 'VariableDeclaration'){
					if(/\_content/igm.test(e.declarations[0].id.name)) component_loop_child.push(e.declarations[0].id.name);
				}
		    });

			node.body?.body?.forEach((e,i)=>{

				if(e.type === 'VariableDeclaration' && 
					e.declarations[0].init.type === 'CallExpression' && 
					e.declarations[0].init.callee.type === 'MemberExpression' && 
					e.declarations[0].init.callee.object.name === 'Seleku'){
					componentFunctionName[node.id?.name] = null;
					parents = node.id?.name;
				}

				if(e.type === 'VariableDeclaration' && !onceTime && e.declarations[0]?.init?.callee?.object?.name === 'Seleku'){
					node.body?.body.push({
					  type: 'ReturnStatement',
					  argument: ASTParse(`({element: ${e.declarations[0].id.name},update(content,data,state,value){
							  	${component_loop_child.map(d =>{
							  		return `
							  			
							  			${d.replace(/\_content/igm,'_attribute')}.update(data);
							  			${d}.update(content,data);
							  			`
							  	}).join(' ')+'$$State.state[state]=value;'}}})`)
					});
					onceTime = true;
				}

				if(e.type === 'VariableDeclaration' && e.declarations[0].id.name in stateVariabel){

					state[e.declarations[0].id.name] = null;
					
				}

				if(e.type === 'ExpressionStatement' && (e.expression.type === 'UpdateExpression')){
					if(!(e.expression.argument.name in state)){
						e.expression.argument.name = `$$State.state.${e.expression.argument.name}`;
					}
				}

				if(e.type === 'ExpressionStatement' && e.expression.type === 'AssignmentExpression'){
					
					if(!(e.expression.left.name in state)){
						e.expression.left.name = `$$State.state.${e.expression.left.name}`;	
					}
				}


			});

			callbackComponentArrowFunction({node,from: 'FunctionDeclaration'});
		}

		if(node.type === 'CallExpression'){

			if(node.callee.type === 'Identifier'){

				if(node.callee.name === 'Watcher'){

					node.arguments.push({type: 'Identifier', name: '_Observer'});

					let watchState = {};
					node.arguments[1].elements.map(e =>{
						watchState[e.name] = null;
						e.name = `"${e.name}"`;
					});

					let state = {};
					let component_loop_child = [];
					let onceTime = false;
					node.arguments[0]?.body?.body?.forEach((e,i)=>{
				    	if(e.type === 'VariableDeclaration'){
							if(/\_content/igm.test(e.declarations[0].id.name)) component_loop_child.push(e.declarations[0].id.name);
						}
				    });
					node.arguments[0]?.body?.body?.forEach((e,i)=>{

						if(e.type === 'VariableDeclaration' && 
						e.declarations[0].init.type === 'CallExpression' && 
						e.declarations[0].init.callee.type === 'MemberExpression' && 
						e.declarations[0].init.callee.object.name === 'Seleku'){
							componentFunctionName[node.id?.name] = null;
						}

						if(e.type === 'VariableDeclaration' && !onceTime && e.declarations[0]?.init?.callee?.object?.name === 'Seleku'){
							node.init?.body?.body.push({
							  type: 'ReturnStatement',
							  argument: ASTParse(`({element: ${e.declarations[0].id.name},update(content,data,state,value){
							  	${component_loop_child.map(d =>{
							  		return `
							  			
							  			${d.replace(/\_content/igm,'_attribute')}.update(data);
							  			${d}.update(content,data);
							  			`
							  	}).join(' ')+'$$State.state[state]=value;'}}})`)
							});
							onceTime = true;
						}

						if(e.type === 'VariableDeclaration'){

							state[e.declarations[0].id.name] = null;
							if(/\_content/igm.test(e.declarations[0].id.name)) component_loop_child.push(e.declarations[0].id.name);

						}

				
						if(e.type === 'VariableDeclaration'){
						if(e.declarations[0].init?.type === 'ArrowFunctionExpression' && 
						   e.declarations[0].id.type === 'Identifier'){

								e.declarations[0].init?.body?.body?.forEach((_e,i)=>{

									if(_e.type === 'VariableDeclaration'){

										state[_e.declarations[0].id.name] = null;

									}

								});

								callbackComponentArrowFunction({e,from: 'ArrowFunctionExpression'});
							}
						}


						if(e.type === 'FunctionDeclaration'){
							e.body?.body?.forEach((_e,i)=>{
								if(_e.type === 'VariableDeclaration'){

									state[_e.declarations[0].id.name] = null;
									
								}
							});

							callbackComponentArrowFunction({e,from: 'FunctionDeclaration'});
						}

					});

				}

			}
		}

		if(node.type === 'ArrowFunctionExpression'){
			let state = {};

			if(!(node.body?.body)){
				if(parents in selekuComponent && node.body.type === 'UpdateExpression'){
					if(!(node.body.argument.name in state)){
						node.body.argument.name = `$$State.state.${node.body.argument.name}`;
					}
				}
			}

			node.body?.body?.forEach((e,i)=>{
				if(e.type === 'VariableDeclaration' && e.declarations[0].id.name in stateVariabel){
					state[e.declarations[0].id.name] = null;
				}

				find(e,{type: 'VariableDeclaration'}).forEach(e =>{
					if(e.declarations[0].id.name in stateIdentifier){
						state[e.declarations[0].id.name] = null;
						if(parent.type === 'VariableDeclarator' && !(parent.id.name.match(/\$\$Template_Function/)) && !(generate(node.body.body[i]).match(/\$\$Template_Function/))){
							node.body.body[i] = ASTParse(generate(node.body.body[i])
							.replace(
								generate(e),
								generate(e)+`$$$State.state.${
									e.declarations[0].id.name
								} = ${
									e.declarations[0].id.name
								}\n\n`));
						}
					}
				});

				if(parents in selekuComponent && e.type === 'ExpressionStatement' && (e.expression.type === 'UpdateExpression')){
					if(!(e.expression.argument.name in state)){
						e.expression.argument.name = `$$State.state.${e.expression.argument.name}`;
					}
				}

				if(parents in selekuComponent && e.type === 'ExpressionStatement' && e.expression.type === 'AssignmentExpression'){
					if(!(e.expression.left.name in state)){
						e.expression.left.name = `$$State.state.${e.expression.left.name}`;	
					}
				}

				find(e,{type: 'AssignmentExpression'}).forEach(e=>{
					if(parents in selekuComponent && !(e.left.name in state) && !(/\$\$State\.state/igm.test(e.left.name))){
						e.left.name = `$$State.state.${e.left.name}`;
					}
				});
			});
		}

		if(node.type === 'FunctionExpression'){
			let state = {};
			node.body.body.forEach((e,i)=>{
				if(e.type === 'VariableDeclaration' && e.declarations[0].id.name in stateVariabel){
					state[e.declarations[0].id.name] = null;
				}

				find(e,{type: 'VariableDeclaration'}).forEach(e =>{
					if(e.declarations[0].id.name in stateVariabel){
						state[e.declarations[0].id.name] = null;
						if(parent.type === 'VariableDeclarator' && !(parent.id.name.match(/\$\$Template_Function/)) && !(generate(node.body.body[i]).match(/\$\$Template_Function/))){
							
							node.body.body[i] = ASTParse(generate(node.body.body[i])
							.replace(
								generate(e),
								generate(e)+`$$$State.state.${
									e.declarations[0].id.name
								} = ${
									e.declarations[0].id.name
								}\n\n`));
						}
					}					
				})

				if(e.type === 'ExpressionStatement' && (e.expression.type === 'UpdateExpression')){
					if(!(e.expression.argument.name in state)){
						e.expression.argument.name = `$$State.state.${e.expression.argument.name}`;
					}
				}

				if(e.type === 'ExpressionStatement' && e.expression.type === 'AssignmentExpression'){
					if(!(e.expression.left.name in state)){
						e.expression.left.name = `$$State.state.${e.expression.left.name}`;	
					}
				}

				find(e,{type: 'AssignmentExpression'}).forEach(e=>{
					if(!(e.left.name in state) && !(/\$\$State\.state/igm.test(e.left.name))){
						e.left.name = `$$State.state.${e.left.name}`;
					}
				});

				find(e,{type: 'UpdateExpression'}).forEach(e=>{
					if(!(e.argument.name in state) && !(/\$\$State\.state/igm.test(e.argument.name))){
						e.argument.name = `$$State.state.${e.argument.name}`;
					}
				});


			});
		}
	});

	walk(tree,(node,parent)=>{

		if(node.type === 'ArrowFunctionExpression'){

			let state = {};
			node.body?.body?.forEach((e,i)=>{
				
				if(e.type === 'VariableDeclaration' && e.declarations[0].id.name in stateVariabel){
					state[e.declarations[0].id.name] = null;
				}

				if(node.body?.body[i].type !== 'VariableDeclaration'){
					if(node.body?.body[i].body){
						walk(node.body?.body[i],(_node,_parent)=>{
							if(_node.type === 'CallExpression' && _node.callee.object?.name !== 'Node'){
								let obj = {};
								_node.arguments.forEach(d =>{
									Object.assign(obj,d);
								});
								walk(_node,((e,p)=>{
									if(e.type !== 'VariableDeclaration' && !(e.name in state) && e.name in stateIdentifier){
										if(p.type !== 'VariableDeclarator'){
											 find(_node,{type: 'Identifier'}).forEach((e,i) =>{
												if(!(e.name in state) && e.name in stateIdentifier){
													if(/^\{.*?\}$/igm.test(generate(obj).replace(/(\n|\t|\r)/igm,''))){
														
														let ty = generate(obj);
														ty.replace(/(\n|\t|\r|\s+|\{|\})/igm,'')
														.split(',')
														.filter(r => /\w.*?\:/igm.test(r))
														.forEach((d =>{
															if(d.match(new RegExp(`^${generate(e)}:`))){
																ty = d.replace(new RegExp(`^${generate(e)}\\:`),'')
																// console.
															}
														}));

														walk(_node,(n,p)=>{
															if(n.type === 'Property'){ 
																if(ty.match(e.name) && n.value.type === 'Identifier'){
																	n.value.name = (generate(obj).replaceAll(ty,`$$$State.state.${e.name}`));
																}
															}
														});



													}else{
														e.name = `$$State.state.${e.name}`;
													}
												}
											});
										}
									}
								}));
							}
						});

					}
					if(node.body?.body[i].expression?.type === 'CallExpression'){
						walk(node.body?.body[i],(_node,_parent)=>{
							if(_node.type === 'CallExpression' && _node.callee.object?.name !== 'Node'){
								let obj = {};
								_node.arguments.forEach(d =>{
									Object.assign(obj,d);
								});
								find(_node,{type: 'Identifier'}).forEach(e =>{
									
									if(!(e.name in state) && e.name in stateIdentifier){
										find(_node,{type: 'Identifier'}).forEach((e,i) =>{
											if(!(e.name in state) && e.name in stateIdentifier){
												if(/^\{.*?\}$/igm.test(generate(obj).replace(/(\n|\t|\r)/igm,''))){
													
													let ty = generate(obj);
													ty.replace(/(\n|\t|\r|\s+|\{|\})/igm,'')
													.split(',')
													.filter(r => /\w.*?\:/igm.test(r))
													.forEach((d =>{
														if(d.match(new RegExp(`^${generate(e)}:`))){
															ty = d.replace(new RegExp(`^${generate(e)}\\:`),'')
															// console.
														}
													}));

													walk(_node,(n,p)=>{
														if(n.type === 'Property'){ 
															if(ty.match(e.name) && n.value.type === 'Identifier'){
																n.value.name = (generate(obj).replaceAll(ty,`$$$State.state.${e.name}`));
															}
														}
													});



												}else{
													e.name = `$$State.state.${e.name}`;
												}
											}
										});
									}
								});
							}
						});
					}
				}
			});
		}

		if(node.type === 'FunctionExpression'){

			let state = {};
			node.body?.body?.forEach((e,i)=>{
				
				if(e.type === 'VariableDeclaration' && e.declarations[0].id.name in stateVariabel){
					state[e.declarations[0].id.name] = null;
				}

				if(node.body?.body[i].type !== 'VariableDeclaration'){
					if(node.body?.body[i].body){
						walk(node.body?.body[i],(_node,_parent)=>{
							
							if(_node.type === 'CallExpression' && _node.callee.object?.name !== 'Node'){
								
								let obj = {};
								_node.arguments.forEach(d =>{
									Object.assign(obj,d);
								});

								walk(_node,((e,p)=>{				
									if(e.type !== 'VariableDeclaration' && !(e.name in state) && e.name in stateIdentifier){
										if(p.type !== 'VariableDeclarator'){
											 find(_node,{type: 'Identifier'}).forEach((e,i) =>{
												if(!(e.name in state) && e.name in stateIdentifier){
													if(/^\{.*?\}$/igm.test(generate(obj).replace(/(\n|\t|\r)/igm,''))){
														
														let ty = generate(obj);
														ty.replace(/(\n|\t|\r|\s+|\{|\})/igm,'')
														.split(',')
														.filter(r => /\w.*?\:/igm.test(r))
														.forEach((d =>{
															if(d.match(new RegExp(`^${generate(e)}:`))){
																ty = d.replace(new RegExp(`^${generate(e)}\\:`),'')
																// console.
															}
														}));

														walk(_node,(n,p)=>{
															if(n.type === 'Property'){ 
																if(ty.match(e.name) && n.value.type === 'Identifier'){
																	n.value.name = (generate(obj).replaceAll(ty,`$$$State.state.${e.name}`));
																}
															}
														});



													}else{
														e.name = `$$State.state.${e.name}`;
													}
												}
											});
										}
									}
								}));
							}
						});

					}
					if(node.body?.body[i].expression?.type === 'CallExpression'){
						walk(node.body?.body[i],(_node,_parent)=>{
							if(_node.type === 'CallExpression' && _node.callee.object?.name !== 'Node'){
								let obj = {};
								_node.arguments.forEach(d =>{
									Object.assign(obj,d);
								});
								
								find(_node,{type: 'Identifier'}).forEach((e,i) =>{
									if(!(e.name in state) && e.name in stateIdentifier){
										if(/^\{.*?\}$/igm.test(generate(obj).replace(/(\n|\t|\r)/igm,''))){
											
											let ty = generate(obj);
											ty.replace(/(\n|\t|\r|\s+|\{|\})/igm,'')
											.split(',')
											.filter(r => /\w.*?\:/igm.test(r))
											.forEach((d =>{
												if(d.match(new RegExp(`^${generate(e)}:`))){
													ty = d.replace(new RegExp(`^${generate(e)}\\:`),'')
													// console.
												}
											}));

											walk(_node,(n,p)=>{
												if(n.type === 'Property'){ 
													if(ty.match(e.name) && n.value.type === 'Identifier'){
														n.value.name = (generate(obj).replaceAll(ty,`$$$State.state.${e.name}`));
													}
												}
											});



										}else{
											e.name = `$$State.state.${e.name}`;
										}
									}
								});
							}
						});
					}
				}
			});
		}

		if(node.type === 'CallExpression'){

			if(node.callee.type === 'Identifier'){

				if(node.callee.name === 'Watcher'){

					let watchState = {};
					node.arguments[1].elements.map(e =>{
						watchState[e.name.replace(/(\"|\'|\`)/igm,'')] = null;
					});

					node.arguments[0]?.body?.body?.forEach((e,i)=>{

						find(e,{type: 'UpdateExpression'}).forEach(e=>{
							if(e.argument.name.match(/\$\$State\.state\./igm) && e.argument.name.replace('$$State.state.','') in watchState){
								console.log(`\n\nFatal : \n "cannot assign or update variabel that has been watched" \nError at : \n${
								highlight(generate(node).replace(generate(e),'$& //<-- at this').replace(/\$\$State\.state\./igm,''),{
								 	jsx: true,
								 	linenos: true,
								 	theme: require('cardinal/themes/tomorrow-night.js')
								 })
								}\n`);
								console.log(`warning at "${generate(e).replace(/\$\$State\.state\./igm,'')}"`)
								console.log(`in wather function only read state variabel that you watch\n\n`)
							}
						});

						find(e,{type: 'AssignmentExpression'}).forEach(e=>{
							if(e.left.name.match(/\$\$State\.state\./igm) && e.left.name.replace('$$State.state.','') in watchState){
								console.log(`\n\nFatal : \n "cannot assign or update variabel that has been watched" \nError at : \n${
								highlight(generate(node).replace(generate(e),'$& //<-- at this').replace(/\$\$State\.state\./igm,''),{
								 	jsx: true,
								 	linenos: true,
								 	theme: require('cardinal/themes/tomorrow-night.js')
								 })
								}\n`);
								console.log(`warning at "${generate(e).replace(/\$\$State\.state\./igm,'')}"`)
								console.log(`in wather function only read state variabel that you watch\n\n`)
							}
						});

					});

				}

			}

		}
	});

	replace(tree,(node) => {

		if(node.type === 'ImportDeclaration'){
		    const SelekuCore = [ 
		    "ArrayWatcher", 
		    "Observer", 
		    "CreateCustomState",
		    "Seleku",
		    "CreateState"];
		    if(node.source.value === 'seleku-v3.0/seleku-core'){
		      for(let x of SelekuCore){
		        node.specifiers.push(
		          {
		            type: 'ImportSpecifier',
		            local: { type: 'Identifier', name: x },
		            imported: { type: 'Identifier', name: x }
		          }
		        )
		      }
		    }
		  }

		if(node.type === 'VariableDeclaration'){
			if(node.declarations[0]?.init?.type === 'ArrowFunctionExpression' && 
			   node.declarations[0].id.type === 'Identifier' && 
			   node.declarations[0].id.name in componentFunctionName){
				
				node.declarations[0]?.init?.params.push(
					{ type: 'Identifier', name: '$$_parent' }
				);

			}

			if(node.declarations[0]?.init?.type === 'ArrowFunctionExpression' && node.declarations[0].id.name in componentFunctionName){
				node.declarations[0].init.body.body.unshift(ASTParse(`let _Observer = new Observer();const _State = class extends CreateState {
  constructor(args) {
    super(args);
  }
  update(prop) {
    _Observer.emit(prop, this.object);
  }
};let $$State = new _State({});`));
			}

		}

		if(node.type === 'FunctionDeclaration'){

			if(node.id.name in componentFunctionName){
				node.params.push(
					{ type: 'Identifier', name: '$$_parent' }
				);
			}

			if(node.id.name in componentFunctionName){
				node.body.body.unshift(ASTParse(`let _Observer = new Observer();const _State = class extends CreateState {
  constructor(args) {
    super(args);
  }
  update(prop) {
    _Observer.emit(prop, this.object);
  }
};let $$State = new _State({});`));
			}

		}

		return node;

	});

	// Seleku API access AST
	if(API.AST) API.AST(tree);

	return generate(binaryExpressionReduction(tree)).replace(/\$\$State\.state\.\$\$State\.state./igm,'$$$State.state.');
}

