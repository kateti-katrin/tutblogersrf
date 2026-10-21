'use strict';

// Additive, repeat-safe examples. This file has no dependency on initialized UI globals.
function addExamples(state) {
  const version = 3;
  if (state.examplesVersion >= version) return false;
  const anchor = new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow'}).format(new Date());
  const date = offset => {
    const d = new Date(anchor + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString().slice(0, 10);
  };
  const at = (offset, hour = 10) => date(offset) + 'T' + String(hour).padStart(2,'0') + ':00:00.000Z';
  const url = (type, id) => 'https://example.com/' + type + '/' + id;
  const append = (list, item) => { if (!list.some(x => x.id === item.id)) list.push(item); };
  state.campaigns ||= []; state.deals ||= []; state.events ||= []; state.saved ||= [];

  const specs = [
    ['wardrobe','Осенняя капсула','Линия','Три образа из новой коллекции: работа, прогулка, встреча. Показать посадку и фактуру ткани.','Женщины 25–34 · Москва','VK','Видео',80000,3,'open',-3,20],
    ['coffee','Утро в городе','Зерно','Познакомить с сезонным меню кофейни через личный утренний маршрут.','Мужчины и женщины 25–34 · Москва','VK','Видео',65000,3,'open',-8,14],
    ['care','Уход без спешки','Тихо','Показать вечерний уход и объяснить порядок использования двух средств.','Женщины 25–44 · Россия','VK','Видео',70000,2,'closed',-12,12],
    ['weekend','Выходные рядом','Рядом','Рассказать о двухдневном маршруте: дорога, проживание и три места для прогулки.','Мужчины и женщины 25–44 · Москва','VK','Видео',45000,1,'closed',-14,8],
    ['home','Дом в деталях','Форма','Показать, как настольный светильник меняет рабочее место вечером.','Мужчины и женщины 25–44 · Россия','VK','Видео',35000,1,'closed',-20,5],
    ['city','Город пешком','Шаг','Поделиться прогулочным маршрутом и опытом использования городской сумки.','Женщины 25–34 · Москва','VK','Пост',30000,1,'closed',-25,3],
    ['books','Месяц новых историй','Лист','Рассказать о личной подборке книг и пригласить читателей поделиться своей.','Мужчины и женщины 25–44 · Россия','VK','Пост',60000,2,'closed',-45,-3],
    ['studio','Место для своих идей','Среда','Познакомить аудиторию с пространством для работы и творческих встреч.','Мужчины и женщины 25–34 · Москва','Telegram','Пост',60000,3,'open',0,30]
  ];
  const campaigns = {};
  specs.forEach(([slug,name,brand,product,audience,platform,format,budget,target,status,start,end]) => {
    const id='ex-campaign-'+slug;
    const c={id,name,brand,site:url('brands',slug),product,audience,budget,start:date(start),end:date(end),status:slug==='books'?'completed':'active',shortlist:[],brief:{platform,format,qty:1,priceMin:10000,priceMax:25000,deliverables:format==='Видео'?'Одно вертикальное видео до 60 секунд: личный опыт, продукт в использовании, крупные планы деталей.':'Один авторский пост до 2000 знаков с 3–5 фотографиями и ссылкой на продукт.',requirements:'Сохранить авторскую подачу. Показать продукт в реальном использовании, согласовать материал до публикации.',provides:'Продукт для съемки, описание характеристик и ссылка для публикации.',payment:'Оплата в течение 5 рабочих дней после приемки публикации.',script:true,statsDays:7},request:{status,reason:status==='closed'?'quota':'',target,applications:[]}};
    append(state.campaigns,c); campaigns[slug]=state.campaigns.find(x=>x.id===id);
  });

  const stageInfo = {
    negotiation:['Подтвердите условия','blogger'],
    'script-submitted':['Проверьте сценарий','advertiser'],
    'script-revision':['Нужны правки к сценарию','blogger'],
    'final-preparation':['Сценарий согласован: подготовьте материал','blogger'],
    'final-submitted':['Проверьте готовый материал','advertiser'],
    'publication-submitted':['Проверьте публикацию','advertiser'],
    'stats-submitted':['Проверьте статистику','advertiser'],
    'stats-revision':['Уточните статистику','blogger'],
    'payment-sent':['Подтвердите получение оплаты','blogger'],
    completed:['Сотрудничество завершено','blogger']
  };
  const deals = [
    ['wardrobe',7,'negotiation',18000,6],['wardrobe',1,'script-submitted',22000,8],
    ['coffee',7,'script-revision',17000,4],['coffee',5,'final-preparation',19000,5],
    ['care',7,'final-submitted',20000,2],['care',3,'stats-revision',23000,-10],
    ['weekend',7,'publication-submitted',24000,-1],
    ['home',7,'stats-submitted',18000,-9],
    ['city',7,'payment-sent',16000,-12],
    ['books',7,'completed',15000,-21],['books',2,'completed',17000,-20],
    ['studio',4,'negotiation',14000,10]
  ];
  deals.forEach(([slug,personId,stage,price,pubOffset],i) => {
    const c=campaigns[slug], id='ex-deal-'+slug+'-'+personId;
    if(state.deals.some(d=>d.id===id))return;
    const termsOffset=Math.min(-14,pubOffset-16),scriptOffset=Math.min(-12,pubOffset-12);
    const platform=personId===2||personId===4?'Telegram':c.brief.platform;
    const format=platform==='Telegram'?'Пост':c.brief.format;
    const term={price,date:date(pubOffset),platform,format,qty:1,scope:format==='Видео'?'Одно видео до 60 секунд: сюжет, съемка, монтаж, публикация и статистика через 7 дней.':'Один авторский пост с 3–5 фотографиями, ссылка на продукт и статистика через 7 дней.',payment:c.brief.payment,statsDays:7,script:true,at:at(termsOffset),by:'advertiser',approved:{advertiser:true,blogger:stage!=='negotiation'}};
    const d={id,campaignId:c.id,personId,source:i%2?'application':'invitation',status:stage==='negotiation'?'negotiation':stage==='completed'?'completed':'active',terms:[term],placements:[],chat:[{role:'advertiser',text:'Здравствуйте! Приглашаем в кампанию «'+c.name+'». В брифе — задача и состав работ. Будем рады вашей авторской подаче.',at:at(termsOffset-1)},{role:'blogger',text:'Спасибо, задача понятна. Сохраню привычную подачу и покажу продукт в повседневной ситуации. Условия и материалы будем согласовывать здесь.',at:at(termsOffset,12)}],history:[{at:at(termsOffset-1),role:'advertiser',text:'Отправлены условия сотрудничества'}],payment:{status:'unmarked'},completedAt:stage==='completed'?at(-3):null};
    if(stage!=='negotiation'){
      d.history.push({at:at(termsOffset+1),role:'blogger',text:'Обе стороны подтвердили условия. Началась подготовка'});
      const p={id:'ex-placement-'+slug+'-'+personId,number:1,scriptVersions:[],finalVersions:[],publication:null,publicationHistory:[],statsVersions:[],mark:null};
      const material=(kind,status,offset,feedback='')=>({id:id+'-'+kind+'-1',text:kind==='script'?'Начинаю с личной ситуации, показываю продукт в использовании, затем детали и вывод. '+c.product:'Готовый '+format.toLowerCase()+': личная история, продукт в использовании и детали. Ссылка и упоминание бренда добавлены.',url:kind==='script'?'':url('materials',id),status,at:at(offset),feedback,...(status!=='submitted'?{reviewedAt:at(offset+1)}:{})});
      p.scriptVersions.push(material('script',stage==='script-submitted'?'submitted':stage==='script-revision'?'revision':'approved',scriptOffset,stage==='script-revision'?'Добавьте крупный план продукта и уберите общие обещания. Остальной сюжет подходит.':''));
      if(!['script-submitted','script-revision','final-preparation'].includes(stage)){
        p.finalVersions.push(material('final',stage==='final-submitted'?'submitted':'approved',Math.min(-10,pubOffset-2)));
      }
      if(['publication-submitted','stats-submitted','stats-revision','payment-sent','completed'].includes(stage)){
        p.mark={erid:'EX-'+slug.toUpperCase()+'-'+personId,advertiser:c.brand,at:at(pubOffset-1)};
        p.publication={url:url('posts',id),date:date(pubOffset),status:stage==='publication-submitted'?'submitted':'approved',at:at(pubOffset),feedback:'',...(stage!=='publication-submitted'?{reviewedAt:at(pubOffset)}:{})};
      }
      if(['stats-submitted','stats-revision','payment-sent','completed'].includes(stage)){
        const endOffset=Math.min(-1,pubOffset+7),status=stage==='stats-submitted'?'submitted':stage==='stats-revision'?'revision':'approved';
        p.statsVersions.push({views:7200+i*860,reactions:310+i*37,from:date(pubOffset),to:date(endOffset),collected:date(endOffset),source:url('statistics',id),at:at(endOffset),status,feedback:status==='revision'?'На скриншоте не виден период. Добавьте полную статистику с датами.':'',...(status!=='submitted'?{reviewedAt:at(endOffset)}:{})});
      }
      if(['payment-sent','completed'].includes(stage))d.payment={status:stage==='completed'?'confirmed':'sent',date:date(-3),reference:'Оплата по сотрудничеству «'+c.name+'»',at:at(-3),...(stage==='completed'?{confirmedAt:at(-3,14)}:{})};
      d.placements.push(p);
      if(stage==='script-revision')d.chat.push({role:'advertiser',text:'Комментарий к сценарию оставили в разделе материала. После правок отправьте новую версию.',at:at(-1)});
      if(stage==='payment-sent')d.chat.push({role:'advertiser',text:'Оплату отправили напрямую. Подтвердите, пожалуйста, получение в разделе оплаты.',at:at(-1)});
      if(stage==='completed')d.history.push({at:at(-3,15),role:'advertiser',text:'Все размещения и статистика приняты, получение оплаты подтверждено. Сотрудничество завершено'});
    }
    state.deals.push(d);
    if(!c.shortlist.includes(personId))c.shortlist.push(personId);
    if(d.source==='application')append(c.request.applications,{id:'ex-application-selected-'+slug+'-'+personId,personId,status:'selected',at:at(termsOffset-1),text:'Предлагаю авторский материал под вашу задачу. Моя аудитория соответствует брифу.',scope:term.scope,price,date:term.date});
    const [action,target]=stageInfo[stage];
    append(state.events,{id:'ex-event-'+stage+'-'+slug+'-'+personId,target,personId,text:action+': '+c.name,path:'deal/'+id,at:at(-1),read:false});
    append(state.events,{id:'ex-event-start-'+slug+'-'+personId,target:target==='blogger'?'advertiser':'blogger',personId,text:'Условия сотрудничества: '+c.name,path:'deal/'+id,at:at(termsOffset+1),read:true});
  });

  [['wardrobe',3],['coffee',6],['studio',1],['studio',7]].forEach(([slug,personId],i)=>{
    const c=campaigns[slug],id='ex-application-pending-'+slug+'-'+personId;
    append(c.request.applications,{id,personId,status:'pending',at:at(-1,9+i),text:'Мне близка задача кампании. Предлагаю показать продукт через личный опыт и практические детали.',scope:c.brief.deliverables,price:15000+i*1000,date:date(7+i)});
    append(state.events,{id:'ex-event-application-'+slug+'-'+personId,target:'advertiser',personId,text:'Новый отклик: '+(state.people.find(p=>p.id===personId)?.name||'Блогер')+' · '+c.name,path:'campaign/'+c.id+'/request',at:at(-1,9+i),read:false});
  });

  const profiles={
    1:['Видео с примеркой и деталями посадки, пост с 5 фотографиями','Три способа носить одну рубашку: повседневный, рабочий и вечерний образ. Показываю посадку в движении и фактуру ткани.'],
    2:['Авторский пост до 2500 знаков, подборка из 5 мест','Городской маршрут на выходные: небольшой книжный, кофейня и прогулка по тихим улицам. Делюсь личными наблюдениями и полезными деталями.'],
    3:['Видео о ежедневном уходе, пост с разбором состава','Вечерняя рутина из трех шагов: текстуры средств, порядок нанесения и ощущения от использования. Без обещаний лечебного эффекта.'],
    4:['Пост с обзором места или предмета, фотоподборка','Обзор небольшого рабочего пространства: свет, мебель и детали, которые помогают сосредоточиться. Показываю пространство со стороны посетителя.'],
    5:['Видео с подборкой образов, пост о локальном бренде','Капсула на пять рабочих дней: семь вещей и варианты сочетаний. Показываю детали кроя и объясняю выбор.'],
    6:['Пост о личном опыте ухода, обзор с фотографиями','Как я выбираю базовый уход в поездку: компактный набор, привычные текстуры и удобство упаковки.'],
    7:['Видео до 60 секунд, авторский пост с 3–5 фотографиями','Один день в городе: утренняя прогулка, любимое место для работы и вещи, которыми пользуюсь каждый день. Продукт появляется внутри привычного маршрута.']
  };
  const oldText='Три повседневных образа: показываю сочетания вещей, посадку и детали. Демонстрационный пример работы.';
  (state.people||[]).forEach(p=>{
    const detail=profiles[p.id];if(!detail)return;
    if(!p.portfolioText||p.portfolioText===oldText)p.portfolioText=detail[1];
    if(!p.formats||['Видео до 60 секунд, пост с фотографиями','Пост с фотографиями'].includes(p.formats))p.formats=detail[0];
    if(!p.availability||p.availability==='Готова обсудить проекты на ноябрь')p.availability='Открыт'+([1,3,5,6,7].includes(p.id)?'а':'')+' к проектам с '+date(2).split('-').reverse().join('.')+'; дату согласуем в условиях.';
  });
  [1,3,7].forEach(id=>{if(!state.saved.includes(id))state.saved.push(id);});
  // Extend only the named fictional fixtures; preserve user-created records and existing field values.
  const shift=(day,n)=>{const x=new Date(day+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
  const workingDays=(day,n)=>{let x=day;while(n){x=shift(x,1);const weekday=new Date(x+'T12:00:00Z').getUTCDay();if(weekday!==0&&weekday!==6)n--;}return x};
  for(const d of state.deals.filter(d=>d.id.startsWith('ex-deal-')&&d.terms.length===1)){
    const t=d.terms[0],p=d.placements[0];
    if(t.format==='Видео'){t.orientation ||= 'vertical';t.duration ||= 60;t.scope=t.scope.replace('Одно видео до 60 секунд','Одно вертикальное видео до 60 секунд');}
    t.scope=t.scope.replace(/ и статистика через 7 дней/g,'');
    t.scriptDue ||= shift(t.date,-4);t.finalDue ||= shift(t.date,-2);t.paymentMode ||= 'postpay';
    if(p?.publication?.status==='approved')t.paymentDue ||= workingDays(p.publication.date,5);
    const submitted=p?.statsVersions.at(-1)?.status==='submitted'?p.statsVersions.at(-1):p?.publication?.status==='submitted'?p.publication:p?.finalVersions.at(-1)?.status==='submitted'?p.finalVersions.at(-1):p?.scriptVersions.at(-1)?.status==='submitted'?p.scriptVersions.at(-1):null;
    if(submitted)t.reviewDue ||= shift(submitted.at.slice(0,10),1);
  }
  // One overdue sample campaign; all other unfinished sample stages are on time.
  for(const d of state.deals.filter(d=>d.id.startsWith('ex-deal-')&&d.campaignId!=='ex-campaign-care'&&d.status==='active')){
    const t=d.terms.at(-1);
    if(t.paymentDue&&t.paymentDue<anchor&&d.payment.status!=='confirmed')t.paymentDue=anchor;
    for(const p of d.placements){
      const script=p.scriptVersions.at(-1),final=p.finalVersions.at(-1),stats=p.statsVersions.at(-1);
      if(!p.publication){t.date=date(2);p.plannedDate=date(2);}
      if(t.script&&script?.status!=='approved'){t.scriptDue=anchor;p.scriptDue=anchor;}
      if(final?.status!=='approved'){t.finalDue=date(1);p.finalDue=date(1);}
      if([script,final,p.publication,stats].some(x=>x?.status==='submitted')){t.reviewDue=anchor;p.reviewDue=anchor;}
      if(p.publication&&p.publication.status!=='approved')p.plannedDate=anchor;
      if(p.publication?.status==='approved'&&(!stats||stats.status==='revision'))t.statsDays=Math.max(1,Math.round((Date.parse(anchor)-Date.parse(p.publication.date))/86400000));
    }
  }
  state.events.sort((a,b)=>String(b.at).localeCompare(String(a.at)));
  state.examplesVersion=version;
  return true;
}
