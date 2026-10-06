export default {
  id:'workshop',name:'Мастерская / афиша',revision:1,styles:'site.css',assets:{},
  sections:[{id:'event',label:'Событие'},{id:'agenda',label:'Программа'}],
  tokens:{background:'#fff9ed'},
  decisions:[
    {id:'accent',group:'Афиша',label:'Цвет',default:'red',targets:['event'],variants:[{id:'red',label:'Красный',tokens:{accent:'#b53626'}},{id:'green',label:'Зелёный',tokens:{accent:'#176557'}}]},
    {id:'scale',group:'Афиша',label:'Размер заголовка',default:'large',targets:['event'],variants:[{id:'small',label:'Сдержанно',tokens:{size:54}},{id:'medium',label:'Средне',tokens:{size:72}},{id:'large',label:'Крупно',tokens:{size:90}},{id:'huge',label:'Плакат',tokens:{size:108}}]}
  ],
  presets:[{id:'poster',label:'Плакат',state:{}},{id:'quiet',label:'Тихая мастерская',state:{accent:'green',scale:'small'}}],
  content:{title:'Создать что-то своими руками',subtitle:'Открытая мастерская идей',agenda:['Знакомство и первые наброски','Выбор материалов и работа','Обсуждение и новые планы']},
  notes:['Второй пример с другой структурой: две секции и варианты в количестве 2 и 4','Демонстрационная афиша, регистрация на событие не реализована'],
  render:function({tokens:t,content:c,escapeHTML:e}){return `<main style="--accent:${e(t.accent)};--size:${t.size}px;--background:${e(t.background)}"><section id="event"><p>МАСТЕРСКАЯ / УЧЕБНЫЙ ПРИМЕР</p><h1>${e(c.title)}</h1><p>${e(c.subtitle)}</p><a href="#agenda">Программа ↓</a></section><section id="agenda"><h2>От идеи к результату</h2><ol>${c.agenda.map(x=>`<li>${e(x)}</li>`).join('')}</ol><button id="agenda-toggle" aria-expanded="false" aria-controls="details">Что взять с собой</button><p id="details" hidden>Блокнот, карандаш и интерес к новому</p></section></main>`;},
  runtime:function(){const button=document.querySelector('#agenda-toggle');button.onclick=()=>{const open=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!open));document.querySelector('#details').hidden=open;};}
};
