const specialAttributeRegister = require('./specialAttributeRegister.js');
const { 
	parse, 
	walk, 
	replace, 
	generate, 
	find, 
	each
} = require('abstract-syntax-tree');

module.exports = (component,stateIdentifier)=>{

	let conditionTemplate  = {};
	let _parent = '';
	let parentTarget = {};

	component.forEach((e,i)=>{

		let tree = parse(e.component);

		if(e.attr?.hasOwnProperty('condition_if')){
			parentTarget = {};
			walk(tree,(node,parent)=>{

				if(node.type === 'VariableDeclaration'){

					if(/\_attribute/igm.test(node.declarations[0].id.name)){

						find(node,{type: 'ObjectExpression'}).forEach((_e)=>{
							find(_e,{type: 'Identifier'}).forEach((r,i)=>{
								stateIdentifier[r.name] = null;
								if(r.name in conditionTemplate && e.attr['condition_if'] in conditionTemplate[r.name]){
									conditionTemplate[r.name][e.attr['condition_if']].child.push(`Node.Render(${e.componentName},${e.parent})`);
								}else if(r.name in conditionTemplate){
									conditionTemplate[r.name][e.attr['condition_if']] = {
										child: [`Node.Render(${e.componentName},${e.parent})`],
										type: 'if'
									}
								}else{
									conditionTemplate[r.name] = {
										[e.attr['condition_if']]: {
											child: [`Node.Render(${e.componentName},${e.parent})`],
											type: 'if'
										}
									};
								}

								parentTarget[r.name] = null;
							});
						});

					}

				}

			});

			_parent = e.attr['condition_if'];

		}else if(e.attr?.hasOwnProperty('condition_else_if')){
			
			parentTarget = {};

			walk(tree,(node,parent)=>{

				if(node.type === 'VariableDeclaration'){

					if(/\_attribute/igm.test(node.declarations[0].id.name)){

						find(node,{type: 'ObjectExpression'}).forEach((_e)=>{
							find(_e,{type: 'Identifier'}).forEach((r,i)=>{
								stateIdentifier[r.name] = null;
								if(r.name in conditionTemplate && e.attr['condition_else_if'] in conditionTemplate[r.name]){
									conditionTemplate[r.name][e.attr['condition_else_if']].child.push(`Node.Render(${e.componentName},${e.parent})`);
								}else if(r.name in conditionTemplate){
									conditionTemplate[r.name][e.attr['condition_else_if']] = {
										child: [`Node.Render(${e.componentName},${e.parent})`],
										type: 'else if',
										parent: _parent,
									}
								}else{
									conditionTemplate[r.name] = {
										[e.attr['condition_else_if']]: {
											child: [`Node.Render(${e.componentName},${e.parent})`],
											type: 'else if',
											parent: _parent,
										}
									};
								}

								parentTarget[r.name] = null;
							});
						});

					}

				}

			});

			_parent = e.attr['condition_else_if'];
		}else if(e.attr?.hasOwnProperty('condition_else')){
			
			walk(tree,(node,parent)=>{

				if(node.type === 'VariableDeclaration'){

					if(/\_attribute/igm.test(node.declarations[0].id.name)){

						find(node,{type: 'ObjectExpression'}).forEach((_e)=>{
							find(_e,{type: 'Literal'}).forEach(r =>{
								if(r.value === null){
									for(let x in parentTarget){
										if(conditionTemplate[x].hasOwnProperty(_parent)){
											conditionTemplate[x]['else'] = {
												child: [`Node.Render(${e.componentName},${e.parent})`],
												type: 'else',
												parent: _parent,
											}
										}
									}
								}
							})
						});

					}

				}

			});

		}

		specialAttributeRegister(e,'condition_if');
		specialAttributeRegister(e,'condition_else_if');
		specialAttributeRegister(e,'condition_else');

	});

	let result = '';

	for(let x in conditionTemplate){
		

		let child = '';
		let child_component = {};

		for(let y in conditionTemplate[x]){
			
			let destroy_child = [];

			Object.keys(conditionTemplate[x]).forEach( e =>{
				if(e !== y){
					destroy_child = [
						...destroy_child,
						...conditionTemplate[x][e].child.map( f =>{
							return f.replace('Render','destroy').replace(/\,.*?\)/igm,')');
						})
					];
				}
			})

			child_component[y] = [
				...conditionTemplate[x][y].child,
				...destroy_child
			];
		}

		let isThereElse = false;

		for(let y in conditionTemplate[x]){
			if(conditionTemplate[x][y].type !== 'else'){
				child += `
					${conditionTemplate[x][y].type}(${y}){
						${child_component[y].join(';')}
					}
				`
			}else{
				child += `
					${conditionTemplate[x][y].type}{
						${child_component[y].join(';')}
					}
				`

				isThereElse = true;
			}

		}

		for(let y in conditionTemplate[x]){
			if(!isThereElse){
				child +=`
					else{
						${child_component[y].join(' ')
						.replace(/(\n|\r|\t)/igm,'')
						.replace(/Render/igm,'destroy')
						.replace(/\,.*?\)/igm,');')}
					}
				`;
			}
		}

		result += `
			_Observer.subscribe('${x}',($$data)=>{
				${child}
			});
		`;
	}

	component[component.length-1].component += result;

}