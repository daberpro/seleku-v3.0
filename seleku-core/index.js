import { Node } from './Node'
import { Observer } from './Observer'
import { CreateState } from './State'
import { CreateCustomState } from './CustomState'
import { ArrayWatcher } from './ArrayWatcher'

const Seleku = new Node();

Array.prototype.update = function(index,value){
    this[index] = value;
    return index;
}

Array.prototype.remove = function(index,value){
    this[index] = value;
    return index;
}


const Watcher = (callback,watchState,_Observer) =>{
    
    for(let state of watchState){
        _Observer.subscribe(state,callback);
    }

}

const Context = (data) =>{

    const _Observer = new Observer();
    return [
        (callName,handler)=>{
            _Observer.subscribe(callName,handler);
        },
        (callName,value)=>{
            _Observer.emit(callName,value);
        }
    ];

}

export {
    Watcher, 
    ArrayWatcher, 
    Observer, 
    CreateCustomState, 
    CreateState,
    Node,
    Seleku,
    Context
};