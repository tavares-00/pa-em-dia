(function(root){
'use strict';
const ITEMS=['Monitor 1','Monitor 2','Teclado','Mouse','Mouse pad','Headset'];
const CONDITIONS={untested:'Não testado',ok:'Sem problema observado',reported:'Problema relatado',confirmed:'Defeito confirmado'};
const DEFECTS={audio:'Sem áudio / áudio falhando',mic:'Microfone',contact:'Mau contato',connector:'Conector / cabo',other:'Outro'};
const pad=n=>String(n).padStart(2,'0');
const localDate=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const blankPA=()=>({items:Array(6).fill(false),reviewed:false,note:'',time:null,headsetLabel:null,condition:'untested',defect:'audio',detail:''});
const blankDB=()=>({version:2,ticketSyncVersion:3,name:'',sector:'',days:{},tickets:[]});
const blankDay=(db)=>({name:db.name||'',sector:db.sector||'',pas:Array.from({length:48},blankPA)});
const hasDefect=p=>['reported','confirmed'].includes(p.condition);
const label=(p,i)=>p.headsetLabel===null?pad(i+1):p.headsetLabel;
const swapped=(p,i)=>p.items[5]&&label(p,i)!==pad(i+1);
const occurrence=(p,i)=>p.reviewed&&(!p.items.every(Boolean)||swapped(p,i)||(p.items[5]&&hasDefect(p)));
const stats=(pas,tickets=[])=>{const open=new Set(tickets.filter(t=>!t.resolvedAt).map(t=>t.pa-1)),issue=(p,i)=>p.reviewed&&(occurrence(p,i)||open.has(i));return {done:pas.filter(p=>p.reviewed).length,ok:pas.filter((p,i)=>p.reviewed&&!issue(p,i)).length,issues:pas.filter(issue).length};};
function previousDate(date){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}
function pendingTickets(db,date,index=null){return db.tickets.filter(t=>!t.resolvedAt&&t.date<=date&&(index===null||t.pa===index+1)).slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt));}
function yesterdayPA(db,date,index){const sourceDate=previousDate(date),p=db.days[sourceDate]?.pas[index];return p?.reviewed?{sourceDate,pa:p}:null;}
function copyYesterday(db,date,index,now=new Date().toISOString()){
const source=yesterdayPA(db,date,index);if(!source)return false;
if(!db.days[date])db.days[date]=blankDay(db);
const p=source.pa;
// Copy the actual equipment state, never yesterday's timestamp or review metadata.
db.days[date].pas[index]={...blankPA(),items:[...p.items],note:p.note,headsetLabel:p.headsetLabel,condition:p.condition,defect:p.defect,detail:p.detail,copiedFrom:source.sourceDate};
confirmPA(db,date,index,false,now);return true;
}
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const str=(s,max=500)=>typeof s==='string'&&s.length<=max;
const stamp=s=>s===null||(typeof s==='string'&&Number.isFinite(Date.parse(s)));
function validPA(p){return !!p&&Array.isArray(p.items)&&p.items.length===6&&p.items.every(x=>typeof x==='boolean')&&typeof p.reviewed==='boolean'&&str(p.note)&&stamp(p.time)&&(p.headsetLabel===null||p.headsetLabel==='unknown'||(typeof p.headsetLabel==='string'&&Array.from({length:48},(_,i)=>pad(i+1)).includes(p.headsetLabel)))&&Object.hasOwn(CONDITIONS,p.condition)&&Object.hasOwn(DEFECTS,p.defect)&&str(p.detail)&&(p.copiedFrom===undefined||validDate(p.copiedFrom));}
function validDB(db){return !!db&&db.version===2&&str(db.name,100)&&str(db.sector,100)&&db.days&&typeof db.days==='object'&&!Array.isArray(db.days)&&Object.entries(db.days).every(([date,d])=>validDate(date)&&d&&str(d.name,100)&&str(d.sector,100)&&Array.isArray(d.pas)&&d.pas.length===48&&d.pas.every(validPA))&&Array.isArray(db.tickets)&&new Set(db.tickets.map(t=>t?.id)).size===db.tickets.length&&db.tickets.every(t=>t&&str(t.id,150)&&validDate(t.date)&&Number.isInteger(t.pa)&&t.pa>=1&&t.pa<=48&&['missing','swap','defect'].includes(t.kind)&&str(t.title)&&str(t.detail,1200)&&str(t.fingerprint,1500)&&stamp(t.createdAt)&&t.createdAt!==null&&stamp(t.resolvedAt)&&str(t.resolution)&&(t.itemIndex===undefined||(Number.isInteger(t.itemIndex)&&t.itemIndex>=0&&t.itemIndex<6))&&(t.defectCode===undefined||Object.hasOwn(DEFECTS,t.defectCode))&&(t.original===undefined||validPA(t.original)));}
function migrate(old){if(!old||!old.days||typeof old.days!=='object'||Array.isArray(old.days))throw Error('Backup inválido');const db=blankDB();db.name=str(old.name,100)?old.name:'';db.sector=str(old.sector,100)?old.sector:'';for(const [date,d] of Object.entries(old.days)){if(!validDate(date)||!d||!str(d.name,100)||!str(d.sector,100)||!['in','out'].every(s=>Array.isArray(d[s])&&d[s].length===48&&d[s].every(p=>p&&Array.isArray(p.items)&&p.items.length===6&&p.items.every(v=>typeof v==='boolean')&&typeof p.reviewed==='boolean'&&str(p.note)&&stamp(p.time))))throw Error('Backup antigo inválido');db.days[date]={name:d.name,sector:d.sector,pas:d.out.map((p,i)=>({...blankPA(),...(p.reviewed||p.items.some(Boolean)||p.note?p:d.in[i]),items:[...(p.reviewed||p.items.some(Boolean)||p.note?p:d.in[i]).items]})),legacy:d};}if(!validDB(db))throw Error('Backup inválido');return db;}
function importDB(raw){if(raw?.version===2){if(!validDB(raw))throw Error('Backup inválido');return normalize(raw);}return normalize(migrate(raw));}
const clone=p=>JSON.parse(JSON.stringify(p));
const defectCode=t=>t.defectCode||Object.keys(DEFECTS).find(k=>t.title.endsWith(' · '+DEFECTS[k]))||'other';
const ticketKey=t=>`${t.pa}:${t.kind}:${t.kind==='missing'?(t.itemIndex??5):t.kind==='defect'?defectCode(t):''}`;
function specsFor(p,index){
const specs=[],pa=pad(index+1),found=label(p,index)==='unknown'?'sem etiqueta':`etiqueta PA ${label(p,index)}`;
p.items.forEach((present,j)=>{if(!present)specs.push({pa:index+1,kind:'missing',itemIndex:j,title:`PA ${pa} · ${ITEMS[j]} ausente`,detail:`${ITEMS[j]} não encontrado na conferência.`});});
if(p.items[5]){if(swapped(p,index))specs.push({pa:index+1,kind:'swap',itemIndex:5,title:`PA ${pa} · ${label(p,index)==='unknown'?'headset sem etiqueta':'headset de outro PA'}`,detail:`Esperado: etiqueta PA ${pa}. Encontrado: ${found}.`});if(hasDefect(p))specs.push({pa:index+1,kind:'defect',itemIndex:5,defectCode:p.defect,title:`PA ${pa} · ${DEFECTS[p.defect]}`,detail:`${CONDITIONS[p.condition]} · ${found}.${p.detail?' '+p.detail:''}`});}return specs;
}
function closeTicket(t,resolution,now){t.resolution=resolution.trim().slice(0,500);t.resolvedAt=now;}
function syncTickets(db,date,index,now=new Date().toISOString()){
const p=db.days[date].pas[index];if(!p.reviewed)return;const specs=specsFor(p,index),keys=new Set(specs.map(ticketKey));
for(const t of db.tickets.filter(t=>!t.resolvedAt&&t.pa===index+1&&t.date<=date)){
if(keys.has(ticketKey(t)))continue;
// Removing the headset does not confirm that an audio fault or a swap was fixed.
if((t.kind==='defect'||t.kind==='swap')&&!p.items[5])continue;
if(t.kind==='defect'&&p.condition==='untested')continue;
closeTicket(t,t.kind==='missing'?`${ITEMS[t.itemIndex??5]} marcado como presente no checklist de ${date.split('-').reverse().join('/')}.`:t.kind==='swap'?'Etiqueta corrigida no checklist.':'Condição do headset corrigida no checklist.',now);
}
for(const spec of specs){if(db.tickets.some(t=>!t.resolvedAt&&t.date<=date&&ticketKey(t)===ticketKey(spec)))continue;db.tickets.push({...spec,id:`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`,date,fingerprint:JSON.stringify([index+1,spec.kind,spec.detail]),original:clone(p),createdAt:now,resolvedAt:null,resolution:''});}
}
function confirmPA(db,date,index,all=false,now=new Date().toISOString()){const p=db.days[date].pas[index];if(all)p.items.fill(true);p.reviewed=true;p.time=now;syncTickets(db,date,index,now);}
function applyResolution(p,t,now){if(!p?.reviewed)return;const matches=t.kind==='missing'?!p.items[t.itemIndex??5]:t.kind==='swap'?label(p,t.pa-1)!==pad(t.pa):hasDefect(p)&&p.defect===defectCode(t);if(!matches)return;if(!t.original)t.original=clone(p);if(t.kind==='missing')p.items[t.itemIndex??5]=true;else if(t.kind==='swap')p.headsetLabel=null;else {p.condition='ok';p.detail='';}p.updatedAt=now;}
function resolveTicket(db,id,resolution,now=new Date().toISOString(),selectedDate=localDate(new Date(now))){
const t=db.tickets.find(t=>t.id===id);if(!t||t.resolvedAt||!resolution.trim())return false;
for(const date of new Set([t.date,selectedDate,localDate(new Date(now))])){if(date>=t.date&&date<=localDate(new Date(now)))applyResolution(db.days[date]?.pas[t.pa-1],t,now);}
closeTicket(t,resolution,now);return true;
}
function normalize(db){
if(db.ticketSyncVersion===3)return db;
for(const t of db.tickets){if(t.kind==='missing'&&t.itemIndex===undefined)t.itemIndex=5;if(t.kind==='defect'&&!t.defectCode)t.defectCode=defectCode(t);if(!t.resolvedAt)continue;
const p=db.days[t.date]?.pas[t.pa-1];const newer=db.tickets.some(other=>!other.resolvedAt&&ticketKey(other)===ticketKey(t)&&other.createdAt>t.resolvedAt);
if(!newer&&p)applyResolution(p,t,t.resolvedAt);}
const dates=Object.keys(db.days).sort().reverse();for(let i=0;i<48;i++){const date=dates.find(d=>db.days[d].pas[i].reviewed);if(date)syncTickets(db,date,i);}
db.ticketSyncVersion=3;return db;
}
function reportTickets(db,date){return db.tickets.filter(t=>t.date<=date&&(!t.resolvedAt||localDate(new Date(t.resolvedAt))>=date));}
const api={ITEMS,CONDITIONS,DEFECTS,pad,localDate,blankPA,blankDB,blankDay,hasDefect,label,swapped,occurrence,stats,previousDate,pendingTickets,yesterdayPA,copyYesterday,validDate,validDB,importDB,migrate,normalize,syncTickets,confirmPA,resolveTicket,reportTickets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PAModel=api;
})(typeof window!=='undefined'?window:globalThis);
