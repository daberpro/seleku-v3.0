const { parse } = require('parse5');
const beautify_html = require('js-beautify').html;
const CLIHiglight = require('cli-highlight').highlight
const clc = require('cli-color');

module.exports = (component)=>{

	for(let x of component){

		if(x.rawSyntax){
			const data = x.rawSyntax.match(/(\<.*?\>)/igm).filter(e => e.match(/\</igm).length >= 2);
			if(data.length > 0){
				console.log(`\n\n${clc.red('Fatal')} : ${clc.cyanBright('did you forget? >')}  \nError at :\n`);
				console.log(CLIHiglight(beautify_html(x.rawSyntax),{
					language: 'html'
				}).toString())
				throw new Error('Fatal Error');
			}
		}
		
		if(x.parseAttr){
			for(let y of x.parseAttr){
				for(let z in y){
					if(/(\<|\>|\@|\!|\@|\#|\$|\%|\^|\&|\*)/igm.test(y[z])){
						console.log(`\n\n${clc.red('Fatal')} : ${clc.cyanBright(`atribute cannot be " ${y[z]} "`)}\nError at : \n`)
						console.log(CLIHiglight(beautify_html(x.rawSyntax),{
							language: 'html'
						}).toString());
						throw new Error('Fatal Error');					
					}
				}
			}
		}	

	}

}