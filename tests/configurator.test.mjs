import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {baseline,validateProject,validateState,makePayload,importSelection,siteDocument,exportHTML,resolveTokens,escapeHTML} from '../core/engine.mjs';
import {readProject,build} from '../scripts/build.mjs';

function combinations(decisions,index=0,state={}) {
  if(index===decisions.length)return [state];
  return decisions[index].variants.flatMap(v=>combinations(decisions,index+1,{...state,[decisions[index].id]:v.id}));
}
for(const id of ['starter','workshop']) {
  test(`${id}: every combination renders independently and matches export`,async()=>{
    const project=await readProject(id), hashes=new Set();
    const render=vm.runInNewContext('('+project.render.toString()+')');
    for(const state of combinations(project.decisions)) {
      const tokens=resolveTokens(project,state);
      const rendered=render({state,tokens,content:project.content,assets:project.assets,escapeHTML});
      for(const s of project.sections)assert(rendered.includes(`id="${s.id}"`),s.id);
      hashes.add(createHash('sha256').update(rendered).digest('hex'));
      const payload=makePayload(project,state);
      assert.deepEqual(importSelection(project,JSON.stringify(payload)),state);
      assert.deepEqual(payload.tokens,tokens);
      const exported=exportHTML(project,state);
      assert(exported.includes('Desktop'));assert(exported.includes('Mobile'));
      assert(!exported.includes('id="decisions"'));
      assert(!exported.includes('id="export-dialog"'));
      new vm.Script(exported.match(/<script>([\s\S]*)<\/script>/)[1]);
      new vm.Script(siteDocument(project,state).match(/<script>([\s\S]*)<\/script>/)[1]);
    }
    assert.equal(hashes.size,combinations(project.decisions).length,'Every choice must change the rendered site');
  });
}
test('imports reject wrong project, revision, malformed and unknown values without modifying existing state',async()=>{
  const project=await readProject(),state=baseline(project),payload=makePayload(project,state),before={...state};
  for(const bad of ['{',JSON.stringify({...payload,project:{...payload.project,id:'other'}}),JSON.stringify({...payload,project:{...payload.project,revision:9}}),JSON.stringify({...payload,designState:{...state,palette:'bad'}}),JSON.stringify({...payload,designState:{palette:'blue'}})])assert.throws(()=>importSelection(project,bad));
  assert.deepEqual(state,before);
  assert.throws(()=>validateState(project,{...state,unexpected:'value'}));
  assert.throws(()=>validateProject({...project,decisions:[{...project.decisions[0],default:'missing'}]}));
  assert.throws(()=>validateProject({...project,decisions:[{...project.decisions[0],targets:['missing']}]}));
  assert.throws(()=>validateProject({...project,presets:[{id:'broken',label:'Broken',state:{palette:'missing'}}]}));
});
test('text cannot break standalone HTML script boundaries',async()=>{
  const project=await readProject();project.content.title='</script><script>alert("oops")</script>';
  const html=exportHTML(project,baseline(project));
  assert.equal((html.match(/<script>/g)||[]).length,1);
  assert.equal((html.match(/<\/script>/g)||[]).length,1);
  assert(siteDocument(project,baseline(project)).includes('&lt;/script&gt;'));
});
test('both portable builds include all assets and syntactically valid inline scripts',async()=>{
  const output=await mkdtemp(path.join(tmpdir(),'design-configurator-'));
  try{
    for(const id of ['starter','workshop']) {
      await build(id,output);
      const html=await readFile(path.join(output,'index.html'),'utf8');
      assert(!/C:\\|C:\//.test(html));
      assert(!/klava|telegram|esmeteam|esmesber500/i.test(html));
      assert(!/\b(?:src|href)="(?:https?:\/\/|assets\/)/.test(html));
      const script=html.match(/<script>([\s\S]*)<\/script>/)[1];new vm.Script(script);
      if(id==='starter')assert(html.includes('data:image/svg+xml;base64,'));
    }
  }finally{await rm(output,{recursive:true,force:true});}
});
