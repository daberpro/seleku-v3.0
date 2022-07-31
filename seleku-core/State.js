export class CreateState{

	object = null;
	state = null;

	constructor(object){

		// objek yang akan di ubah
		// menjadi state objek
		this.object = object;
		this.state = new Proxy(this.object,this.#handler());

	}

	#handler(){

		const main = this;
		const _handler = {
			set(object,prop,value){

				object[prop] = value;

				if(prop in object){

					// jalankan ini jika 
					// attribute yang di update ada
					main.update(prop);

					return (object[prop] ? object[prop] : true);
				}	

				// kembalikan sesuatu jika tidak ada
				// #Error
				return true;
			},
			get(target,prop,receiver){

				if(prop in target){

					return target[prop];
				
				}	

				// kembalikan sesuatu jika tidak ada
				// #Error
				return false;
			}
		}

		return _handler;

	}

	update(){

	}

}



