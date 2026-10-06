(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const storageKey=`design-configurator:${PROJECT.id}:${PROJECT.revision}`;
  let state=baseline(PROJECT),compare='after',device='desktop',theme='light',zoomMode='fit',zoom=1,siteHeight=1800,format='brief',pendingTarget=null;
  const frame=$('#preview'),well=$('#frame-well');
  const status=text=>{$('#context-text').textContent=text;$('#mobile-status').textContent=innerWidth<=720?text:'';};
  function persist() {
    try { localStorage.setItem(storageKey,JSON.stringify({state,theme,pickerWidth:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--picker-width'))})); }
    catch { status('Локальное сохранение недоступно — используйте экспорт JSON'); }
  }
  function setWidth(value) {
    const max=Math.max(280,Math.min(800,innerWidth-430));
    const width=Math.max(280,Math.min(max,value));
    document.documentElement.style.setProperty('--picker-width',width+'px');
    $('#splitter').setAttribute('aria-valuenow',width); $('#splitter').setAttribute('aria-valuemax',max);
  }
  function applyTheme() { document.body.dataset.theme=theme;$('#tool-theme').textContent=theme==='light'?'Тёмная':'Светлая'; }
  function fit() {
    const width=PROJECT.viewports?.[device] || (device==='desktop'?1280:390);
    const available=Math.max(100,well.clientWidth);
    let scale=zoomMode==='fit'?Math.min(1,available/width):zoomMode==='page'?Math.min(available/width,well.clientHeight/siteHeight):zoom;
    scale=Math.max(.03,scale);
    const height=zoomMode==='page'?siteHeight:Math.max(450,well.clientHeight/scale);
    Object.assign(frame.style,{width:width+'px',height:height+'px',transform:`scale(${scale})`});
    Object.assign($('#frame-sizer').style,{width:width*scale+'px',height:height*scale+'px'});
    $('#zoom-value').textContent=Math.round(scale*100)+'%';$('#zoom').value=Math.round(scale*100);
    $('#preview-label').textContent=width+' px';
  }
  function selectedState() { return compare==='before'?baseline(PROJECT):state; }
  function preview(target) {
    pendingTarget=target || null;
    frame.srcdoc=siteDocument(PROJECT,selectedState());
    $$('[data-compare]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.compare===compare)));
  }
  function jump(target) { frame.contentWindow.postMessage({studioControl:true,target},'*'); }
  frame.addEventListener('load',()=>{fit();if(pendingTarget)jump(pendingTarget);pendingTarget=null;});
  function miniature(decision,variant) {
    const choice={...state,[decision.id]:variant.id};
    return PROJECT.preview?PROJECT.preview({decision,variant,state:choice,tokens:resolveTokens(PROJECT,choice),escapeHTML}):escapeHTML(variant.sample || variant.label);
  }
  function controls() {
    const opened=new Map($$('.group').map(el=>[el.dataset.group,el.open]));
    const preset=PROJECT.presets.find(p=>JSON.stringify(validateState(PROJECT,p.state,true))===JSON.stringify(state));
    $('#presets').innerHTML=PROJECT.presets.map(p=>`<button data-preset="${p.id}" aria-pressed="${p===preset}">${escapeHTML(p.label)}<small>${escapeHTML(p.description || '')}</small></button>`).join('');
    $('#preset-status').textContent=preset?'Выбрано «'+preset.label+'»':'Свой набор решений';
    $('#decisions').innerHTML=[...new Set(PROJECT.decisions.map(d=>d.group))].map((group,i)=>`<details class="group" data-group="${i}" ${opened.get(String(i))!==false?'open':''}><summary>${escapeHTML(group)}</summary>${PROJECT.decisions.filter(d=>d.group===group).map(d=>`<section class="decision"><div class="decision-head"><h3>${escapeHTML(d.label)}</h3><button class="show" data-jump="${d.targets[0]}">На макете ↗</button></div><p>${escapeHTML(d.description || '')}</p><div class="choices" role="radiogroup" aria-label="${escapeHTML(d.label)}">${d.variants.map(v=>`<button class="choice" role="radio" aria-checked="${state[d.id]===v.id}" tabindex="${state[d.id]===v.id?0:-1}" data-decision="${d.id}" data-variant="${v.id}"><div class="mini" aria-hidden="true">${miniature(d,v)}</div><strong>${escapeHTML(v.label)}</strong><small>${escapeHTML(v.description || '')}</small></button>`).join('')}</div></section>`).join('')}</details>`).join('');
  }
  function choose(id,value) {
    state=validateState(PROJECT,{...state,[id]:value}); compare='after';
    controls();persist();preview(PROJECT.decisions.find(d=>d.id===id).targets[0]);
    status('Выбор обновлён');
  }
  function exportValue() { return format==='json'?JSON.stringify(makePayload(PROJECT,state),null,2):brief(PROJECT,state); }
  function refreshExport() { $('#export-content').value=exportValue();$$('[data-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.format===format))); }
  function download(value,extension,type) {
    const url=URL.createObjectURL(new Blob([value],{type}));const link=document.createElement('a');
    link.href=url;link.download=PROJECT.id+'-design.'+extension;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);
  }
  document.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.decision)choose(b.dataset.decision,b.dataset.variant);
    if(b.dataset.preset){state=validateState(PROJECT,PROJECT.presets.find(p=>p.id===b.dataset.preset).state,true);compare='after';controls();persist();preview(PROJECT.sections[0].id);}
    if(b.dataset.compare){compare=b.dataset.compare;preview();}
    if(b.dataset.device){device=b.dataset.device;$$('[data-device]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));fit();}
    if(b.dataset.jump){if(innerWidth<=720){document.body.dataset.surface='preview';$$('[data-surface]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.surface==='preview')));}zoomMode='fit';fit();jump(b.dataset.jump);}
    if(b.dataset.surface){document.body.dataset.surface=b.dataset.surface;$$('[data-surface]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));fit();}
    if(b.dataset.format){format=b.dataset.format;refreshExport();}
    if(b.hasAttribute('data-close'))$('#export-dialog').close();
  });
  document.addEventListener('keydown',event=>{
    const b=event.target.closest('[data-decision]');
    if(b&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();const d=PROJECT.decisions.find(d=>d.id===b.dataset.decision),i=d.variants.findIndex(v=>v.id===b.dataset.variant);
      const next=event.key==='Home'?0:event.key==='End'?d.variants.length-1:(i+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+d.variants.length)%d.variants.length;
      choose(d.id,d.variants[next].id);$(`[data-decision="${d.id}"][data-variant="${d.variants[next].id}"]`).focus({preventScroll:true});
    }
    if(event.key==='Escape'){document.body.classList.remove('expanded');fit();}
  });
  const splitter=$('#splitter');let dragging=false;
  splitter.addEventListener('pointerdown',e=>{if(e.button!==0)return;dragging=true;splitter.setPointerCapture(e.pointerId);document.body.classList.add('resizing');});
  splitter.addEventListener('pointermove',e=>{if(dragging){setWidth(e.clientX);fit();}});
  function endResize(){if(dragging){dragging=false;document.body.classList.remove('resizing');persist();}}
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>splitter.addEventListener(type,endResize));
  splitter.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const width=Number(splitter.getAttribute('aria-valuenow'));setWidth(e.key==='Home'?280:e.key==='End'?800:width+(e.key==='ArrowLeft'?-20:20));persist();fit();});
  $('#tool-theme').onclick=()=>{theme=theme==='light'?'dark':'light';applyTheme();persist();};
  $('#reset').onclick=()=>{state=baseline(PROJECT);compare='after';controls();persist();preview(PROJECT.sections[0].id);status('Восстановлены исходные варианты');};
  $('#expand').onclick=()=>{document.body.classList.toggle('expanded');fit();};
  $('#zoom').oninput=e=>{zoom=Number(e.target.value)/100;zoomMode='manual';fit();};
  $('#fit-width').onclick=()=>{zoomMode='fit';fit();};$('#fit-page').onclick=()=>{zoomMode='page';fit();};
  $('#section-jump').onchange=e=>{zoomMode='fit';fit();jump(e.target.value);};
  $('#export').onclick=()=>{refreshExport();$('#copy-status').textContent='';$('#export-dialog').showModal();};
  $('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(exportValue());$('#copy-status').textContent='Скопировано';}catch{$('#export-content').select();$('#copy-status').textContent='Скопируйте выделенный текст вручную';}};
  $('#download-json').onclick=()=>download(JSON.stringify(makePayload(PROJECT,state),null,2),'json','application/json');
  $('#download-txt').onclick=()=>download(brief(PROJECT,state),'txt','text/plain;charset=utf-8');
  $('#download-html').onclick=()=>download(exportHTML(PROJECT,state),'html','text/html;charset=utf-8');
  $('#import').onclick=()=>$('#import-file').click();
  $('#import-file').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>1_000_000)throw new Error('Файл выбора слишком большой');const next=importSelection(PROJECT,await file.text());state=next;compare='after';controls();persist();preview();status('Выбор импортирован');}catch(error){status('Импорт не выполнен: '+error.message);}finally{e.target.value='';}};
  window.addEventListener('message',e=>{if(e.source!==frame.contentWindow||!e.data?.studio||!Number.isFinite(e.data.height))return;const height=Math.max(450,Math.min(100000,e.data.height));if(Math.abs(siteHeight-height)>2){siteHeight=height;if(zoomMode==='page')fit();}});
  window.addEventListener('resize',()=>{if(innerWidth>720)setWidth(Number(splitter.getAttribute('aria-valuenow')));fit();});
  new ResizeObserver(fit).observe(well);
  $('#project-name').textContent=PROJECT.name;document.title=PROJECT.name+' / Design Configurator';
  $('#section-jump').innerHTML=PROJECT.sections.map(s=>`<option value="${s.id}">${escapeHTML(s.label)}</option>`).join('');
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved){state=validateState(PROJECT,saved.state);theme=saved.theme==='dark'?'dark':'light';if(Number.isFinite(saved.pickerWidth))setWidth(saved.pickerWidth);}}catch{status('Сохранение недоступно или устарело — применены исходные варианты');}
  applyTheme();controls();preview();
})();
