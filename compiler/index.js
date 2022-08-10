const {readFileSync,writeFileSync} = require("fs");
const cssBeautify = require('js-beautify').css;
const esbuildSelekuPlugin = require('./seleku.esbuild.plugin.js');

const Bundle = async (customConfig = {})=>{

  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;

  if(customConfig.hasOwnProperty('plugins')){
    customConfig.plugins = [
      ...customConfig.plugins,
      esbuildSelekuPlugin(),
      htmlPlugin()
    ]
  }

  const config = {
    entryPoints: ['index.html'],
    assetNames: 'assets/[name]-[hash]',
    entryNames: '[name]',
    bundle: true,
    outdir: 'result',
    plugins: [esbuildSelekuPlugin(),htmlPlugin()],
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
    minify: true
  }

  Object.assign(config,customConfig);

  require('esbuild').build(config)
  .catch(() => process.exit(1));
}

Bundle({
  entryPoints: ['index.html'],
  minify: false
});

module.exports.Bundle = Bundle;