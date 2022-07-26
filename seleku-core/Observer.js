/* eslint-disable prettier/prettier */
/**
 * this script create by daberdev
 * for manage all observer function in one
 * single function
 * @author daberdev
 */

export class Observer {
  handlers = {};
  /**
   * target is the handler name you want
   * fn is a handler function will call when target called
   * @param {String} target
   * @param {Function} fn
   */
  subscribe(target, fn) {
    const main = this.handlers[target];

    if (this.handlers.hasOwnProperty(target)) {
      this.handlers[target] = function (args) {
        main.call(this, args);
        fn.call(this, args);
      };
    } else {
      this.handlers[target] = fn;
    }
  }

  /**
   * delete handler which has the same name as you want
   * @param {String} target
   */
  unsubscribe(target) {
    if (target in this.handlers) {
      delete this.handlers[target];
    }
  }

  /**
   * called handler
   * @param {String} target
   * @param {any} args
   * @returns {any}
   */
  emit(target, args) {
    if(this.handlers[target]) return this.handlers[target](args);
  }
}
