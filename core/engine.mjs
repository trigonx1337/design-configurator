// Shared between Node tests/build and the standalone browser bundle
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function scriptJSON(value) { return JSON.stringify(value).replace(/</g, '\\u003c'); }
export function validateProject(project) {
  const require = (ok, message) => { if (!ok) throw new Error(message); };
  const idOK = value => typeof value === 'string' && /^[a-z][a-z0-9-]*$/.test(value);
  const unique = rows => new Set(rows.map(row => row.id)).size === rows.length;
  require(idOK(project.id) && project.name && Number.isInteger(project.revision) && project.revision > 0, 'Project needs id, name and positive revision');
  require(typeof project.render === 'function', 'Project needs render(context)');
  require(Array.isArray(project.sections) && project.sections.length && unique(project.sections), 'Sections must have unique ids');
  require(project.sections.every(s => idOK(s.id) && s.label), 'Invalid section');
  require(Array.isArray(project.decisions) && project.decisions.length && unique(project.decisions), 'Decisions must have unique ids');
  for (const d of project.decisions) {
    require(idOK(d.id) && d.label && d.group, 'Invalid decision');
    require(Array.isArray(d.variants) && d.variants.length >= 2 && unique(d.variants), `Invalid variants: ${d.id}`);
    require(d.variants.every(v => idOK(v.id) && v.label), `Invalid variant: ${d.id}`);
    require(d.variants.some(v => v.id === d.default), `Invalid default: ${d.id}`);
    require(Array.isArray(d.targets) && d.targets.length && d.targets.every(id => project.sections.some(s => s.id === id)), `Invalid targets: ${d.id}`);
  }
  require(Array.isArray(project.presets) && unique(project.presets), 'Invalid presets');
  for (const preset of project.presets) {
    require(idOK(preset.id) && preset.label, 'Invalid preset');
    validateState(project, preset.state, true);
  }
  for (const width of Object.values(project.viewports || {})) require(Number.isInteger(width) && width >= 240 && width <= 2560, 'Invalid viewport');
  return project;
}
export function baseline(project) { return Object.fromEntries(project.decisions.map(d => [d.id, d.default])); }
export function validateState(project, state, partial = false) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Ожидается объект выбора');
  for (const [id, value] of Object.entries(state)) {
    const decision = project.decisions.find(d => d.id === id);
    if (!decision || !decision.variants.some(v => v.id === value)) throw new Error(`Неизвестное решение или вариант: ${id}`);
  }
  if (!partial && project.decisions.some(d => !Object.hasOwn(state, d.id))) throw new Error('В JSON не хватает решений');
  return {...baseline(project), ...state};
}
export function resolveTokens(project, state) {
  return Object.assign({}, project.tokens || {}, ...project.decisions.map(d => d.variants.find(v => v.id === state[d.id]).tokens || {}));
}
export function makePayload(project, state) {
  const selected = validateState(project, state);
  return {schemaVersion:1, project:{id:project.id, name:project.name, revision:project.revision}, designState:selected,
    tokens:resolveTokens(project, selected), content:project.content, sections:project.sections,
    decisions:project.decisions.map(d => { const v=d.variants.find(v=>v.id===selected[d.id]); return {id:d.id,label:d.label,variant:v.id,choice:v.label,description:v.description || '',targets:d.targets}; }),
    notes:project.notes || []};
}
export function importSelection(project, text) {
  if (text.length > 1_000_000) throw new Error('Файл выбора слишком большой');
  const data = JSON.parse(text);
  if (data.schemaVersion !== 1 || data.project?.id !== project.id) throw new Error('JSON относится к другому проекту или формату');
  if (data.project.revision !== project.revision) throw new Error('Версия проекта изменилась — выбор нужно перенести вручную');
  return validateState(project, data.designState);
}
export function brief(project, state) {
  const data=makePayload(project,state);
  return `${data.project.name} / редакция ${data.project.revision}\n\nВЫБОР\n${data.decisions.map(d=>`${d.label}: ${d.choice}\n${d.description}`).join('\n\n')}\n\nТОКЕНЫ\n${JSON.stringify(data.tokens,null,2)}\n\nКОНТЕНТ\n${JSON.stringify(data.content,null,2)}\n\nПРИМЕЧАНИЯ\n${data.notes.join('\n')}`;
}
export function previewBridge() {
  const send = () => parent.postMessage({studio:true,height:document.documentElement.scrollHeight}, '*');
  let queued=false;
  new ResizeObserver(()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;send();});}}).observe(document.body);
  window.addEventListener('message',event=>{
    if(event.source!==parent || !event.data?.studioControl)return;
    const target = document.getElementById(event.data.target);
    if(target)target.scrollIntoView({behavior:'instant',block:'start'});
  });
  window.addEventListener('load',send); send();
}
export function siteDocument(project, state) {
  const tokens=resolveTokens(project,state);
  const context={state,tokens,content:project.content,assets:project.assets || {},escapeHTML};
  const html=project.render(context);
  const runtime = project.runtime ? `(${project.runtime.toString()})(${scriptJSON({state,tokens})});` : '';
  return `<!doctype html><html lang="${escapeHTML(project.lang || 'ru')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(project.name)}</title><style>${project.css.replace(/<\/style/gi,'<\\/style')}</style></head><body>${html}<script>${runtime}(${previewBridge.toString()})();<\/script></body></html>`;
}
export function exportHTML(project, state) {
  const doc=siteDocument(project,state);
  const sizes={desktop:project.viewports?.desktop || 1280,mobile:project.viewports?.mobile || 390};
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(project.name)} — выбранный дизайн</title><style>html,body{margin:0;height:100%;font:13px system-ui;background:#eee;color:#171717}header{height:40px;display:flex;justify-content:center;gap:6px;align-items:center;background:#fff}button{font:inherit;border:0;border-radius:7px;padding:6px 14px;cursor:pointer}button[aria-pressed=true]{background:#171717;color:white}button:focus-visible{outline:2px solid #2763bc}main{height:calc(100dvh - 40px);overflow:auto}#sizer{position:relative;margin:auto}iframe{position:absolute;border:0;transform-origin:top left}</style></head><body><header aria-label="Размер сайта"><button data-device="desktop" aria-pressed="true">Desktop</button><button data-device="mobile" aria-pressed="false">Mobile</button></header><main><div id="sizer"><iframe title="Сайт" sandbox="allow-scripts allow-popups"></iframe></div></main><script>const doc=${scriptJSON(doc)},sizes=${scriptJSON(sizes)};const frame=document.querySelector('iframe'),main=document.querySelector('main'),sizer=document.querySelector('#sizer');let device='desktop';function fit(){const width=sizes[device],scale=Math.min(1,main.clientWidth/width),height=main.clientHeight/scale;Object.assign(frame.style,{width:width+'px',height:height+'px',transform:'scale('+scale+')'});Object.assign(sizer.style,{width:width*scale+'px',height:height*scale+'px'});document.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.device===device)));}frame.srcdoc=doc;document.querySelectorAll('button').forEach(b=>b.onclick=()=>{device=b.dataset.device;fit();});new ResizeObserver(fit).observe(main);fit();<\/script></body></html>`;
}
