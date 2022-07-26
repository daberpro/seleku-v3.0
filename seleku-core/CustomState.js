
export class CreateCustomState{

	#object = null;
	state = null;

	constructor(object,handler){

		// objek yang akan di ubah
		// menjadi state objek
		this.#object = object;
		this.state = new Proxy(this.#object,handler);

	}

}



