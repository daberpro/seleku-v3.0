let path = require('path');
const {readFileSync} = require('fs');
const {
  transform,
  updateRegisterHTMLElement,
  bind,
  ref,
  condition,
  registerContentState,
  copase,
  HTMLError
} = require('./compiler-core.js');


module.exports = ()=> ({
  
  name: 'seleku',
  setup(build) {

    // adding resolver to resolve seleku file path
    build.onResolve({ filter: /\.selek$/ }, args => {
      return { path: path.join(args.resolveDir, args.path) }
    });

    // custom options for build
    const options = build.initialOptions
    options.define = options.define || {}
    options.define['process.env.NODE_ENV'] =
      options.minify ? '"production"' : '"development"';

    // adding banner to seleku
    // this is by deafult
    options.banner = {
  	    js: `/**\n* Seleku Create and maintenance By Ari Susanto \n* check my github at \n* @link https://github.com/daberpro \n\n*/`,
  	}

    build.onLoad({ filter: /\.selek$/ }, (args) => {
      console.log('compiling : '+args.path);
      let source = readFileSync(args.path, 'utf8');
      
      let contents = transform(source,({
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
        getComponent(component,stateIdentifier /*,StyleSheet*/ ){
          HTMLError(component);
          bind(component,stateIdentifier);
          ref(component,stateIdentifier);
          condition(component,stateIdentifier);
          registerContentState(component,stateIdentifier);
          // if(Copase.set) copase(component,stateIdentifier,StyleSheet);
        },
        /*
          this method create to access AST from component tree
          and for parsing and manipulate AST i have been using 
          abstract-syntax-tree module
        */
        AST(tree){

        }
    });

      return {
        contents: contents.JS
      }
    })

  },
})