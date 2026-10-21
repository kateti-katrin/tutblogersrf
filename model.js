'use strict';
const STORE = 'tutblogery-v4';
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = x => JSON.parse(JSON.stringify(x));
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const today = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date());
const money = n => new Intl.NumberFormat('ru-RU').format(Number(n)||0)+' ₽';
const date = s => s ? new Date(s+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}) : 'Не указана';
const stamp = s => new Date(s).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
function safeUrl(s){try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function initial(){return {version:4,revision:0,people:clone(demoPeople),campaigns:[],deals:[],saved:[],events:[]}}
let state;
try {state=JSON.parse(localStorage.getItem(STORE))||initial(); if(state.version!==4)throw Error('version');} catch {state=initial();}
if(typeof addExamples==='function'&&addExamples(state)){try{state.revision++;localStorage.setItem(STORE,JSON.stringify(state));}catch{}}
for(const p of state.people){if(p.interests===undefined)p.interests=p.topic+', Город, Локальные бренды';if(p.mediaAchievements===undefined)p.mediaAchievements=p.id===7?'Авторская серия коротких видео о городской жизни и локальных брендах. В портфолио — обзоры, репортажи и рекламные интеграции.':'';}
state.company ||= {name:'Линия',industry:'Одежда и аксессуары',description:'Создаем одежду для повседневной жизни. Сотрудничаем с авторами, которые рассказывают о стиле, городе и локальных брендах.',site:'',contact:'Катрин',email:''};
// Example contact details belong to the fictional starter company only.
if(!state.company.contactDetailsVersion){if(state.company.name==='Линия'){state.company.site ||= 'https://example.com';state.company.email ||= 'manager@example.com';state.company.phone ||= '+7 (000) 000-00-00';}state.company.contactDetailsVersion=1;}
// Apply the updated account name to existing local profiles.
const renamedProfile=state.people.find(p=>p.id===7);
if(renamedProfile?.name==='Екатерина Титова'){renamedProfile.name='Катрин';try{localStorage.setItem(STORE,JSON.stringify(state));}catch{}}
let role=sessionStorage.getItem('tut-v4-role')||'advertiser';
let personId=Number(sessionStorage.getItem('tut-v4-person'))||7;
let selected=[], filters={q:'',topic:'',platform:''}, dirty=false, conflict=false, storageFailed=false;
const person = id => state.people.find(p=>p.id===Number(id));
const campaignById = id => state.campaigns.find(c=>c.id===id);
const dealById = id => state.deals.find(d=>d.id===id);
const campaignDeals = c => state.deals.filter(d=>d.campaignId===c.id);
const participating = d => !['declined','cancelled'].includes(d.status);
const reserved = c => campaignDeals(c).filter(participating).length;
const currentTerms = d => d.terms[d.terms.length-1];
const latest = versions => versions[versions.length-1];
const ownDeals = () => state.deals.filter(d=>role==='advertiser'||d.personId===personId);
const canSee = d => d && (role==='advertiser'||d.personId===personId);
function eventFor(target,text,path,id){state.events.unshift({id:uid(),target,personId:id||null,text,path,at:now(),read:false});state.events=state.events.slice(0,200)}
function tellOther(d,text){eventFor(role==='advertiser'?'blogger':'advertiser',text,'deal/'+d.id,d.personId)}
function activity(d,text,kind='completed'){d.history.push({at:now(),role,text,kind})}
function reconcileRecruitment(c){
  if(['completed','cancelled'].includes(c.status)){c.request.status='closed';return;}
  if(c.request.status==='open'&&reserved(c)>=c.request.target){c.request.status='closed';c.request.reason='quota';}
  else if(c.request.status==='closed'&&c.request.reason==='quota'&&reserved(c)<c.request.target){c.request.status='open';c.request.reason='';}
}
function briefTerms(c,p){return {price:p.price,date:c.start,...clone(c.brief),scope:c.brief.deliverables}}
function addTerms(d,terms,by){d.terms.push({...terms,at:now(),by,approved:{advertiser:by==='advertiser',blogger:by==='blogger'}});activity(d,'Предложена версия условий '+d.terms.length)}
function makeDeal(c,p,source,terms){const d={id:uid(),campaignId:c.id,personId:p.id,source,status:'negotiation',terms:[],placements:[],chat:[],history:[],payment:{status:'unmarked'},completedAt:null};addTerms(d,terms,'advertiser');state.deals.push(d);if(!c.shortlist.includes(p.id))c.shortlist.push(p.id);reconcileRecruitment(c);eventFor('blogger','Подтвердите условия: '+c.name,'deal/'+d.id,p.id);return d}
function startDeal(d){d.status='active';d.placements=Array.from({length:currentTerms(d).qty},(_,i)=>({id:uid(),number:i+1,plannedDate:currentTerms(d).date,scriptVersions:[],finalVersions:[],publication:null,publicationHistory:[],statsVersions:[],mark:null}));activity(d,'Обе стороны подтвердили условия. Началась подготовка');tellOther(d,'Условия подтверждены: '+campaignById(d.campaignId).name);reconcileRecruitment(campaignById(d.campaignId));}
function placementStatus(p,d){
 const advertiser=role==='advertiser',st=latest(p.statsVersions),f=latest(p.finalVersions),s=latest(p.scriptVersions);
 if(d.status==='completed')return 'Завершено';
 if(d.status==='cancelled')return 'Отменено';
 if(p.publication?.status==='revision')return advertiser?'Ждем исправления публикации':'Исправить публикацию';
 if(p.publication?.status==='submitted')return advertiser?'Проверить публикацию':'Ждем проверки публикации';
 if(st?.status==='approved')return 'Результат принят';
 if(st?.status==='revision')return advertiser?'Ждем уточнения статистики':'Уточнить статистику';
 if(st?.status==='submitted')return advertiser?'Проверить статистику':'Ждем проверки статистики';
 if(p.publication?.status==='approved')return statsDue(p,d)>today()?'Статистика '+date(statsDue(p,d)):advertiser?'Ждем статистику':'Добавить статистику';
 if(f?.status==='approved')return advertiser?'Ждем ссылку на публикацию':'Добавить ссылку';
 if(f?.status==='submitted')return advertiser?'Проверить материал':'Ждем согласования материала';
 if(f?.status==='revision')return advertiser?'Ждем исправления материала':'Исправить материал';
 if(currentTerms(d).script&&s?.status!=='approved')return s?.status==='submitted'?(advertiser?'Проверить сценарий':'Ждем согласования сценария'):s?.status==='revision'?(advertiser?'Ждем исправления сценария':'Исправить сценарий'):(advertiser?'Ждем сценарий':'Подготовить сценарий');
 return advertiser?'Ждем готовый материал':'Подготовить материал';
}
function dealStatus(d){if(d.status==='active'&&d.issues?.some(i=>i.status==='open'))return 'Открыт вопрос';if(d.status==='active'&&d.placements.length&&d.placements.every(p=>p.publication?.status==='approved'&&latest(p.statsVersions)?.status==='approved'))return d.payment.status==='confirmed'?(readyToComplete(d)?'Можно завершить':'Работы приняты'):'Работы приняты · Ожидается оплата';if(d.status==='negotiation')return currentTerms(d).approved.advertiser?'Ждем блогера':'Ждем рекламодателя';return {completed:'Завершено',declined:'Условия отклонены',cancelled:'Отменено',active:'В работе'}[d.status]||d.status}
function readyToComplete(d){return d.status==='active'&&!d.pendingTerms&&d.cancelRequest?.status!=='pending'&&!d.issues?.some(i=>i.status==='open')&&d.placements.length>0&&d.placements.every(p=>p.publication?.status==='approved'&&latest(p.statsVersions)?.status==='approved')&&d.payment.status==='confirmed'}
function addDays(day,n){if(!day)return '';const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+Number(n));return d.toISOString().slice(0,10)}
function statsDue(p,d){return addDays(p.publication?.date,currentTerms(d).statsDays)}
function deadlineState(day){return !day?'unscheduled':day<today()?'overdue':day===today()?'today':'later'}
function deadlineLabel(day){return !day?'Срок не согласован':deadlineState(day)==='overdue'?'Просрочено · '+date(day):deadlineState(day)==='today'?'Сегодня':date(day)}
function placementDue(p,d,stage){const t=currentTerms(d);return stage==='script'?(p.scriptDue||t.scriptDue||''):stage==='final'?(p.finalDue||t.finalDue||''):stage==='review'?(p.reviewDue||t.reviewDue||''):stage==='publication'?(p.plannedDate||t.date):stage==='stats'?statsDue(p,d):''}
function taskEntry(text,sub,path,due='',extra={}){return {text,sub,path,due,timing:deadlineState(due),...extra}}
function tasks(){const rows=[];
 if(role==='advertiser')for(const c of state.campaigns.filter(c=>c.status==='active'))for(const a of c.request.applications.filter(a=>a.status==='pending'))rows.push(taskEntry('Рассмотреть отклик',c.name+' · '+person(a.personId).name,'campaign/'+c.id+'/request'));
 for(const d of ownDeals()){
 const c=campaignById(d.campaignId),t=currentTerms(d),sub=c.name+' · '+(role==='advertiser'?person(d.personId).name:(c.brand||'Рекламодатель')),base={dealId:d.id};
 const push=(text,path='deal/'+d.id,due='',extra={})=>rows.push(taskEntry(text,sub,path,due,{...base,...extra}));
 if(d.status==='negotiation'&&!t.approved[role])push('Подтвердить условия');
 if(d.status!=='active')continue;
 if(d.issues?.some(i=>i.status==='open'&&i.by===role))push('Проверить открытый вопрос','deal/'+d.id+'/chat');
 if(d.pendingTerms&&!d.pendingTerms.approved[role])push('Рассмотреть изменение условий');
 if(d.cancelRequest?.status==='pending'&&d.cancelRequest.by!==role)push('Рассмотреть запрос отмены');
 for(const p of d.placements){const s=latest(p.scriptVersions),f=latest(p.finalVersions),st=latest(p.statsVersions);let text='',stage='',review=false;
 if(role==='advertiser'){if(s?.status==='submitted'){text='Проверить сценарий';stage='script';review=true}else if(f?.status==='submitted'){text='Проверить материал';stage='final';review=true}else if(p.publication?.status==='submitted'){text='Проверить публикацию';stage='publication';review=true}else if(st?.status==='submitted'){text='Проверить статистику';stage='stats';review=true}}
 else {if(t.script&&(!s||s.status==='revision')){text=s?'Исправить сценарий':'Подготовить сценарий';stage='script'}else if((!t.script||s?.status==='approved')&&(!f||f.status==='revision')){text=f?'Исправить материал':'Подготовить материал';stage='final'}else if(f?.status==='approved'&&(!p.publication||p.publication.status==='revision')){text=p.publication?'Исправить публикацию':'Добавить ссылку';stage='publication'}else if(p.publication?.status==='approved'&&(!st||st.status==='revision')&&(st?.status==='revision'||statsDue(p,d)<=today())){text=st?'Уточнить статистику':'Добавить статистику';stage='stats'}}
 if(text)rows.push(taskEntry(text,sub+' · Размещение '+p.number,'deal/'+d.id+'/placement/'+p.id,placementDue(p,d,review?'review':stage),{dealId:d.id,placementId:p.id,placementNumber:p.number,stage}));
 }
 if(role==='blogger'&&d.payment.status==='sent')push('Подтвердить оплату','deal/'+d.id+'/payment');
 if(role==='advertiser'&&d.payment.status==='disputed')push('Уточнить оплату','deal/'+d.id+'/payment');
 if(role==='advertiser'&&d.payment.status==='unmarked'&&(t.paymentMode==='prepay'||t.paymentDue||d.placements.some(p=>p.publication?.status==='approved')))push('Отметить оплату','deal/'+d.id+'/payment',t.paymentDue||'');
 if(role==='advertiser'&&readyToComplete(d))push('Завершить сотрудничество');
 }
 return rows.sort((a,b)=>({overdue:0,today:1,unscheduled:2,later:3}[a.timing]-{overdue:0,today:1,unscheduled:2,later:3}[b.timing])||(a.due||'').localeCompare(b.due||''));
}
function waitingItems(){const rows=[],ts=tasks();
 for(const d of ownDeals().filter(d=>['active','negotiation'].includes(d.status))){const c=campaignById(d.campaignId),sub=c.name,has=(pid)=>ts.some(t=>t.dealId===d.id&&t.placementId===pid),push=(text,due='',p=null)=>rows.push(taskEntry(text,sub,'deal/'+d.id+(p?'/placement/'+p.id:''),due,{dealId:d.id,placementId:p?.id}));
 if(d.status==='negotiation'&&currentTerms(d).approved[role])push(dealStatus(d));
 if(d.pendingTerms?.approved[role])push('Ждем подтверждения новых условий');
 if(d.cancelRequest?.status==='pending'&&d.cancelRequest.by===role)push('Ждем ответа на запрос отмены');
 if(d.status!=='active')continue;
 if(d.issues?.some(i=>i.status==='open'&&i.by!==role))push('Открыт вопрос по сотрудничеству');
 for(const p of d.placements){if(has(p.id)||latest(p.statsVersions)?.status==='approved')continue;const future=p.publication?.status==='approved'&&!latest(p.statsVersions)&&statsDue(p,d)>today(),t=currentTerms(d),stage=role==='blogger'?'review':t.script&&latest(p.scriptVersions)?.status!=='approved'?'script':latest(p.finalVersions)?.status!=='approved'?'final':p.publication?.status!=='approved'?'publication':'stats';push(future?'Статистика будет нужна '+date(statsDue(p,d)):placementStatus(p,d),future?statsDue(p,d):placementDue(p,d,stage),p)}
 if(d.payment.status==='sent'&&role==='advertiser')push('Ждем подтверждения получения оплаты');
 if(d.payment.status==='unmarked'&&role==='blogger'&&(currentTerms(d).paymentMode==='prepay'||currentTerms(d).paymentDue||d.placements.some(p=>p.publication?.status==='approved')))push('Ждем отметку оплаты рекламодателем',currentTerms(d).paymentDue||'');
 if(role==='blogger'&&readyToComplete(d))push('Ждем завершения рекламодателем');
 }
 if(role==='blogger')for(const c of state.campaigns)for(const a of c.request.applications.filter(a=>a.personId===personId&&a.status==='pending'))rows.push(taskEntry('Отклик на рассмотрении',c.name,'requests/'+c.id));
 return rows;
}
function completedToday(){return ownDeals().flatMap(d=>(d.history||[]).filter(h=>h.role===role&&new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date(h.at))===today()&&(h.kind==='completed'||(!h.kind&&/отправлен|согласован|подтвердил|принят|завершен|добавлен|отмечена/i.test(h.text)))).map(h=>({...h,path:'deal/'+d.id,dealId:d.id}))).sort((a,b)=>b.at.localeCompare(a.at))}
function normalizeState(){for(const d of state.deals){d.paymentHistory ||= [];d.issues ||= [];d.changeHistory ||= [];for(const p of d.placements){p.plannedDate ||= currentTerms(d).date;p.publicationHistory ||= []}}}
normalizeState();
function save(){normalizeState();try{state.revision++;localStorage.setItem(STORE,JSON.stringify(state));storageFailed=false;return true}catch{storageFailed=true;toast('Не удалось сохранить данные в браузере. Освободите место и повторите сохранение.');return false}}
function syncBeforeAction(){try{const next=JSON.parse(localStorage.getItem(STORE));if(next&&next.revision>state.revision){if(dirty){conflict=true;showConflict();return false}state=next;normalizeState();}}catch{}return true}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4000)}
function fail(f,text){let e=f.querySelector('.form-error');if(!e){e=document.createElement('p');e.className='form-error';e.setAttribute('role','alert');f.prepend(e)}e.textContent=text;e.tabIndex=-1;e.focus();return false}
function assertOK(condition,message){if(!condition)throw Error(message)}
function validateTerms(t,c){assertOK(t.price>0&&Number.isFinite(t.price),'Укажите стоимость больше нуля.');assertOK(t.date>=c.start&&t.date<=c.end,'Дата публикации должна попадать в сроки кампании.');assertOK(t.qty>=1&&t.qty<=10&&Number.isInteger(t.qty),'Укажите от 1 до 10 размещений.');assertOK(t.scope.trim()&&t.payment.trim(),'Опишите состав работ и порядок оплаты.');for(const k of ['scriptDue','finalDue','reviewDue','paymentDue'])assertOK(!t[k]||/^\d{4}-\d{2}-\d{2}$/.test(t[k]),'Проверьте дату этапа.');assertOK(!t.scriptDue||!t.finalDue||t.scriptDue<=t.finalDue,'Сценарий должен быть готов не позднее материала.');assertOK(!t.finalDue||t.finalDue<=t.date,'Материал должен быть готов не позднее публикации.');assertOK(!t.scriptDue||t.scriptDue<=t.date,'Сценарий должен быть готов не позднее публикации.');assertOK(!t.duration||(t.duration>0&&t.duration<=3600),'Длительность: от 1 до 3600 секунд.');assertOK(!t.refs||t.refs.split(/\n/).filter(x=>x.trim()).every(x=>safeUrl(x.trim())),'Референсы: укажите ссылки http или https, по одной в строке.');assertOK(t.statsDays>=1&&t.statsDays<=90,'Срок статистики: от 1 до 90 дней.');}
