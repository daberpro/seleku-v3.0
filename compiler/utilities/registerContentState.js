const {parse, walk, find, generate} = require('abstract-syntax-tree');

module.exports = (component,stateIdentifier)=>{

	component.forEach((e,i)=>{

		if(e.cAttr){

			let tree = parse(e.component);
			let stateAttr = {}; 

			walk(tree,(node,parent)=>{

				if(node.type === 'VariableDeclaration'){

					if(/\_content/igm.test(node.declarations[0].id.name)){

						find(node,{type: 'ObjectExpression'}).forEach(e=>{
							e.properties.forEach((r)=>{
								if(r.value.type === 'Identifier'){
									
									stateIdentifier[r.value.name] = null;
									
								}
							});
						});

					}

				}

			});

		}

	});

}