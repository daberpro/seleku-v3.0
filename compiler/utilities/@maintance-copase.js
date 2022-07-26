/**
 * copase has been maintenance
 * and will update soon
 * */

const {parse, walk, find, generate} = require('abstract-syntax-tree');
const { transpile } = require('../../copase/compiler.js');

const classRegister = {};
classRegister['mediaQuery'] = {
	'sm': {},
	'md': {},
	'lg': {}
};
module.exports = (component,stateIdentifier,StyleSheet)=>{

	component.forEach((e,i)=>{

		if(e.cAttr){

			let tree = parse(e.component);
			let stateAttr = {}; 

			walk(tree,(node,parent)=>{

				if(node.type === 'VariableDeclaration'){

					if(/\_attribute/igm.test(node.declarations[0].id.name)){

						find(node,{type: 'ObjectExpression'}).forEach(e=>{
							e.properties.forEach((r)=>{
								if(r.value.type === 'Literal' && typeof r.value.value === 'string'){
									if(r.key.value === 'class'){
									
										const css = transpile(r.value.value,classRegister)											
										r.value.value = css.className;

									}
								}
							});
						});

					}

				}

			});

			e.component = generate(tree) + Object.keys(stateAttr).filter(e => stateAttr[e]).map(e => `_Observer.subscribe('${stateAttr[e]}',(data)=> ${e}.update(data));`).join(' ');
		}

	});

	let mediaQ = '';
	const mediaSize = {
		sm: {
			min: 0,
			max: 400
		},
		md: {
			min: 400,
			max: 800
		},
		lg: {
			min: 800,
			max: 2000
		}
	}

	for(let x in classRegister['mediaQuery']){

		mediaQ += `@media screen and (min-width: ${mediaSize[x].min}px) and (max-width:${mediaSize[x].max}px){
			${Object.keys(classRegister['mediaQuery'][x]).map(e => `
				.${e}{
					${Object.keys(classRegister['mediaQuery'][x][e]).join('\n')}
				}
			`)}
		}`;
	}
	
	for(let x in classRegister){
		StyleSheet.push(classRegister[x].component);
	}

	StyleSheet.push(mediaQ);

}