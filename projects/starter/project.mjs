export default {
  id:'starter', name:'Forma / рабочее пространство', revision:1, lang:'ru',
  styles:'site.css',assets:{diagram:'assets/diagram.svg'},viewports:{desktop:1280,mobile:390},
  sections:[{id:'hero',label:'Первый экран'},{id:'features',label:'Возможности'},{id:'process',label:'Как это устроено'},{id:'closing',label:'Завершение'}],
  tokens:{paper:'#f4f3ef',ink:'#252822',muted:'#61655c'},
  decisions:[
    {id:'palette',group:'Общий дизайн',label:'Акцент',description:'Один цвет связывает кнопки, метки и схему',default:'olive',targets:['hero','features'],variants:[
      {id:'olive',label:'Оливковый',sample:'01 / Спокойно',description:'Тёплая рабочая среда',tokens:{accent:'#536443',tint:'#e3e8dc'}},
      {id:'blue',label:'Синий',sample:'02 / Точно',description:'Холодный деловой акцент',tokens:{accent:'#285ba6',tint:'#e0e9f6'}},
      {id:'clay',label:'Терракота',sample:'03 / Тепло',description:'Мягкий редакционный характер',tokens:{accent:'#a04d36',tint:'#f0e0d9'}}]},
    {id:'type',group:'Общий дизайн',label:'Типографика',description:'Системные шрифты без внешней загрузки',default:'sans',targets:['hero'],variants:[
      {id:'sans',label:'Гротеск',sample:'Aa / Идея',description:'Чёткий и нейтральный',tokens:{font:'Arial, sans-serif'}},
      {id:'serif',label:'Антиква',sample:'Aa / История',description:'Редакционный характер',tokens:{font:'Georgia, serif'}}]},
    {id:'layout',group:'Композиция',label:'Первый экран',description:'Расстановка текста и продуктовой схемы',default:'split',targets:['hero'],variants:[
      {id:'split',label:'Две колонки',sample:'Текст → Схема',tokens:{layout:'split'}},
      {id:'center',label:'По центру',sample:'Текст ↓ Схема',tokens:{layout:'center'}},
      {id:'reverse',label:'Схема слева',sample:'Схема → Текст',tokens:{layout:'reverse'}}]},
    {id:'density',group:'Композиция',label:'Ритм',description:'Количество воздуха между разделами',default:'balanced',targets:['features','process'],variants:[
      {id:'compact',label:'Компактно',sample:'— — —',tokens:{space:64,radius:12}},
      {id:'balanced',label:'Баланс',sample:'—  —  —',tokens:{space:96,radius:20}},
      {id:'airy',label:'Свободно',sample:'—   —   —',tokens:{space:132,radius:28}},
      {id:'editorial',label:'Редакционно',sample:'—     —',tokens:{space:160,radius:4}}]}
  ],
  presets:[
    {id:'calm',label:'Спокойная работа',description:'Оливковый, две колонки, ровный ритм',state:{}},
    {id:'clear',label:'В фокусе',description:'Синий, центр, компактная подача',state:{palette:'blue',layout:'center',density:'compact'}},
    {id:'story',label:'Своя история',description:'Терракота, антиква, больше воздуха',state:{palette:'clay',type:'serif',layout:'reverse',density:'airy'}}
  ],
  content:{brand:'Forma',eyebrow:'Место для следующей идеи',title:'Мысли становятся понятнее, когда у них есть место',subtitle:'Соберите заметки, решения и следующие шаги в одном рабочем пространстве',cta:'Посмотреть возможности',featuresTitle:'От первой заметки до ясного плана',features:[{title:'Собрать',text:'Сохраните мысль, пока она рядом'},{title:'Разложить',text:'Свяжите заметки и найдите главное'},{title:'Продолжить',text:'Превратите решение в следующий шаг'}],processTitle:'Ваш ритм, ваша система',processText:'Начните с одной заметки и добавляйте структуру, когда она понадобится',closingTitle:'Оставьте место новой идее'},
  notes:['Нейтральный учебный проект для знакомства с конфигуратором','CTA ведёт к разделу возможностей — внешнего сервиса нет','Шрифты системные, изображения встроены в автономный HTML'],
  preview:function({decision,variant,tokens:t,escapeHTML:e}){
    return `<div style="width:100%;height:100%;padding:12px;background:${e(t.tint)};color:${e(t.accent)};font-family:${e(t.font)};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><span style="font-size:${decision.id==='type'?22:12}px">${e(variant.sample || variant.label)}</span><span style="display:block;width:48px;height:12px;background:${e(t.accent)};border-radius:${t.radius}px"></span></div>`;
  },
  render:function({tokens:t,content:c,assets,escapeHTML:e}){
    const vars=`--accent:${t.accent};--tint:${t.tint};--paper:${t.paper};--ink:${t.ink};--muted:${t.muted};--font:${t.font};--space:${t.space}px;--radius:${t.radius}px`;
    return `<div class="site" style="${e(vars)}"><header class="wrap"><a class="brand" href="#hero">${e(c.brand)}</a><a href="#features">Возможности ↗</a></header><main><section id="hero" class="wrap hero ${e(t.layout)}"><div class="hero-copy"><p class="eyebrow">${e(c.eyebrow)}</p><h1>${e(c.title)}</h1><p class="lead">${e(c.subtitle)}</p><a class="cta" href="#features">${e(c.cta)} <span>↗</span></a></div><div class="product"><div class="product-bar"><span>МОИ ЗАМЕТКИ</span><span>01 — 03</span></div><img src="${assets.diagram}" alt="Схема: идея, связь и следующий шаг" width="560" height="420"><div class="note"><span>Сегодня</span><strong>Начать с главного</strong><p>Одна мысль — уже хорошее начало</p></div></div></section><section id="features" class="wrap section"><p class="eyebrow">Просто начать</p><h2>${e(c.featuresTitle)}</h2><div class="features">${c.features.map((f,i)=>`<article><span class="number">0${i+1}</span><h3>${e(f.title)}</h3><p>${e(f.text)}</p></article>`).join('')}</div></section><section id="process" class="wrap section process"><div><p class="eyebrow">Без лишних правил</p><h2>${e(c.processTitle)}</h2></div><p class="lead">${e(c.processText)}</p></section><section id="closing" class="wrap section closing"><h2>${e(c.closingTitle)}</h2><a class="cta" href="#hero">Вернуться к началу ↗</a></section></main><footer class="wrap"><span>${e(c.brand)}</span><span>Пример для Design Configurator</span></footer></div>`;
  }
};
