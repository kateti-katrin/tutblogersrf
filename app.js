// Drafts are separate from shared campaign data and scoped to each form and account.
const formDraftMemory=new Map();
let renderedDraftScope='';
function draftScope(){return JSON.stringify([role,role==='blogger'?personId:null,location.hash.slice(1)||'overview'])}
function formDraftKey(f){return 'tut-v4-draft:'+renderedDraftScope+':'+JSON.stringify(Object.entries(f.dataset).sort(([a],[b])=>a.localeCompare(b)))}
function storeFormDraft(f){if(!f?.dataset.form)return;const values=Array.from(f.elements).filter(e=>e.name&&!['submit','button','file'].includes(e.type)).map(e=>({name:e.name,type:e.type,value:e.value,checked:e.checked}));const key=formDraftKey(f),raw=JSON.stringify(values);formDraftMemory.set(key,raw);try{sessionStorage.setItem(key,raw)}catch{}}
function clearFormDraft(f){const key=formDraftKey(f);formDraftMemory.delete(key);try{sessionStorage.removeItem(key)}catch{}}
function restoreFormDrafts(){let restored=false;for(const f of document.querySelectorAll('#main form[data-form]')){const key=formDraftKey(f);let raw=formDraftMemory.get(key);try{raw=raw||sessionStorage.getItem(key)}catch{}if(!raw)continue;try{const values=JSON.parse(raw);for(const item of values){const e=Array.from(f.elements).find(e=>e.name===item.name&&e.type===item.type);if(!e)continue;if(['checkbox','radio'].includes(e.type))e.checked=item.checked;else e.value=item.value;}restored=true;}catch{}}return restored}
function route(){return (location.hash.slice(1)||'overview').split('/')}
function go(path){dirty=false;conflict=false;if(location.hash.slice(1)===path)render();else location.hash=path}
function showConflict(){if($('#conflict'))return;const div=document.createElement('div');div.id='conflict';div.className='note conflict';div.setAttribute('role','alert');div.innerHTML='Данные изменены в другой вкладке. Ваш ввод сохранен на экране. Скопируйте его перед обновлением. '+button('Загрузить изменения','reload-state');$('#main').prepend(div)}
function render(){
 const [r,id,view,pid]=route();if(typeof markConversationRead==='function'&&(r==='team'||r==='deal'&&view==='chat'))markConversationRead(r==='team'?'team':id);shell();let content;
 const advertiser=['campaigns','campaign','create','bloggers','saved','compare','add','invite','company-profile'];
 if(advertiser.includes(r)&&role!=='advertiser')content=missing();
 else switch(r){
 case 'overview':content=overview();break;
 case 'create':content=campaignForm();break;
 case 'company-profile':content=companyProfile(id==='edit');break;
 case 'campaigns':content=head('Кампании','Общий бюджет, поиск авторов и результаты',link('Создать кампанию','create','button primary'))+campaignRows();break;
 case 'campaign':content=campaignView(campaignById(id),view);break;
 case 'bloggers':content=catalogue(id);break;
 case 'saved':content=catalogue(id,true);break;
 case 'compare':content=compareView(id);break;
 case 'profile':content=profileView(person(id),view);break;
 case 'creator-profile':content=role==='blogger'?(id==='edit'?editProfile():profileView(person(personId),null,true)):missing();break;
 case 'add':content=person(id)?addView(id,view):missing();break;
 case 'invite':content=inviteView(campaignById(id),person(view));break;
 case 'requests':content=role==='blogger'?(id?requestView(campaignById(id)):requestList()):missing();break;
 case 'projects':content=head('Мои сотрудничества','Приглашения, согласования и работа с рекламодателями')+dealRows(ownDeals(),id||'');break;
 case 'deal':content=dealView(dealById(id),view,pid);break;
 case 'messages':content=messagesView();break;
 case 'notifications':content=notifications();break;
 case 'help':content=help();break;
 case 'team':content=teamView();break;
 default:content=missing();
 }
 $('#main').innerHTML=(storageFailed?'<div class="form-error">Изменения не сохранены. '+button('Повторить сохранение','retry-save')+'</div>':'')+content;
 document.title=($('#main h1')?.textContent||'ТУТБЛОГЕРЫ.РФ')+' · ТУТБЛОГЕРЫ.РФ';renderedDraftScope=draftScope();dirty=restoreFormDrafts();if(conflict)showConflict();if(typeof applyTypography==='function'){applyTypography($('#main'));applyTypography($('#sidebar'));}if(typeof hydrateCompanyVideos==='function')hydrateCompanyVideos($('#main'));
}
function switchRole(target){
 const [r,id]=route(),d=r==='deal'?dealById(id):null;
 role=target;sessionStorage.setItem('tut-v4-role',role);
 if(role==='blogger'&&d){personId=d.personId;sessionStorage.setItem('tut-v4-person',String(personId));}
 dirty=false;conflict=false;
 if(d||r==='profile'||r==='notifications'||r==='messages'||r==='help'||r==='overview')render();
 else if(r==='campaign'&&role==='blogger'&&campaignById(id)?.request.status!=='draft')go('requests/'+id);
 else if(r==='requests'&&id&&role==='advertiser')go('campaign/'+id+'/request');
 else go('overview');
 toast(role==='advertiser'?'Кабинет рекламодателя':'Демо-кабинет: '+person(personId).name);
}
function requireRole(wanted){assertOK(role===wanted,'Это действие доступно в другом кабинете.');}
function requireDeal(id){const d=dealById(id);assertOK(canSee(d),'Сотрудничество недоступно.');return d}
function termsFrom(fd){const t={price:+fd.get('price'),date:fd.get('date'),platform:fd.get('platform'),format:fd.get('format'),qty:+fd.get('qty'),scope:(fd.get('scope')||'').trim(),payment:(fd.get('payment')||'').trim(),statsDays:+fd.get('statsDays'),script:fd.get('script')==='on'};for(const k of ['orientation','refs','scriptDue','finalDue','reviewDue','paymentDue'])t[k]=(fd.get(k)||'').trim();t.duration=fd.get('duration')?+fd.get('duration'):'';t.paymentMode=fd.get('paymentMode')||'manual';t.placementPlans=[];for(const [key,value]of fd.entries())if(key.startsWith('plannedDate_')){const id=key.slice(12);t.placementPlans.push({id,plannedDate:value,scriptDue:fd.get('scriptDue_'+id)||'',finalDue:fd.get('finalDue_'+id)||'',reviewDue:fd.get('reviewDue_'+id)||''})}return t}
function validatePlans(t,d,c){for(const plan of t.placementPlans||[]){assertOK(d.placements.some(p=>p.id===plan.id),'Размещение недоступно.');assertOK(plan.plannedDate>=c.start&&plan.plannedDate<=c.end,'Дата размещения должна попадать в сроки кампании.');assertOK(!plan.scriptDue||!plan.finalDue||plan.scriptDue<=plan.finalDue,'Проверьте порядок сроков сценария и материала.');assertOK(!(plan.finalDue||t.finalDue)||(plan.finalDue||t.finalDue)<=plan.plannedDate,'Материал должен быть готов до публикации.');assertOK(!(plan.scriptDue||t.scriptDue)||(plan.scriptDue||t.scriptDue)<=plan.plannedDate,'Сценарий должен быть готов до публикации.')}}
function handleSubmit(f,fd,intent){const type=f.dataset.form,id=f.dataset.id;
 if(type==='company'){requireRole('advertiser');const name=fd.get('name').trim(),industry=fd.get('industry').trim(),description=fd.get('description').trim(),contact=fd.get('contact').trim(),site=fd.get('site').trim(),email=fd.get('email').trim();assertOK(name&&industry&&description&&contact,'Заполните название, сферу деятельности, описание и контактное лицо.');assertOK(!site||safeUrl(site),'Укажите ссылку http или https.');const phone=(fd.get('phone')||'').trim(),legalType=fd.get('legalType')||'',legalName=(fd.get('legalName')||'').trim(),inn=(fd.get('inn')||'').trim(),ogrn=(fd.get('ogrn')||'').trim();assertOK(!inn||/^\d+$/.test(inn)&&inn.length===(legalType==='ИП'?12:10),'Проверьте ИНН: для ИП — 12 цифр, для ООО — 10.');assertOK(!ogrn||/^\d+$/.test(ogrn)&&ogrn.length===(legalType==='ИП'?15:13),'Проверьте регистрационный номер: ОГРНИП — 15 цифр, ОГРН — 13.');state.company={...state.company,name,industry,description,contact,site,email,phone,legalType,legalName,inn,ogrn};return {path:'company-profile',message:'Профиль компании сохранен'};}
 if(type==='company-work'){requireRole('advertiser');const source=companyWorkSources().find(w=>w.id===fd.get('source')),title=(fd.get('title')||'').trim()||source?.title,author=(fd.get('author')||'').trim()||source?.author,mediaId=fd.get('mediaId'),repostUrl=(fd.get('repostUrl')||'').trim();assertOK(title&&author,'Укажите название и блогера или выберите сотрудничество.');assertOK(mediaId,'Загрузите видеофайл.');assertOK(!repostUrl||safeUrl(repostUrl),'Укажите ссылку на публикацию http или https.');const works=clone(companyWorkItems());works.push({id:uid(),title,author,url:source?.url||'',mediaId,orientation:fd.get('orientation')==='horizontal'?'horizontal':'vertical',repostUrl:repostUrl?safeUrl(repostUrl):''});state.company.works=works;return {message:'Видео добавлено в профиль компании'};}
 if(type==='company-repost'){requireRole('advertiser');const works=clone(companyWorkItems()),work=works.find(w=>w.id===id),url=safeUrl(fd.get('repostUrl'));assertOK(work&&url,'Укажите ссылку на репост http или https.');work.repostUrl=url;state.company.works=works;return {message:'Ссылка на репост сохранена'};}
 if(type==='campaign'){
 requireRole('advertiser');const start=fd.get('start'),end=fd.get('end'),min=+fd.get('priceMin'),max=+fd.get('priceMax'),budget=+fd.get('budget'),target=+fd.get('target');
 assertOK(start<=end,'Окончание кампании не может быть раньше начала.');assertOK(min<=max,'Минимальная оплата не должна превышать максимальную.');assertOK(min*target<=budget,'Общий бюджет меньше минимальной оплаты выбранному количеству авторов. Увеличьте бюджет или измените набор.');
 for(const name of ['name','product','audience','deliverables','requirements','provides','payment'])assertOK(fd.get(name).trim(),'Заполните все обязательные поля — текст не может состоять из пробелов.');
 const c={id:uid(),name:fd.get('name').trim(),brand:fd.get('brand')?.trim()||state.company.name,site:fd.get('site')?.trim()||'',product:fd.get('product').trim(),audience:fd.get('audience').trim(),budget,start,end,status:'active',shortlist:[],brief:{platform:fd.get('platform'),format:fd.get('format'),qty:+fd.get('qty'),priceMin:min,priceMax:max,deliverables:fd.get('deliverables').trim(),requirements:fd.get('requirements').trim(),provides:fd.get('provides').trim(),payment:fd.get('payment').trim(),script:fd.get('script')==='on',statsDays:+fd.get('statsDays'),orientation:fd.get('orientation')||'',duration:+fd.get('duration')||'',refs:(fd.get('refs')||'').trim(),scriptDue:fd.get('scriptDue')||'',finalDue:fd.get('finalDue')||'',reviewDue:fd.get('reviewDue')||'',paymentDue:fd.get('paymentDue')||'',paymentMode:fd.get('paymentMode')||'manual'},request:{status:intent==='publish'?'open':'draft',reason:'',target,applications:[]}};
 validateTerms({...c.brief,price:c.brief.priceMin,date:c.end,scope:c.brief.deliverables},c);state.campaigns.push(c);return {path:'campaign/'+c.id,message:intent==='publish'?'Кампания создана, заявка опубликована':'Кампания создана. Начните подбор авторов'};
 }
 if(type==='profile'){
 requireRole('blogger');assertOK(Number(id)===personId,'Можно редактировать только свой профиль.');const p=person(personId);
 for(const k of ['name','bio','topic','platform','audience','formats','availability','portfolioText'])assertOK(fd.get(k).trim(),'Заполните обязательные поля.');
 if(fd.get('portfolio'))assertOK(safeUrl(fd.get('portfolio')),'Укажите ссылку http или https.');
 for(const k of ['name','bio','topic','platform','audience','formats','availability','portfolioText','portfolio'])p[k]=fd.get(k).trim();p.price=+fd.get('price');p.interests=(fd.get('interests')||'').trim();p.mediaAchievements=(fd.get('mediaAchievements')||'').trim();if(fd.has('workTitle0')){p.gallery=Array.from({length:Array.from(fd.keys()).filter(k=>/^workTitle\d+$/.test(k)).length},(_,i)=>{const url=(fd.get('workUrl'+i)||'').trim();assertOK(!url||safeUrl(url),'Проверьте ссылку на материал '+(i+1));return {type:['story','post'].includes(fd.get('workType'+i))?fd.get('workType'+i):'video',title:(fd.get('workTitle'+i)||'').trim(),duration:(fd.get('workDuration'+i)||'').trim(),description:(fd.get('workDescription'+i)||'').trim(),url}}).filter(w=>w.title)}return {message:'Профиль обновлен в каталоге'};
 }
 if(type==='shortlist'){requireRole('advertiser');const c=campaignById(fd.get('campaignId'));assertOK(c&&c.status==='active','Выберите активную кампанию.');if(!c.shortlist.includes(+id))c.shortlist.push(+id);return {path:'campaign/'+c.id+'/bloggers',message:'Блогер добавлен в подборку'};}
 if(type==='reopen'){requireRole('advertiser');const c=campaignById(id),target=+fd.get('target');assertOK(c&&c.status==='active','Кампания закрыта.');assertOK(target>reserved(c)&&target<=100,'Количество авторов должно быть больше числа занятых мест.');c.request.target=target;c.request.status='open';c.request.reason='';return {message:'Набор возобновлен'};}
 if(type==='apply'){
 requireRole('blogger');const c=campaignById(id);assertOK(c?.request.status==='open'&&reserved(c)<c.request.target,'Набор уже закрыт. Выберите другую заявку.');assertOK(!c.request.applications.some(a=>a.personId===personId&&!['withdrawn','declined'].includes(a.status)),'Вы уже отправляли отклик на эту заявку.');assertOK(!campaignDeals(c).some(d=>d.personId===personId&&participating(d)),'По кампании уже есть сотрудничество.');
 assertOK(fd.get('text').trim()&&fd.get('scope').trim(),'Опишите предложение и состав работ.');assertOK(fd.get('date')>=c.start&&fd.get('date')<=c.end,'Выберите дату внутри сроков кампании.');const previous=c.request.applications.find(a=>a.personId===personId),application={id:uid(),personId,status:'pending',at:now(),text:fd.get('text').trim(),scope:fd.get('scope').trim(),price:+fd.get('price'),date:fd.get('date')};if(previous){const {history=[],...snapshot}=previous;Object.assign(previous,application,{reason:'',history:[...history,snapshot]});}else c.request.applications.push(application);eventFor('advertiser','Новый отклик: '+person(personId).name+' · '+c.name,'campaign/'+c.id+'/request');return {message:'Отклик отправлен. Ожидайте итоговые условия'};
 }
 if(type==='invite'){
 requireRole('advertiser');const c=campaignById(id),p=person(f.dataset.person);assertOK(c&&p&&c.status==='active','Кампания недоступна.');assertOK(reserved(c)<c.request.target,'Все места заняты. Увеличьте количество авторов в заявке.');assertOK(!campaignDeals(c).some(d=>d.personId===p.id&&participating(d)),'Уже есть сотрудничество с этим автором.');const t=termsFrom(fd);validateTerms(t,c);const a=c.request.applications.find(a=>a.personId===p.id&&a.status==='pending');const d=makeDeal(c,p,a?'application':'invitation',t);if(a){a.status='selected';d.chat.push({role:'blogger',text:a.text,at:a.at});}return {path:'deal/'+d.id,message:'Условия отправлены. Ждем подтверждения блогера'};
 }
 const d=requireDeal(id),c=campaignById(d.campaignId),p=d.placements.find(p=>p.id===f.dataset.placement);
 if(type==='terms'){assertOK(['negotiation','active'].includes(d.status),'Сотрудничество закрыто.');const t=termsFrom(fd);validateTerms(t,c);if(d.status==='active'){assertOK(!d.pendingTerms,'Сначала рассмотрите текущее предложение изменений.');assertOK(t.qty===currentTerms(d).qty,'После начала работы количество размещений не меняется.');assertOK(d.payment.status==='unmarked'||t.price===currentTerms(d).price,'После отметки оплаты стоимость не меняется.');validatePlans(t,d,c);d.pendingTerms={...t,at:now(),by:role,approved:{advertiser:role==='advertiser',blogger:role==='blogger'}};activity(d,'Предложено изменение действующих условий');}else addTerms(d,t,role);tellOther(d,'Новые условия: '+c.name);return {message:'Предложение отправлено. Действуют прежние условия до подтверждения'};}
 if(type==='cancel-request'){assertOK(d.status==='active','Запрос отмены доступен в активном сотрудничестве.');assertOK(d.cancelRequest?.status!=='pending','Запрос отмены уже ожидает ответа.');const reason=(fd.get('reason')||'').trim();assertOK(reason,'Укажите причину отмены.');d.cancelRequest={by:role,reason,status:'pending',at:now()};activity(d,'Запрошена отмена сотрудничества');tellOther(d,'Запрос отмены: '+c.name);return {message:'Запрос отправлен второй стороне. Сотрудничество пока действует'};}
 if(type==='issue'){const reason=(fd.get('reason')||'').trim(),text=(fd.get('text')||'').trim();assertOK(reason&&text,'Выберите причину и опишите проблему.');d.issues ||= [];d.issues.push({id:uid(),by:role,reason,text,status:'open',at:now()});activity(d,'Сохранено обращение: '+reason);return {message:'Обращение сохранено в прототипе. В поддержку не отправлялось'};}

 if(type==='chat'){assertOK(fd.get('text').trim(),'Введите сообщение.');d.chat.push({role,text:fd.get('text').trim(),at:now()});tellOther(d,'Новое сообщение: '+c.name);return {message:'Сообщение сохранено'};}
 assertOK(d.status==='active','Изменения доступны только в активном сотрудничестве.');
 if(type==='payment'){requireRole('advertiser');assertOK(['unmarked','disputed'].includes(d.payment.status),'Оплата уже отмечена.');assertOK(fd.get('reference').trim(),'Добавьте комментарий к оплате.');assertOK(fd.get('date')<=today(),'Дата оплаты не может быть в будущем.');d.paymentHistory ||= [];d.paymentHistory.push({...clone(d.payment),archivedAt:now()});d.payment={status:'sent',date:fd.get('date'),reference:fd.get('reference').trim(),at:now()};activity(d,'Отмечена внешняя оплата');tellOther(d,'Подтвердите получение оплаты: '+c.name);return {message:'Отметка отправлена блогеру. Деньги через платформу не переводились'};}
 assertOK(p,'Размещение не найдено.');
 if(type==='material'){
 requireRole('blogger');const kind=f.dataset.kind,versions=kind==='script'?p.scriptVersions:p.finalVersions,v=latest(versions);
 assertOK(['script','final'].includes(kind),'Неизвестный этап.');assertOK(!v||v.status==='revision','Материал уже отправлен или согласован.');assertOK(kind!=='script'||currentTerms(d).script,'Согласование сценария не требуется.');assertOK(kind!=='final'||!currentTerms(d).script||latest(p.scriptVersions)?.status==='approved','Сначала согласуйте сценарий.');assertOK(fd.get('text').trim(),'Добавьте текст или описание материала.');if(kind==='final'||fd.get('url'))assertOK(safeUrl(fd.get('url')),'Укажите ссылку на материал: http или https.');versions.push({id:uid(),text:fd.get('text').trim(),url:fd.get('url'),status:'submitted',at:now(),feedback:''});activity(d,(kind==='script'?'Сценарий':'Материал')+' отправлен, версия '+versions.length);tellOther(d,'На согласовании '+(kind==='script'?'сценарий':'материал')+': '+c.name);return {message:'Материал отправлен на согласование'};
 }
 if(type==='review-material'){
 requireRole('advertiser');const versions=f.dataset.kind==='script'?p.scriptVersions:p.finalVersions,v=latest(versions);assertOK(v?.status==='submitted','Эта версия уже рассмотрена.');assertOK(['approved','revision'].includes(intent),'Выберите решение.');assertOK(intent!=='revision'||fd.get('feedback').trim(),'Напишите, какие правки нужны.');v.status=intent;v.feedback=fd.get('feedback').trim();v.reviewedAt=now();activity(d,(f.dataset.kind==='script'?'Сценарий':'Материал')+(intent==='approved'?' согласован':' возвращен на доработку'));tellOther(d,(intent==='approved'?'Материал согласован: ':'Нужны правки: ')+c.name);return {message:intent==='approved'?'Версия согласована':'Замечания отправлены блогеру'};
 }
 if(type==='mark'){assertOK(fd.get('erid').trim()&&fd.get('advertiser').trim(),'Укажите erid и рекламодателя.');p.mark={erid:fd.get('erid').trim(),advertiser:fd.get('advertiser').trim(),at:now()};activity(d,'Сохранена запись маркировки для размещения '+p.number);return {message:'Запись сохранена. Подлинность erid не проверялась'};}
 if(type==='publication'){
 requireRole('blogger');assertOK(latest(p.finalVersions)?.status==='approved','Сначала согласуйте готовый материал.');assertOK(!p.publication||p.publication.status==='revision','Ссылка уже на проверке или принята.');assertOK(safeUrl(fd.get('url')),'Укажите ссылку http или https.');assertOK(fd.get('date')<=today(),'Фактическая дата публикации не может быть в будущем.');if(p.publication)p.publicationHistory.push(clone(p.publication));p.publication={url:safeUrl(fd.get('url')),date:fd.get('date'),status:'submitted',at:now(),feedback:''};activity(d,'Ссылка на публикацию добавлена');tellOther(d,'Проверьте публикацию: '+c.name);return {message:'Ссылка добавлена. Ждем проверки рекламодателя'};
 }
 if(type==='review-publication'){
 requireRole('advertiser');assertOK(p.publication?.status==='submitted','Публикация уже рассмотрена.');assertOK(['approved','revision'].includes(intent),'Выберите решение.');assertOK(intent!=='revision'||fd.get('feedback').trim(),'Опишите, что исправить в публикации.');Object.assign(p.publication,{status:intent,feedback:fd.get('feedback').trim(),reviewedAt:now()});activity(d,intent==='approved'?'Публикация принята':'Запрошено исправление публикации');tellOther(d,(intent==='approved'?'Публикация принята: ':'Исправьте публикацию: ')+c.name);return {message:intent==='approved'?'Публикация подтверждена':'Комментарий отправлен блогеру'};
 }
 if(type==='stats'){
 requireRole('blogger');assertOK(p.publication?.status==='approved','Сначала рекламодатель должен принять публикацию.');const prev=latest(p.statsVersions);assertOK(!prev||prev.status==='revision','Статистика уже отправлена или принята.');const from=fd.get('from'),to=fd.get('to'),collected=fd.get('collected');assertOK(today()>=statsDue(p,d)&&to>=statsDue(p,d),'Статистика доступна после завершения согласованного периода: '+date(statsDue(p,d))+'.');assertOK(from===p.publication.date,'Период статистики должен начинаться с даты публикации.');assertOK(from>=p.publication.date&&from<=to&&to<=collected&&collected<=today(),'Проверьте период: от даты публикации до даты сбора, не позднее сегодняшнего дня.');assertOK(safeUrl(fd.get('source')),'Добавьте ссылку на подтверждение статистики.');const views=+fd.get('views'),reactions=+fd.get('reactions');assertOK(Number.isSafeInteger(views)&&views>=0&&Number.isSafeInteger(reactions)&&reactions>=0,'Введите целые неотрицательные показатели.');p.statsVersions.push({views,reactions,from,to,collected,source:safeUrl(fd.get('source')),at:now(),status:'submitted',feedback:''});activity(d,'Статистика отправлена на проверку');tellOther(d,'Проверьте статистику: '+c.name);return {message:'Статистика отправлена с подтверждающим источником'};
 }
 if(type==='review-stats'){
 requireRole('advertiser');const s=latest(p.statsVersions);assertOK(s?.status==='submitted','Статистика уже рассмотрена.');assertOK(['approved','revision'].includes(intent),'Выберите решение.');assertOK(intent!=='revision'||fd.get('feedback').trim(),'Опишите, какие данные нужно уточнить.');Object.assign(s,{status:intent,feedback:fd.get('feedback').trim(),reviewedAt:now()});activity(d,intent==='approved'?'Результат размещения принят':'Запрошено уточнение статистики');tellOther(d,(intent==='approved'?'Результат принят: ':'Уточните статистику: ')+c.name);return {message:intent==='approved'?'Результат принят и включен в сводку кампании':'Уточнение запрошено'};
 }
 throw Error('Действие недоступно.');
}
function handleAction(action,id){
 if(action==='close-issue'){const [did,iid]=id.split(':'),d=requireDeal(did),issue=d.issues?.find(i=>i.id===iid);assertOK(issue&&issue.by===role&&issue.status==='open','Обращение недоступно.');issue.status='closed';issue.closedAt=now();activity(d,'Обращение закрыто автором');return {message:'Обращение закрыто'};}

 if(action==='save-person'){requireRole('advertiser');state.saved=state.saved.includes(+id)?state.saved.filter(x=>x!==+id):[...state.saved,+id];return {message:'Подборка сохраненных обновлена'};}
 if(action==='read-events'){state.events.filter(e=>e.target===role&&(role==='advertiser'||e.personId===personId)).forEach(e=>e.read=true);return {};}
 if(['close-request','publish-request','complete-campaign','cancel-campaign'].includes(action)){
 requireRole('advertiser');const c=campaignById(id);assertOK(c&&!['completed','cancelled'].includes(c.status),'Кампания уже закрыта.');
 if(action==='cancel-campaign'){assertOK(!campaignDeals(c).some(participating),'Сначала завершите или отклоните текущие сотрудничества.');c.status='cancelled';c.request.status='closed';c.request.reason='manual';c.cancelledAt=now();for(const a of c.request.applications.filter(a=>a.status==='pending')){a.status='declined';a.reason='campaign-cancelled';eventFor('blogger','Кампания отменена: '+c.name,'requests/'+c.id,a.personId);}return {message:'Кампания отменена. История сохранена'};}
 if(action==='close-request'){c.request.status='closed';c.request.reason='manual';return {message:'Набор закрыт. Полученные отклики сохранены'};}
 if(action==='publish-request'){assertOK(reserved(c)<c.request.target,'Все места уже заняты.');c.request.status='open';c.request.reason='';return {message:'Заявка опубликована'};}
 const ds=campaignDeals(c).filter(participating);assertOK(ds.length&&ds.every(d=>d.status==='completed')&&c.request.status!=='open','Сначала завершите сотрудничества и закройте набор.');c.status='completed';c.completedAt=now();for(const a of c.request.applications.filter(a=>a.status==='pending')){a.status='declined';eventFor('blogger','Кампания завершена, отклик закрыт: '+c.name,'requests/'+c.id,a.personId);}return {message:'Кампания завершена'};
 }
 if(action==='decline-application'){
 requireRole('advertiser');const [cid,aid]=id.split(':'),c=campaignById(cid),a=c?.request.applications.find(a=>a.id===aid);assertOK(a?.status==='pending','Отклик уже рассмотрен.');a.status='declined';eventFor('blogger','Отклик отклонен: '+c.name,'requests/'+c.id,a.personId);return {message:'Отклик отклонен'};
 }
 if(action==='withdraw-application'){requireRole('blogger');const c=campaignById(id),a=c?.request.applications.find(a=>a.personId===personId);assertOK(a?.status==='pending','Отклик уже рассмотрен.');a.status='withdrawn';eventFor('advertiser','Блогер отозвал отклик: '+c.name,'campaign/'+c.id+'/request');return {message:'Отклик отозван'};}
 const d=requireDeal(id),t=currentTerms(d),c=campaignById(d.campaignId);
 if(['accept-change','reject-change'].includes(action)){const pending=d.pendingTerms;assertOK(d.status==='active'&&pending&&!pending.approved[role],'Нет предложения для рассмотрения.');if(action==='reject-change'){d.changeHistory ||= [];d.changeHistory.push({...pending,status:'rejected',reviewedAt:now(),reviewedBy:role});d.pendingTerms=null;activity(d,'Изменение условий отклонено');tellOther(d,'Изменение условий отклонено: '+c.name);return {message:'Прежние условия сохранены'};}validateTerms(pending,c);validatePlans(pending,d,c);assertOK(d.payment.status==='unmarked'||pending.price===t.price,'После отметки оплаты стоимость не меняется.');pending.approved[role]=true;for(const p of d.placements){const plan=pending.placementPlans?.find(x=>x.id===p.id);if(plan)Object.assign(p,plan);else if(p.plannedDate===t.date)p.plannedDate=pending.date;}d.terms.push(pending);d.pendingTerms=null;activity(d,'Изменение условий подтверждено обеими сторонами');tellOther(d,'Новые условия действуют: '+c.name);return {message:'Условия обновлены. Материалы и история сохранены'};}
 if(['accept-cancel','reject-cancel'].includes(action)){const request=d.cancelRequest;assertOK(d.status==='active'&&request?.status==='pending'&&request.by!==role,'Нет запроса отмены для рассмотрения.');request.status=action==='accept-cancel'?'accepted':'rejected';request.reviewedAt=now();if(action==='accept-cancel'){d.status='cancelled';d.cancelledAt=now();d.pendingTerms=null;reconcileRecruitment(c);}activity(d,action==='accept-cancel'?'Отмена подтверждена обеими сторонами':'Запрос отмены отклонен');tellOther(d,(action==='accept-cancel'?'Сотрудничество отменено: ':'Отмена отклонена: ')+c.name);return {message:action==='accept-cancel'?'Сотрудничество отменено. Данные сохранены':'Сотрудничество продолжается'};}

 if(action==='accept-terms'){assertOK(d.status==='negotiation'&&!t.approved[role],'Условия уже подтверждены.');t.approved[role]=true;activity(d,(role==='advertiser'?'Рекламодатель':'Блогер')+' подтвердил условия');if(t.approved.advertiser&&t.approved.blogger)startDeal(d);return {message:d.status==='active'?'Условия подтверждены обеими сторонами. Можно готовить материал':'Условия подтверждены'};}
 if(action==='decline-terms'){assertOK(d.status==='negotiation','Сотрудничество уже началось.');d.status='declined';if(d.source==='application'){const application=c.request.applications.find(a=>a.personId===d.personId&&a.status==='selected');if(application){application.status='declined';application.reason='terms-declined';}}activity(d,'Условия отклонены');tellOther(d,'Условия отклонены: '+c.name);reconcileRecruitment(c);return {message:'Условия отклонены, место в наборе освобождено'};}
 assertOK(d.status==='active','Сотрудничество не активно.');
 if(action==='confirm-payment'){requireRole('blogger');assertOK(d.payment.status==='sent','Нет отметки оплаты для подтверждения.');d.paymentHistory ||= [];d.paymentHistory.push({...clone(d.payment),archivedAt:now()});d.payment.status='confirmed';d.payment.confirmedAt=now();activity(d,'Блогер подтвердил получение оплаты');tellOther(d,'Получение оплаты подтверждено: '+c.name);return {message:'Получение оплаты подтверждено'};}
 if(action==='dispute-payment'){requireRole('blogger');assertOK(d.payment.status==='sent','Нет отметки оплаты.');d.paymentHistory ||= [];d.paymentHistory.push({...clone(d.payment),archivedAt:now()});d.payment.status='disputed';d.payment.disputedAt=now();activity(d,'Блогер сообщил, что оплата не поступила');tellOther(d,'Блогер не получил оплату: '+c.name);return {message:'Рекламодатель уведомлен'};}
 if(action==='complete-deal'){requireRole('advertiser');assertOK(readyToComplete(d),'Сначала примите все результаты и дождитесь подтверждения оплаты.');d.status='completed';d.completedAt=now();activity(d,'Сотрудничество завершено');tellOther(d,'Сотрудничество завершено: '+c.name);return {message:'Сотрудничество завершено'};}
 throw Error('Действие недоступно.');
}
function commit(run,f){if(!syncBeforeAction())return;const backup=clone(state);try{const result=run()||{};if(!save()){state=backup;return;}if(f)clearFormDraft(f);dirty=false;conflict=false;if(result.path)go(result.path);else render();if(result.message)toast(result.message);}catch(e){state=backup;if(f)fail(f,e.message);else toast(e.message);}}
document.addEventListener('submit',e=>{const f=e.target;if(!f.dataset.form)return;e.preventDefault();if(conflict){showConflict();return;}commit(()=>handleSubmit(f,new FormData(f),e.submitter?.value),f)});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b){if(!e.target.closest('.profile-switch')){$('#role-menu')?.setAttribute('hidden','');$('.account-button')?.setAttribute('aria-expanded','false');}return;}
 const a=b.dataset.action,id=b.dataset.id;
 if(a==='open-issue'){const details=document.querySelector('#deal-issue > details');if(details){details.open=true;details.scrollIntoView({block:'start'});}return;}
 if(a==='gallery-add'){const container=$('#gallery-editor');if(container&&typeof workFields==='function'){const count=container.querySelectorAll('[name^=workTitle]').length;container.insertAdjacentHTML('beforeend',workFields({},count,person(personId)));dirty=true;const f=container.closest('form');if(f)storeFormDraft(f);}return;}
 if(a==='role-menu'){const menu=$('#role-menu');menu.hidden=!menu.hidden;b.setAttribute('aria-expanded',String(!menu.hidden));return;}
 if(a==='switch'){if(dirty){$('#dialog').innerHTML='<h2>Есть несохраненный текст</h2><p>Ввод сохранен в черновике. Можно отправить форму сейчас или вернуться к ней после переключения.</p><div class="actions">'+button('Остаться','close-dialog')+button('Переключить кабинет','confirm-switch',id)+'</div>';$('#dialog').showModal();}else switchRole(id);return;}
 if(a==='close-dialog'){$('#dialog').close();return;}
 if(a==='confirm-switch'){$('#dialog').close();switchRole(id);return;}
 if(a==='reload-state'){try{const next=JSON.parse(localStorage.getItem(STORE));if(next){state=next;normalizeState();}}catch{}conflict=false;render();return;}
 if(a==='retry-save'){if(save()){render();toast('Данные сохранены')}return;}
 if(a==='clear-filters'){filters={q:'',topic:'',platform:''};render();return;}
 if(conflict){showConflict();return;}
 commit(()=>handleAction(a,id));
});
document.addEventListener('input',e=>{
 if(e.target.id==='search'){const pos=e.target.selectionStart;filters.q=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(pos,pos);return;}
 if(e.target.closest('form')){dirty=true;storeFormDraft(e.target.closest('form'));}
});
document.addEventListener('change',e=>{
 if(e.target.name==='filterPlatform'||e.target.name==='filterTopic'){filters[e.target.name==='filterPlatform'?'platform':'topic']=e.target.value;render();return;}
 if(e.target.dataset.compare){const id=+e.target.dataset.compare;if(e.target.checked&&selected.length>=3){e.target.checked=false;toast('Можно сравнить до трех авторов');return;}selected=e.target.checked?[...selected,id]:selected.filter(x=>x!==id);render();return;}
 if(e.target.name==='demoPerson'){personId=+e.target.value;sessionStorage.setItem('tut-v4-person',String(personId));go('overview');render();return;}
 if(e.target.closest('form')){dirty=true;storeFormDraft(e.target.closest('form'));}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('#role-menu')?.setAttribute('hidden','');$('.account-button')?.setAttribute('aria-expanded','false');}});
window.addEventListener('hashchange',()=>{render();window.scrollTo(0,0)});
window.addEventListener('beforeunload',e=>{if(dirty||storageFailed){e.preventDefault();e.returnValue='';}});
window.addEventListener('storage',e=>{if(e.key!==STORE||!e.newValue)return;try{const next=JSON.parse(e.newValue);if(next.revision<=state.revision)return;if(dirty){conflict=true;showConflict();return;}state=next;normalizeState();render();}catch{}});
render();
