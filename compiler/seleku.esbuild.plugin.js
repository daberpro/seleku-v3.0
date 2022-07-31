let path = require('path');
const {readFileSync} = require('fs');
const {
  transform,
  updateRegisterHTMLElement,
  bind,
  ref,
  dynamicAttr,
  condition,
  registerContentState,
  copase
} = require('./compiler-core.js');


module.exports = (Copase = {css: null,set: false})=> ({
  name: 'seleku',
  setup(build) {
    build.onResolve({ filter: /\.selek$/ }, args => {
      return { path: path.join(args.resolveDir, args.path) }
    });

    const options = build.initialOptions
    options.define = options.define || {}
    options.define['process.env.NODE_ENV'] =
      options.minify ? '"production"' : '"development"';

    options.banner = {
  	    js: `/**\n* Seleku Create and maintenance By Ari Susanto \n* check my github at \n* @link https://github.com/daberpro \n\n*/`,
  	}

    build.onStart(()=>{
      console.log('compiling...');
    });

    build.onLoad({ filter: /\.selek$/ }, (args) => {
      console.time();
      let source = readFileSync(args.path, 'utf8');
      const contents = transform(source,({
        node,
        from
      })=>{

        // some access to seleku component
        
      },
      null,
      {
        /*
          this method create to access component when compile
        */
        getComponent(component,stateIdentifier,StyleSheet){
          bind(component,stateIdentifier);
          ref(component,stateIdentifier);
          dynamicAttr(component,stateIdentifier);
          condition(component,stateIdentifier);
          registerContentState(component,stateIdentifier);
          if(Copase.set) copase(component,stateIdentifier,StyleSheet);
        },
        /*
          this method create to access AST from component tree
          and for parsing and manipulate AST i have been using 
          abstract-syntax-tree module
        */
        AST(tree){

        }
      });

      console.log(args.path);
      Copase.css = contents.CSS;
      return {
        contents: contents.JS
      }
    })

    build.onEnd(()=>{
      console.log('compiling success');
    })

  },
})