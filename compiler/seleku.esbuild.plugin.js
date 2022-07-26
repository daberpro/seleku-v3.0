let path = require('path');
const {readFileSync} = require('fs');
const {transform} = require('./compiler.js');
const {find,replace} = require('abstract-syntax-tree');
const bind = require('./utilities/bind.js');
const ref = require('./utilities/ref.js');
const dynamicAttr = require('./utilities/dynamic-attribute.js');

module.exports = {
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
      null,
      {
        /*
          this method create to access component when compile
        */
        getComponent(component,stateIdentifier){
          bind(component,stateIdentifier);
          ref(component,stateIdentifier);
          dynamicAttr(component);
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
      
      return {
        contents
      }
    })

    build.onEnd(()=>{
      console.log('compile time : ');
      console.timeEnd();
    })

  },
}