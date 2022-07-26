
export const ArrayWatcher = function (array, event) {

    const cache = new Map();
    let once = [];
    let evaluationValue = null;
    let unshiftValue = [];

    return new Proxy(array, {

        get(target, property, receiver) {

            if (event instanceof Object && event.hasOwnProperty("watch") &&
                (property !== "length") && isNaN(parseFloat(property))) {

                cache.set("property", property);
                once[0] = "";

            }else{

                if(property !== "length") event.watch(property,"get");

            }

            return target[property];

        },
        set(target, property, value, receiver) {

            target[property] = value;

             if (once[0] !== cache.get("property") && cache.get("property") !== 'unshift') {
                once[0] = cache.get("property");
                event.watch(cache.get("property"), "set", target, property);
              }else if(cache.get('property') === 'unshift'){
                evaluationValue = value;
              }

              if(evaluationValue !== target.length){
                unshiftValue.unshift(evaluationValue);
              }else{
                event.watch(cache.get("property"), "set", unshiftValue, 0);
              };

            return true;

        }
    });
}
