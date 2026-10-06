import http from 'node:http';
import {watch} from 'node:fs';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {build,option,root} from './build.mjs';
const project=option('project','starter'),port=Number(option('port','4180'));
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid port');
const output=path.join(root,'.dev',project+'-'+port);
await build(project,output);
let pending=false,running=false;
async function rebuild(){
  if(running){pending=true;return;}running=true;
  try{await build(project,output);console.log('Rebuilt — refresh your browser');}catch(error){console.error(error.message);}
  finally{running=false;if(pending){pending=false;await rebuild();}}
}
let timer;
const watchers=['core',path.join('projects',project)].map(dir=>watch(path.join(root,dir),{recursive:true},()=>{clearTimeout(timer);timer=setTimeout(rebuild,150);}));
const routes=new Map([['/','index.html'],['/index.html','index.html'],['/site.html','site.html'],['/selection.json','selection.json']]);
const server=http.createServer(async(req,res)=>{
  const file=routes.get(new URL(req.url,'http://localhost').pathname);
  if(!file){res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');return;}
  try{const data=await readFile(path.join(output,file));res.writeHead(200,{'Content-Type':file.endsWith('.json')?'application/json':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(503);res.end('Build unavailable');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Design Configurator · ${project} · http://127.0.0.1:${port}`));
process.on('SIGINT',()=>{watchers.forEach(w=>w.close());clearTimeout(timer);server.close();});
