const {parse, walk, find, generate} = require('abstract-syntax-tree');
module.exports = (e,attribute)=>{
	if(e.cAttr){

		let tree = parse(e.component);

		walk(tree,(node,parent)=>{

			if(node.type === 'VariableDeclaration'){

				if(/\_attribute/igm.test(node.declarations[0].id.name)){

					find(node,{type: 'ObjectExpression'}).forEach((e)=>{
						e.properties.forEach((r,i)=>{
							if(r.key.value === attribute){
								e.properties.splice(i,1);
							}
						});
					});

				}

			}

		});

		e.component = generate(tree);

	}
}