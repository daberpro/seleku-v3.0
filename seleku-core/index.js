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

const registerLoopTarget = (state,target,array,loopSpace,_Observer)=>{
    _Observer.subscribe('_SELEKU_LOOP_SPACE_'+array,(newArray)=>{
        state[array] = ArrayWatcher(newArray, {
          "watch": function(_target, from, object, property) {
            if(from === 'get'){
                if(object[_target] instanceof Object && !(object[_target] instanceof Array)){
                  object[_target] = reactiveObject(object[_target],{
                    set(object,target,value){
                      object[target] = value;
                      state[array].update(_target,value);
                    }
                  });
                }
              }
            if (from === "set") {
              _Observer.emit(`${target}_` + _target, {
                "data": object,
                "index": property,
                "target": _target
              });
            }
            return 1;
          }
        });
    })

    loopSpace[array] = (newArray)=>{
        _Observer.emit('_SELEKU_LOOP_SPACE_'+array,newArray);
    }
}

const reactiveObject = (object, handler) => {
if(object instanceof Array){
    return ArrayWatcher(object, {
        "watch": function(target, from, object, property) {
          if (from === "get") {
            if (object[_target] instanceof Object && !(object[_target] instanceof Array)) {
              object[_target] = reactiveObject(object[_target], {
                set(object2, target2, value) {
                  object2[target2] = value;
                  state[array].update(_target, value);
                }
              });
            }
          }
          if (from === "set") {
            handler.set();
          }
          return 1;
        }
      });
    }else if(object instanceof Object){
      return new Proxy(object, {
        set: handler.set,
        get(object2, target) {
          if (target in object2 && object2[target] instanceof Object) {
            return reactiveObject(object2[target], this);
          }
          return object2[target];
        }
      });
    }
};


export {
    Watcher, 
    ArrayWatcher, 
    Observer, 
    CreateCustomState, 
    CreateState,
    Node,
    Seleku,
    Context,
    registerLoopTarget,
    reactiveObject
};