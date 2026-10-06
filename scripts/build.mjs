import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateProject,baseline,scriptJSON,exportHTML,makePayload} from '../core/engine.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function option(name,fallback){const i=process.argv.indexOf('--'+name);return i<0?fallback:process.argv[i+1];}
export async function readProject(id='starter') {
  if(!/^[a-z][a-z0-9-]*$/.test(id))throw new Error('Use a project folder id such as starter');
  const folder=path.join(root,'projects',id);
  const {default:project}=await import(pathToFileURL(path.join(folder,'project.mjs')).href+'?build='+Date.now());
  validateProject(project);
  const contained=async relative=>{
    const file=await realpath(path.resolve(folder,relative));const base=await realpath(folder);
    if(!file.startsWith(base+path.sep))throw new Error('Project resources must stay in the project folder');
    return file;
  };
  const types={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.woff2':'font/woff2','.ttf':'font/ttf'};
  const assets={};
  for(const [key,relative]of Object.entries(project.assets || {})){
    const file=await contained(relative),mime=types[path.extname(file).toLowerCase()];
    if(!mime)throw new Error('Unsupported asset type: '+relative);
    assets[key]='data:'+mime+';base64,'+(await readFile(file)).toString('base64');
  }
  const css=(await readFile(await contained(project.styles),'utf8')).replace(/url\(asset:([a-zA-Z0-9_-]+)\)/g,(_,key)=>{
    if(!assets[key])throw new Error('Missing CSS asset: '+key);return `url("${assets[key]}")`;
  });
  return {...project,css,assets};
}
export async function build(id='starter',output=path.join(root,'dist')) {
  const project=await readProject(id);
  const read=relative=>readFile(path.join(root,relative),'utf8');
  const [engine,studio,css,shell]=await Promise.all([read('core/engine.mjs'),read('core/studio.js'),read('core/studio.css'),read('core/studio.html')]);
  // Adapters use standalone function expressions; no closure or package imports are bundled
  const data={...project};delete data.render;delete data.runtime;delete data.preview;
  const functions=['render','runtime','preview'].filter(key=>typeof project[key]==='function').map(key=>`PROJECT.${key}=(${project[key].toString()});`).join('\n');
  const script=`${engine.replace(/^export /gm,'')}\nconst PROJECT=${scriptJSON(data)};${functions}\n${studio}`;
  const html=shell.replace('<!-- STYLE -->',()=>'<style>'+css+'</style>').replace('<!-- SCRIPT -->',()=>'<script>'+script.replace(/<\/script/gi,'<\\/script')+'</script>');
  await mkdir(output,{recursive:true});
  await Promise.all([
    writeFile(path.join(output,'index.html'),html),
    writeFile(path.join(output,'site.html'),exportHTML(project,baseline(project))),
    writeFile(path.join(output,'selection.json'),JSON.stringify(makePayload(project,baseline(project)),null,2)),
  ]);
  return {project:project.id,output,bytes:Buffer.byteLength(html)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  console.log(await build(option('project','starter')));
}
