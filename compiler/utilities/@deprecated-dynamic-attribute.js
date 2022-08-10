const {parse, walk, find, generate} = require('abstract-syntax-tree');

module.exports = (component)=>{

	component.forEach((e,i)=>{

		if(e.cAttr){

			let tree = parse(e.component);
			let stateAttr = {}; 

			walk(tree,(node,parent)=>{

				if(node.type === 'VariableDeclaration'){

					if(/\_attribute/igm.test(node.declarations[0].id.name)){

						find(node,{type: 'ObjectExpression'}).forEach(e=>{
							e.properties.forEach((r)=>{

								if(r.value.type === 'MemberExpression'){
									const value = generate(r.value);
									stateAttr[node.declarations[0].id.name] = r.value.object.name;
									e.properties.push(parse(`({'$$$_${r.key.value}': ${value}})`).body[0].expression.properties[0]);
									e.properties.push({
									  type: 'Property',
									  key: { type: 'Literal', value: r.value.object.name, raw: `"${r.value.object.name}"`},
									  value: {type: 'Literal', value: r.value.object.name},
									  kind: 'init',
									  computed: false,
									  method: false,
									  shorthand: false
									});

									r.value = {
										type: 'Literal',
										value: value
									};
								}

								if(r.value.type === 'Identifier'){

									stateAttr[node.declarations[0].id.name] = r.value.name;
									e.properties.push(parse(`({'$$$_${r.key.value}': ${r.value.name}})`).body[0].expression.properties[0]);
									e.properties.push({
									  type: 'Property',
									  key: { type: 'Literal', value: r.value.name },
									  value: { type: 'Identifier', name: r.value.name },
									  kind: 'init',
									  computed: false,
									  method: false,
									  shorthand: false
									});
									r.value = {
										type: 'Literal',
										value: r.value.name
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

}