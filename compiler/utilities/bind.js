const specialAttributeRegister = require('./specialAttributeRegister.js');
module.exports = (component)=>{

	component.forEach((e,i)=>{

		if(e.attr?.hasOwnProperty('bind')){

			e.component += `$$State.state.${e.componentName}.oninput = function(){
				${e.attr['bind']} = this.value;				
			}`;

		}

		specialAttributeRegister(e,'bind');

	});

}