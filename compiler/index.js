const {readFileSync,writeFileSync} = require("fs");
const cssBeautify = require('js-beautify').css;
const {basename} = require('path');
const esbuildSelekuPlugin = require('./seleku.esbuild.plugin.js');
const {analyzeMetafile} = require('esbuild');

const Bundle = async (customConfig = {}, additional = {})=>{

  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;

  if(customConfig.hasOwnProperty('plugins')){
    customConfig.plugins = [
      ...customConfig.plugins,
      esbuildSelekuPlugin(additional.cache,additional.target),
      htmlPlugin()
    ]
  }

  const config = {
    entryPoints: ['index.html'],
    assetNames: 'assets/[name]-[hash]',
    entryNames: '[name]',
    bundle: true,
    outdir: 'result',
    plugins: [esbuildSelekuPlugin(additional.cache,additional.target),htmlPlugin()],
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

  const result = await require('esbuild').build(config)
  .catch(() => process.exit(1));

  let text = await analyzeMetafile(result.metafile,{
    verbose: true,
  })
  console.log(text)
}

const BundleHTML = async (customConfig = {}, additional = {})=>{

  const beautify_html = require('js-beautify').html;
  const htmlPlugin = (await import('@chialab/esbuild-plugin-html')).default;

  if(customConfig.hasOwnProperty('plugins')){
    customConfig.plugins = [
      ...customConfig.plugins,
      esbuildSelekuPlugin(additional.cache,additional.target),
      htmlPlugin()
    ]
  }

  const config = {
    entryPoints: ['index.html'],
    assetNames: 'assets/[name]-[hash]',
    entryNames: '[name]',
    bundle: true,
    outdir: 'result',
    plugins: [esbuildSelekuPlugin(additional.cache,additional.target),htmlPlugin()],
    format: 'esm',
    splitting: false,
    write: false,
    loader: {
      '.css': 'css',
      '.png': 'file',
      '.svg': 'file',
      '.jpeg': 'file',
      '.jpg': 'file'
    }
  }

  Object.assign(config,{...customConfig,write: false});

  let result ='';
  const js = {};
  const splittedScript = {};

  await require('esbuild').build({
    ...config,
    splitting: true,
    chunkNames: 'chunks/[name]-seleku'
  })
  .then(e =>{
    Object.keys(e.metafile.outputs).forEach(e =>{
      if(/\.js$/igm.test(basename(e)) || /\.css$/igm.test(basename(e))){
        
        splittedScript[e.replace(new RegExp(`^${config.outdir}\\/`,'igm'),'')] = null;

      }
    });
  })
  .catch(() => process.exit(1));

  await require('esbuild').build(config)
  .then(e=>{
    e.outputFiles.forEach(e =>{
      if(/\.js$/igm.test(basename(e.path))){
        
        js[basename(e.path)] = e.text;

      }
      if(/\.html$/igm.test(basename(e.path))){
        
        result = e.text;
      
      }
    });
  })
  .catch(() => process.exit(1));

  const {JSDOM,VirtualConsole} = require("jsdom");
  const first = new JSDOM(
  result, 
  { 
    resources: "usable",
    runScripts: "dangerously",
    pretendToBeVisual: true 
  });
  
  first.window.document.body
  .querySelectorAll('script')
  .forEach(e =>{
    if(e.src in js){
      try{
        first.window.eval(js[e.src]);
      }catch(err){}
    }
    if(!/(https?:\/\/[^\s]+)/g.test(e.src)) e.remove();
  });
  first.window.document.body.innerHTML += `
    ${Object.keys(splittedScript).map(e =>{
      if(/\.js$/igm.test(e)){
        return `<script src="${e}" type="module"></script>`;
      }
    }).join('\n')}
  `;

  first.window.document.head
  .querySelectorAll('link[rel="stylesheet"]')
  .forEach(e =>{
    if(!/(https?:\/\/[^\s]+)/g.test(e.src)) e.remove();
  });
  first.window.document.head.innerHTML += `
    ${Object.keys(splittedScript).map(e =>{
      if(/\.css$/igm.test(e)){
        return `<link href="${e}" rel="stylesheet">`;
      }
    }).join('\n')}
  `;

  return beautify_html(first.window.document.documentElement.outerHTML.replace(/(\n|\r|\t|\s+)/igm,' '));

}


Bundle({
  entryPoints: ['index.html'],
  minify: false,
  metafile: true,
  outbase: 'src',
  splitting: false,
});

module.exports.Bundle = Bundle;