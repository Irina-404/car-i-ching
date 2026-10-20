function validateGalleryData(structure,descriptions,vehicles,photos,placements){
 const codes=Array.from({length:8},(_,i)=>i.toString(2).padStart(3,'0'));
 const expectedAxes={row:[['taskScale','personal','wide'],['temperament','calm','active'],['environment','predictable','adventure']],column:[['approach','tradition','innovation'],['priority','practicality','pleasure'],['expression','restraint','selfExpression']]};
 for(const data of [structure,descriptions,vehicles,photos,placements])if(data.schemaVersion!==1)throw Error('Неизвестная версия данных');
 if(structure.dimensions.rows!==8||structure.dimensions.columns!==8||structure.cellCodeFormat!=='RRR-CCC'||JSON.stringify(structure.bitOrder)!=='[1,2,3]'||JSON.stringify(structure.rowCodes)!==JSON.stringify(codes)||JSON.stringify(structure.columnCodes)!==JSON.stringify(codes))throw Error('Нарушена фиксированная структура 8 × 8');
 for(const side of ['row','column']){const axes=structure.axes[side];if(axes.length!==3)throw Error('Нарушено число осей');expectedAxes[side].forEach(([id,zero,one],i)=>{const a=axes[i];if(a.position!==i+1||a.id!==id||a.values[0]!==zero||a.values[1]!==one||a.values.length!==2)throw Error('Нарушена кодировка осей');});}
 if(Object.keys(placements.cells).length!==64)throw Error('Должно быть ровно 64 клетки');
 for(const r of codes){if(!descriptions.rows[r])throw Error('Нет описания строки '+r);for(const c of codes){const code=r+'-'+c,p=placements.cells[code],t=descriptions.results[code];if(!descriptions.columns[c]||!p||!vehicles.items[p.vehicleId]||!Object.hasOwn(photos.items,p.photoId)||!t||typeof t.personTitle!=='string'||typeof t.personPortrait!=='string'||typeof t.twinExplanation!=='string'||typeof t.technicalSpecs!=='string')throw Error('Неполные данные клетки '+code);}}
}
async function startGallery(){
 const names=['structure','descriptions','vehicles','photos','placements'];
 const [structure,descriptions,vehicles,photos,placements]=await Promise.all(names.map(async name=>{const response=await fetch('data/'+name+'.json');if(!response.ok)throw Error('Не удалось прочитать '+name+'.json');return response.json();}));
 validateGalleryData(structure,descriptions,vehicles,photos,placements);
 const bit=i=>i.toString(2).padStart(3,'0');
 const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const types=structure.rowCodes.map(code=>descriptions.rows[code].name);
 const first=structure.rowCodes.map(code=>descriptions.rows[code].short);
 const second=structure.columnCodes.map(code=>descriptions.columns[code].short);
 const lifestyleAxes=descriptions.axisWording.row,characterAxes=descriptions.axisWording.column;
 const selections=Object.fromEntries(Object.entries(placements.cells).map(([code,p])=>{const v=vehicles.items[p.vehicleId],text=descriptions.results[code];return [code,{...v,query:v.photoSearch,photo:photos.items[p.photoId],status:p.status,...text,reason:text.editorialReason}];}));
function describePerson(row,col){
 const describe=(code,axes)=>Array.from(bit(code),(value,i)=>axes[i][Number(value)]).join('; ')+'.';
 return {lifestyle:describe(row,lifestyleAxes),character:describe(col,characterAxes)};
}
function personProfile(car){return '<section class="person-profile"><p>'+safe(car.personPortrait)+'</p></section>';}
const cars = Array.from({length:64},(_,i) => {const row=Math.floor(i/8),col=i%8;return {row,col,code:bit(row)+' · '+bit(col),name:'',query:'',...selections[bit(row)+'-'+bit(col)]};});
const matrix=document.getElementById('matrix'),modal=document.getElementById('modal'),content=document.getElementById('modalContent'),status=document.getElementById('status');
const rowLabels=[];
const selected=cars.filter(car=>car.name);
let loaded=0;
function eraLabel(year){return year<1970?'1950–1969':year<1990?'1970–1989':year<=2010?'1990–2010':'После 2010';}
function updateStatus(){status.textContent='Размещено автомобилей: '+selected.length+'/64 · Согласовано: '+selected.filter(car=>car.status==='agreed').length+(selected.length?' · Фотографии: '+loaded+'/'+selected.length:'');}
const header=document.createElement('div');header.className='headcell corner';header.innerHTML='<strong>ОБРАЗ ЖИЗНИ / ХАРАКТЕР</strong>Строка / столбец · биты 1–2–3';matrix.append(header);
second.forEach((s,i)=>{const d=document.createElement('div');d.className='headcell';d.innerHTML='<strong>'+bit(i)+'</strong><span class="column-axes">'+safe(s)+'</span><p class="column-summary">'+safe(describePerson(0,i).character)+'</p>';matrix.append(d);});
for(let r=0;r<8;r++){
 const label=document.createElement('div');label.className='type';label.innerHTML='<b>'+bit(r)+' · '+safe(types[r])+'</b><span class="row-summary">'+safe(describePerson(r,0).lifestyle)+'</span>';matrix.append(label);rowLabels.push(label);
 for(let c=0;c<8;c++){
  const car=cars[r*8+c],button=document.createElement('button');button.className='tile'+(car.name?'':' empty');button.dataset.idx=r*8+c;
  const person=describePerson(r,c);
  button.setAttribute('aria-label',[car.personTitle,car.code,types[r],person.lifestyle,person.character,car.name||'Автомобиль не выбран'].filter(Boolean).join(' · '));
  button.innerHTML='<div class="tile-title" title="'+safe(car.personTitle)+'"><span>'+safe(car.personTitle)+'</span></div><div class="photo"><span class="placeholder">'+(car.name?'Поиск фотографии…':'Место для автомобиля')+'</span></div><div class="meta"><b title="'+safe(car.name||'Автомобиль не выбран')+'">'+safe(car.name||'Автомобиль не выбран')+'</b>'+(car.name?'<span class="era-label">'+eraLabel(car.year)+'</span>':'')+'</div>';
  button.addEventListener('click',()=>show(r*8+c));matrix.append(button);car.el=button;
 }
}
types.forEach((type,i)=>{const option=document.createElement('option');option.value=i;option.textContent=bit(i)+' · '+type;document.getElementById('typeFilter').append(option);});
function updateFilter(){
 const q=document.getElementById('search').value.trim().toLocaleLowerCase(),filter=document.getElementById('typeFilter').value;let visible=0;
 for(let r=0;r<8;r++){
  const row=cars.slice(r*8,r*8+8),matches=row.map(car=>{const person=describePerson(r,car.col);return [car.personTitle,car.name,car.code,bit(car.row)+bit(car.col),types[r],first[r],second[car.col],person.lifestyle,person.character].join(' ').toLocaleLowerCase().includes(q);});
  const rowVisible=(filter==='all'||Number(filter)===r)&&matches.some(Boolean);rowLabels[r].classList.toggle('hidden',!rowVisible);
  row.forEach((car,c)=>{car.el.classList.toggle('hidden',!rowVisible);car.el.classList.toggle('filtered-out',rowVisible&&!matches[c]);});
  if(rowVisible)visible++;
 }
 document.getElementById('emptySearch').classList.toggle('hidden',visible>0);
}
document.getElementById('search').addEventListener('input',updateFilter);
document.getElementById('typeFilter').addEventListener('change',updateFilter);
async function fetchPhoto(car){
 const key='carhex:'+car.query;
 try{
  if(car.photo){renderPhoto(car);return;}
  const saved=localStorage.getItem(key);if(saved){car.photo=JSON.parse(saved);renderPhoto(car);return;}
  const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+car.query+' automobile',gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'560',format:'json',origin:'*'});
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params);if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json(),pages=Object.values(data.query?.pages||{}).filter(p=>p.imageinfo?.[0]?.thumburl&&/\.(jpe?g|png|webp)$/i.test(p.title));if(!pages.length)throw Error('Нет фото');
  const info=pages[0].imageinfo[0],meta=info.extmetadata||{};car.photo={url:info.thumburl,full:info.url,source:info.descriptionurl,author:(meta.Artist?.value||'Автор указан на странице файла').replace(/<[^>]*>/g,' ').slice(0,200),license:meta.LicenseShortName?.value||'Проверьте лицензию'};
  try{localStorage.setItem(key,JSON.stringify(car.photo));}catch(e){}renderPhoto(car);
 }catch(e){car.el.querySelector('.photo').textContent='Фото пока нет';}finally{loaded++;updateStatus();}
}
function renderPhoto(car){const area=car.el.querySelector('.photo');area.innerHTML='';const img=new Image();img.loading='lazy';img.alt=car.name;img.src=car.photo.url;img.onerror=()=>{area.textContent='Не удалось загрузить фото';};area.append(img);}
const queue=selected.filter(car=>car.query);async function worker(){while(queue.length)await fetchPhoto(queue.shift());}
Promise.all(Array.from({length:Math.min(4,queue.length)},worker));
function show(idx){
 const car=cars[idx];
 if(!car.name){content.innerHTML='<h2 id="cardTitle">Результат ещё готовится</h2><p class="detail">Для этого сочетания пока не выбран автомобильный двойник.</p>';}
 else{
  content.innerHTML='<h2 id="cardTitle">'+safe(car.personTitle.trim()||'Портрет человека')+'</h2>'+personProfile(car)+'<p class="detail twin-intro">'+safe(descriptions.resultUi.twinIntro)+'</p><h3 class="twin-name">'+safe(car.name)+'</h3><div class="large-photo">'+(car.photo?'<img src="'+safe(car.photo.full)+'" alt="'+safe(car.name)+'">':'<span>Фотография пока не выбрана</span>')+'</div>'+(car.technicalSpecs.trim()?'<p class="detail technical-specs">Техника: '+safe(car.technicalSpecs)+'</p>':'')+'<p class="detail twin-explanation">'+safe(car.twinExplanation)+'</p>'+(car.photo?'<div class="credit"><a target="_blank" rel="noopener" href="'+safe(car.photo.source)+'">Источник фотографии</a></div>':'');
 }
 modal.showModal();
}

document.getElementById('close').onclick=()=>modal.close();modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
document.getElementById('reload').disabled=!selected.length;
document.getElementById('reload').onclick=()=>{for(const car of selected){try{localStorage.removeItem('carhex:'+car.query);}catch(e){}}location.reload();};
updateStatus();

}
startGallery().catch(error=>{const status=document.getElementById("status");status.textContent=location.protocol==="file:"?"Для загрузки JSON откройте галерею через Start-Gallery.cmd.":"Ошибка загрузки данных: "+error.message;console.error(error);});
