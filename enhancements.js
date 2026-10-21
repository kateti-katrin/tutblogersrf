'use strict';
// Interface typography changes text nodes only; saved content remains intact.
function applyTypography(root){
 if(!root)return;
 syncVideoFields(root);
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walk.nextNode())){
  if(node.parentElement?.closest('textarea,input,select,script,style,[contenteditable]'))continue;
  const original=node.nodeValue;
  const next=original.replace(/ё/g,'е').replace(/Ё/g,'Е')
   .replace(/(^|[\s(«])((?:[ВвКкСсУуОоИиАа]|[Вв]о|[Нн]а|[Пп]о|[Ии]з|[Зз]а|[Дд]о|[Оо]т|[Нн]е|[Нн]о|[Кк]о|[Сс]о|[Бб]ез|[Дд]ля|[Пп]ри)) +(?=\S)/g,'$1$2\u00a0')
   .replace(/(\d) +(?=₽|%|сек\.|мин\.|дней|дня|размещ\.)/g,'$1\u00a0');
  if(next!==original)node.nodeValue=next;
 }
}
const TEAM_MESSAGE_AT='2026-10-21T09:00:00.000Z';
const TEAM_MESSAGE_TEXT='Привет! Обновили рабочий кабинет: задачи собраны на главной, а в условиях теперь можно указать формат видео и референсы. Если возникнет вопрос, напишите нам здесь.';
function messageAccount(){return role+':'+(role==='blogger'?personId:'company')}
function conversationRows(){const read=state.messageRead?.[messageAccount()]||{},replies=state.teamReplies?.[messageAccount()]||[],last=replies.at(-1);return [{id:'team',name:'Команда ТУТБЛОГЕРЫ.РФ',context:'',preview:last?'Вы: '+last.text:TEAM_MESSAGE_TEXT,at:last?.at||TEAM_MESSAGE_AT,path:'team',incoming:1,unread:read.team>=TEAM_MESSAGE_AT?0:1},...ownDeals().slice().sort((a,b)=>(b.chat.at(-1)?.at||'').localeCompare(a.chat.at(-1)?.at||'')).map(d=>{const c=campaignById(d.campaignId),last=d.chat.at(-1),incoming=d.chat.filter(m=>m.role!==role);return {id:d.id,name:role==='blogger'?c.brand||'Рекламодатель':person(d.personId).name,context:c.name,preview:last?(last.role===role?'Вы: ':'')+last.text:'Сообщений пока нет',at:last?.at||currentTerms(d).at,path:'deal/'+d.id+'/chat',incoming:incoming.length,unread:incoming.filter(m=>m.at>(read[d.id]||'')).length}})];}
function markConversationRead(id){if(!syncBeforeAction())return;const row=conversationRows().find(x=>x.id===id);if(!row?.unread)return;state.messageRead ||= {};state.messageRead[messageAccount()] ||= {};state.messageRead[messageAccount()][id]=now();save();}
function teamView(){const replies=state.teamReplies?.[messageAccount()]||[];return head('Команда ТУТБЛОГЕРЫ.РФ','Закрепленный диалог',link('Все сообщения','messages','button'))+`<div class="team-dialog"><div class="chat"><div class="chat-history"><div class="bubble"><strong>Команда ТУТБЛОГЕРЫ.РФ</strong><img class="team-chat-image" src="assets/news-wallpaper.png" alt="" width="540" height="220"><p>${TEAM_MESSAGE_TEXT}</p><small>${stamp(TEAM_MESSAGE_AT)}</small></div>${replies.map(m=>`<div class="bubble mine"><strong>Вы</strong><p>${esc(m.text)}</p><small>${stamp(m.at)}</small></div>`).join('')}</div>${form('team-chat','',area('Сообщение','text','','required maxlength="2000"')+submit('Отправить'))}<p class="muted">Сообщения сохраняются в этом браузере.</p></div></div>`}

let detailReturnFocus=null;
document.addEventListener('click',e=>{
 const target=e.target.closest('[data-action="deal-details"]');if(!target)return;
 e.preventDefault();e.stopImmediatePropagation();
 const [id,kind]=target.dataset.id.split(':'),d=dealById(id);if(!canSee(d))return;
 const t=kind==='pending'?d.pendingTerms:currentTerms(d);if(!t)return;
 detailReturnFocus=target;const dialog=$('#dialog');dialog.className='terms-dialog';
 dialog.innerHTML=`<div class="dialog-heading"><h2 id="terms-dialog-title">${kind==='pending'?'Предложенные условия':'Условия сотрудничества'}</h2>${button('Закрыть','close-dialog')}</div>${termsSummary(t)}`;
 dialog.setAttribute('aria-labelledby','terms-dialog-title');applyTypography(dialog);dialog.showModal();
},true);
document.addEventListener('DOMContentLoaded',()=>{
 const dialog=$('#dialog');dialog.addEventListener('close',()=>{dialog.className='';detailReturnFocus?.focus();detailReturnFocus=null;});
 applyTypography($('#main'));applyTypography($('#sidebar'));
});
function syncVideoFields(root){for(const f of root?.querySelectorAll('form')||[]){const format=f.querySelector('[name="format"]');if(!format)continue;for(const group of f.querySelectorAll('.video-fields')){group.hidden=format.value!=='Видео';for(const control of group.querySelectorAll('input,select'))control.disabled=group.hidden;}}}
document.addEventListener('change',e=>{if(e.target.name==='format')syncVideoFields(e.target.closest('form')?.parentElement);});

document.addEventListener('click',e=>{if(!e.target.closest('[data-action="read-conversations"]'))return;e.preventDefault();e.stopImmediatePropagation();commit(()=>{for(const row of conversationRows()){state.messageRead ||= {};state.messageRead[messageAccount()] ||= {};state.messageRead[messageAccount()][row.id]=now();}return {message:'Входящие сообщения отмечены прочитанными'};});},true);
document.addEventListener('submit',e=>{const f=e.target;if(f.dataset.form!=='team-chat')return;e.preventDefault();e.stopImmediatePropagation();commit(()=>{const text=new FormData(f).get('text').trim();assertOK(text,'Введите сообщение.');state.teamReplies ||= {};state.teamReplies[messageAccount()] ||= [];state.teamReplies[messageAccount()].push({text,at:now()});return {message:'Сообщение сохранено в прототипе'};},f);},true);
// Media stays in IndexedDB; only stable IDs are saved with the profile.
function videoStore(action,key,value){return new Promise((resolve,reject)=>{const request=indexedDB.open('tutblogery-videos-v1',1);request.onupgradeneeded=()=>request.result.createObjectStore('videos');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('videos',action==='get'?'readonly':'readwrite'),store=tx.objectStore('videos'),op=action==='get'?store.get(key):action==='put'?store.put(value,key):store.delete(key);let result;op.onsuccess=()=>{result=op.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onerror=()=>{db.close();reject(tx.error)};};});}
const localVideoURLs=new Map();
async function hydrateCompanyVideos(root){const nodes=[...root.querySelectorAll('video[data-local-video]')];for(const video of nodes){const id=video.dataset.localVideo,status=root.querySelector(`[data-video-status="${CSS.escape(id)}"]`);try{let url=localVideoURLs.get(id);if(!url){const blob=await videoStore('get',id);if(!blob)throw Error('Файл недоступен в этом браузере. Добавьте видео повторно.');url=URL.createObjectURL(blob);localVideoURLs.set(id,url);}if(!video.isConnected)continue;video.src=url;if(status)status.hidden=true;video.addEventListener('error',()=>{if(status){status.hidden=false;status.textContent='Не удалось воспроизвести файл. Попробуйте MP4 с кодеком H.264.';}},{once:true});}catch(e){if(status){status.hidden=false;status.textContent=e.message||'Не удалось открыть видео.';}}}}
document.addEventListener('submit',async e=>{const f=e.target;if(f.dataset.form!=='company-work')return;e.preventDefault();e.stopImmediatePropagation();const fd=new FormData(f),file=fd.get('videoFile');if(!file?.size){fail(f,'Выберите видеофайл.');return;}if(!['video/mp4','video/webm'].includes(file.type)){fail(f,'Выберите видео в формате MP4 или WebM.');return;}if(file.size>100*1024*1024){fail(f,'Видео больше 100 МБ. Выберите файл меньшего размера.');return;}if(!syncBeforeAction())return;const source=companyWorkSources().find(w=>w.id===fd.get('source'));if(!(fd.get('title')?.trim()||source?.title)||!(fd.get('author')?.trim()||source?.author)){fail(f,'Укажите название и блогера или выберите сотрудничество.');return;}const submit=f.querySelector('button[type="submit"],button:not([type])');if(submit){submit.disabled=true;submit.textContent='Сохраняем…';}const id=uid();try{await videoStore('put',id,file);fd.set('mediaId',id);commit(()=>handleSubmit(f,fd),f);if(!companyWorkItems().some(w=>w.mediaId===id))await videoStore('delete',id);}catch(error){fail(f,'Не удалось сохранить видео в браузере. Проверьте свободное место и повторите.');}finally{if(submit?.isConnected){submit.disabled=false;submit.textContent='Добавить в профиль';}}},true);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action="remove-company-video"]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();commit(()=>{requireRole('advertiser');state.company.works=companyWorkItems().filter(w=>w.id!==b.dataset.id);return {message:'Видео убрано из профиля'};});},true);
