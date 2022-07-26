const specialAttributeRegister = require('./specialAttributeRegister.js');
module.exports = (component,stateIdentifier)=>{

	component.forEach((e,i)=>{

		if(e.attr?.hasOwnProperty('ref')){

			e.component += `${e.attr['ref']} = ${e.componentName}`;
			stateIdentifier[e.attr['ref']] = null;

		}

		specialAttributeRegister(e,'ref');

	});

}