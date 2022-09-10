

export const Render = (rawComponent, target, props) =>{

	const component = Node.Render(
		rawComponent(props),
		target
	);

	return {
		destroy(){
			Node.destroy(component);
		}
	}

}



export class SPA {

	#router = new Map();
	#root = null;
	#previousComponent = null;

	registerRoute(path, component){
		// add new route and component
		// to router
		this.#router.set(path,component);
	}

	checkPath(path){
		// checking for path target 
		// and match with client path
		if(location.pathname === path){
			return true;
		}

		return false;
	}

	render(props){

		// check for url path
		if(this.#router.find(([data,component])=>{
			return checkPath(data);
		})){

			// if in previous component has render
			// destroy it
			if(this.#previousComponent){
				this.#previousComponent.destroy();
			}

			// render component
			// when path target is matched and
			// path is exits
			this.#previousComponent = Render(
				this.#router.get(location.pathname),
				this.#root,
				props
			);

		}

	}

	navigateTo(url,props = {}){
		history.replaceState(props,null,url);
		this.render();
	}

	constructor(root){
		this.#root = root;

		addEventListener("DOMContentLoaded",()=>{
            document.body.onclick = (e)=>{
                if(e.target.matches("[data-link]")){
                    e.preventDefault();
                    this.navigateTo(e.target.href);
                }
            }
        });

		onpopstate = (data) =>{
			this.render(data.state);
		}
	}

}

