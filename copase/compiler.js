const crypto = require('crypto');

function uuidv4() {
	return ([1e7] + 1e3).replace(/[018]/g, c =>
		(c ^ crypto.randomUUID(new Uint8Array(1))[0] & 15 >> c / 4).toString("36")
	);
}

// add this
// const classRegister = {};
// classRegister['mediaQuery'] = {
// 	'sm': {},
// 	'md': {},
// 	'lg': {}
// };
const transpile = (source, classRegister) =>{

	const data = source.split(' ') || [source];
	let result = '';

	let className = 'seleku_'+uuidv4();
	data.forEach((e,i)=>{

		if(/(^sm\:|^md\:|^lg\:)/igm.test(e)){
			
			const type = (e.match(/(^sm\:|^md\:|^lg\:)/igm) || [''])[0].replace(/(\:)/igm,'');
			if(!(className in classRegister['mediaQuery'][type])) classRegister['mediaQuery'][type] = {
				...classRegister['mediaQuery'][type],
				[className]: {
					[`${
						e.replace(/\[.*?\]/igm,'')
						.replace(/\-$/igm,'')
						.replace(/^sm\:/igm,'')
						.replace(/^md\:/igm,'')
						.replace(/^lg\:/igm,'')
					} : ${
						(e.match(/\[.*?\]/igm) || [''])[0]
						.replace(/(\[|\])/igm,'')
					};`] : null
				}
			}
			else classRegister['mediaQuery'][type][className] = {
				...classRegister['mediaQuery'][type][className],
				[`${
					e.replace(/\[.*?\]/igm,'')
					.replace(/\-$/igm,'')
					.replace(/^sm\:/igm,'')
					.replace(/^md\:/igm,'')
					.replace(/^lg\:/igm,'')
				} : ${
					(e.match(/\[.*?\]/igm) || [''])[0]
					.replace(/(\[|\])/igm,'')
				};`] : null
			}

			return;
		}

		if(!(source in classRegister)){
			if(!(/(^\w.*?\:)/igm.test(e) && !/(^sm\:|^md\:|^lg\:)/igm.test(e))) classRegister[source] = {
				className,
				psuedo: {},
				property: {
					[`${
						e.replace(/\[.*?\]/igm,'')
						.replace(/\-$/igm,'')
						.replace(/^sm\:/igm,'')
						.replace(/^md\:/igm,'')
						.replace(/^lg\:/igm,'')
					} : ${
						(e.match(/\[.*?\]/igm) || [''])[0]
						.replace(/(\[|\])/igm,'')
					};`] : null
				},
			}
			else classRegister[source] = {
				className,
				psuedo: {},
				property: {},
			}

			if( /(^\w.*?\:)/igm.test(e) && !/(^sm\:|^md\:|^lg\:)/igm.test(e)) {
				
				const type = (e.match(/(^\w.*?\:)/igm) || [''])[0].replace(/(\:)/igm,'');
				if(!(type in classRegister[source]['psuedo'])) classRegister[source]['psuedo'] = {
					[type]: {
						[`${
							e.replace(/\[.*?\]/igm,'')
							.replace(/\-$/igm,'')
							.replace(/^sm\:/igm,'')
							.replace(/^md\:/igm,'')
							.replace(/^lg\:/igm,'')
							.replace(/^\w.*?\:/igm,'')
						} : ${
							(e.match(/\[.*?\]/igm) || [''])[0]
							.replace(/(\[|\])/igm,'')
						};`] : null			
					}
				}
			}

		}else{
			if(!(/(^\w.*?\:)/igm.test(e) && !/(^sm\:|^md\:|^lg\:)/igm.test(e))) classRegister[source].property[`${
				e.replace(/\[.*?\]/igm,'')
				.replace(/\-$/igm,'')
				.replace(/^sm\:/igm,'')
				.replace(/^md\:/igm,'')
				.replace(/^lg\:/igm,'')
			} : ${
				(e.match(/\[.*?\]/igm) || [''])[0]
				.replace(/(\[|\])/igm,'')
			};`] = null;

			if( /(^\w.*?\:)/igm.test(e) && !/(^sm\:|^md\:|^lg\:)/igm.test(e)) {
				
				const type = (e.match(/(^\w.*?\:)/igm) || [''])[0].replace(/(\:)/igm,'');

				if(!(type in classRegister[source]['psuedo'])) classRegister[source]['psuedo'][type] = {
					...classRegister[source]['psuedo'][type],
					[`${
						e.replace(/\[.*?\]/igm,'')
						.replace(/\-$/igm,'')
						.replace(/^sm\:/igm,'')
						.replace(/^md\:/igm,'')
						.replace(/^lg\:/igm,'')
						.replace(/^\w.*?\:/igm,'')
					} : ${
						(e.match(/\[.*?\]/igm) || [''])[0]
						.replace(/(\[|\])/igm,'')
					};`] : null			
				}
			}

			if( /(^\w.*?\:)/igm.test(e) && !/(^sm\:|^md\:|^lg\:)/igm.test(e)) {
				
				const type = (e.match(/(^\w.*?\:)/igm) || [''])[0].replace(/(\:)/igm,'');

				if((type in classRegister[source]['psuedo'])) classRegister[source]['psuedo'][type] = {
					...classRegister[source]['psuedo'][type],
					[`${
						e.replace(/\[.*?\]/igm,'')
						.replace(/\-$/igm,'')
						.replace(/^sm\:/igm,'')
						.replace(/^md\:/igm,'')
						.replace(/^lg\:/igm,'')
						.replace(/^\w.*?\:/igm,'')
					} : ${
						(e.match(/\[.*?\]/igm) || [''])[0]
						.replace(/(\[|\])/igm,'')
					};`] : null
				}
			}
			
		}
	});

	let resultFinal = ['',''];
	for(let y in classRegister[source]){
		
		if(y === 'property'){
			resultFinal[0] += Object.keys(classRegister[source][y]).join('\n');
		}

		if(y === 'psuedo'){
			let psuedo = '';
			for(let z of Object.keys(classRegister[source][y])){
				psuedo += `.${classRegister[source].className}:${z}{
					${Object.keys(classRegister[source][y][z]).join('\n')}
				}`;
			}

			resultFinal[1] = psuedo;
		}

	}

	classRegister[source].component = `
		.${classRegister[source].className}{
			${resultFinal[0]}
		}

		${resultFinal[1]}

	`;

	return {className};

}

module.exports = { transpile };