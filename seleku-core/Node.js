import { CreateCustomState } from './CustomState'
export class Node{

	static Render(Component,target){

		if(Component instanceof HTMLElement){

			if(Component instanceof HTMLElement){

				target.appendChild(Component);

			}

			if(Component instanceof Array){

				for(let x of Component){

					if(x instanceof HTMLElement) target.appendChild(x);

				}

			}

			return Component;

		}else{

			if(Component.element instanceof HTMLElement){

				target.appendChild(Component.element);

			}

			if(Component.element instanceof Array){

				for(let x of Component.element){

					if(x instanceof HTMLElement) target.appendChild(x);

				}

			}

			return Component;
		}

	}

	static RenderBefore(Component,target){

		if(Component instanceof HTMLElement){

			if(Component instanceof HTMLElement){

				target.insertBefore(Component,target.firstChild);

			}

			if(Component instanceof Array){

				for(let x of Component){

					if(x instanceof HTMLElement) target.insertBefore(x,target.firstChild);

				}

			}

			return Component;

		}else{

			if(Component.element instanceof HTMLElement){

				target.insertBefore(Component.element,target.firstChild);

			}

			if(Component.element instanceof Array){

				for(let x of Component.element){

					if(x instanceof HTMLElement) target.insertBefore(x,target.firstChild);

				}

			}

			return Component;
		}


	}

	constructor(name,content,attribute){
	}

	createElement(name){

		const Component = document.createElement(name);
		return Component;
	}

	createAttribute(Component,attribute){

		if(Component instanceof HTMLElement && !(attribute instanceof Object && !(attribute instanceof Array))){

			// #Error
			return 0;

		}

		let template = '';

		for(let x in attribute){

			const attr = attribute[x];

			if(typeof attr['real'] === 'function'){
				Component[x] = attr['real'];

			}else{
				Component.setAttribute(x,attr['real']);
				template += `Component.setAttribute('${x}',${attr['raw']});`;
			}

		}

		return {
			update(data){
				const _RealAttrContext = new Function('$attribute','Component',`
					const {
						${Object.keys(data)}
					} = $attribute;

					${template}

				`);
				_RealAttrContext(data,Component);
			}
		};
	}

	createContent(Component,content,prop = {},uid = void 0){

		const context = new Text(content);
		const main = this;
		const child = new Map();
		Component.appendChild(context);
		const _RealContext = new Function("props","parent",`
					const {${Object.keys(prop).join(",")}} = props; 
					const result = \`${content}\`

					return result;
					`);
		context.replaceData(0,context.data.length,_RealContext(prop,Component));

		return {
			content,
			linked: prop,
			child,
			update(_content = content,props = {uid: main.uid}){

				this.linked = props;
				const _RealContext = new Function("props","parent",`
					const {${Object.keys({...prop,...props}).join(",")}} = props; 
					const result = \`${_content}\`

					return result;
					`);
				context.replaceData(0,context.data.length,_RealContext({...prop,...props},Component));

			},
			uid
		}
	}

	static registerContext(content,Observer){
		
		for(let x in content.linked){

			if(x !== "uid" && x !== "condition" && x !== "loop" && x !== "async") Observer.subscribe(x,(object)=>{
				
				content.update(content.content,{...content.linked,...object});

			})

		}

	}

	static destroy(Component){

		Component.remove();
	}

}

