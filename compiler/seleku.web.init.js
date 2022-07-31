const {transform} = require('./seleku.web.js');

let path = require('path');
const {
  updateRegisterHTMLElement,
  bind,
  ref,
  dynamicAttr,
  condition,
  registerContentState
} = require('./index.js');

const compile = (source)=> transform(source,
()=>{},
null,
{
	getComponent(component,stateIdentifier){
      bind(component,stateIdentifier);
      ref(component,stateIdentifier);
      dynamicAttr(component,stateIdentifier);
      condition(component,stateIdentifier);
      registerContentState(component,stateIdentifier);
    },
	AST(){}
});
