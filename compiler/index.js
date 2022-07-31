const {transform: tf} = require("./compiler.js");
const {readFileSync,writeFileSync} = require("fs");
const cssBeautify = require('js-beautify').css;
const esbuildSelekuPlugin = require('./seleku.esbuild.plugin.js');

const Bundle = async (customConfig = {},additional= {})=>{

  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;
  const copase = {
    css: '',
    set: additional.copase || false
  }

  if(customConfig.hasOwnProperty('plugins')){
    customConfig.plugins = [
      ...customConfig.plugins,
      esbuildSelekuPlugin(copase),
      htmlPlugin()
    ]
  }

  const config = {
    entryPoints: ['index.html'],
    assetNames: 'assets/[name]-[hash]',
    entryNames: '[name]',
    bundle: true,
    outdir: 'result',
    plugins: [esbuildSelekuPlugin(copase),htmlPlugin()],
    format: 'esm',
    splitting: true,
    chunkNames: 'chunks/[name]-seleku',
    loader: {
      '.css': 'css',
      '.png': 'file',
      '.svg': 'file',
      '.jpeg': 'file',
      '.jpg': 'file'
    },
    minify: true,
    write: true,
  }

  Object.assign(config,customConfig);

  require('esbuild').build(config)
  .then((e)=>{
    writeFileSync(config.outdir+'/style.css',cssBeautify(copase.css.replace(/(\n|\t|\r|\s+)/igm,''),{indent_size: 2}));
  })
  .catch(() => process.exit(1));
}

module.exports.Bundle = Bundle;