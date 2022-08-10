const {transform,updateRegisterHTMLElement} = require('./experimental-compiler');
const bind = require('./utilities/bind.js');
const ref = require('./utilities/ref.js');
/**
 * dynamic attribute has been deprecated
 * and will remove soon
 * */
// const dynamicAttr = require('./utilities/dynamic-attribute.js');
// const copase = require('./utilities/copase.js');

const condition = require('./utilities/condition.js');
const registerContentState = require('./utilities/registerContentState.js');
const HTMLError = require('./utilities/errorHandlingForHTML.js');

module.exports = {
	transform,
	updateRegisterHTMLElement,
	bind,
	ref,
	// dynamicAttr,
	// copase,
	condition,
	registerContentState,
	HTMLError
}