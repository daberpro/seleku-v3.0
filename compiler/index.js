const {transform,updateRegisterHTMLElement} = require('./compiler');
const bind = require('./utilities/bind.js');
const ref = require('./utilities/ref.js');
const dynamicAttr = require('./utilities/dynamic-attribute.js');
const condition = require('./utilities/condition.js');
const registerContentState = require('./utilities/registerContentState.js');

module.exports = {
	transform,
	updateRegisterHTMLElement,
	bind,
	ref,
	dynamicAttr,
	condition,
	registerContentState
}