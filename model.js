(function(root){
'use strict';
const ITEMS=['Monitor 1','Monitor 2','Teclado','Mouse','Mouse pad','Headset'];
const CONDITIONS={untested:'Não testado',ok:'Sem problema observado',reported:'Problema relatado',confirmed:'Defeito confirmado'};
const DEFECTS={audio:'Sem áudio / áudio falhando',mic:'Microfone',contact:'Mau contato',connector:'Conector / cabo',other:'Outro'};
const pad=n=>String(n).padStart(2,'0');
const localDate=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const blankPA=()=>({items:Array(6).fill(false),reviewed:false,note:'',time:null,headsetLabel:null,condition:'untested',defect:'audio',detail:''});
const blankDB=()=>({version:2,name:'',sector:'',days:{},tickets:[]});
const blankDay=(db)=>({name:db.name||'',sector:db.sector||'',pas:Array.from({length:48},blankPA)});
const hasDefect=p=>['reported','confirmed'].includes(p.condition);
const label=(p,i)=>p.headsetLabel===null?pad(i+1):p.headsetLabel;
const swapped=(p,i)=>p.items[5]&&label(p,i)!==pad(i+1);
const occurrence=(p,i)=>p.reviewed&&(!p.items.every(Boolean)||swapped(p,i)||(p.items[5]&&hasDefect(p)));
const stats=pas=>({done:pas.filter(p=>p.reviewed).length,ok:pas.filter((p,i)=>p.reviewed&&!occurrence(p,i)).length,issues:pas.filter(occurrence).length});
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const str=(s,max=500)=>typeof s==='string'&&s.length<=max;
const stamp=s=>s===null||(typeof s==='string'&&Number.isFinite(Date.parse(s)));
function validPA(p){return !!p&&Array.isArray(p.items)&&p.items.length===6&&p.items.every(x=>typeof x==='boolean')&&typeof p.reviewed==='boolean'&&str(p.note)&&stamp(p.time)&&(p.headsetLabel===null||p.headsetLabel==='unknown'||(typeof p.headsetLabel==='string'&&Array.from({length:48},(_,i)=>pad(i+1)).includes(p.headsetLabel)))&&Object.hasOwn(CONDITIONS,p.condition)&&Object.hasOwn(DEFECTS,p.defect)&&str(p.detail);}
function validDB(db){return !!db&&db.version===2&&str(db.name,100)&&str(db.sector,100)&&db.days&&typeof db.days==='object'&&!Array.isArray(db.days)&&Object.entries(db.days).every(([date,d])=>validDate(date)&&d&&str(d.name,100)&&str(d.sector,100)&&Array.isArray(d.pas)&&d.pas.length===48&&d.pas.every(validPA))&&Array.isArray(db.tickets)&&new Set(db.tickets.map(t=>t?.id)).size===db.tickets.length&&db.tickets.every(t=>t&&str(t.id,150)&&validDate(t.date)&&Number.isInteger(t.pa)&&t.pa>=1&&t.pa<=48&&['missing','swap','defect'].includes(t.kind)&&str(t.title)&&str(t.detail,1200)&&str(t.fingerprint,1500)&&stamp(t.createdAt)&&t.createdAt!==null&&stamp(t.resolvedAt)&&str(t.resolution));}
function migrate(old){if(!old||!old.days||typeof old.days!=='object'||Array.isArray(old.days))throw Error('Backup inválido');const db=blankDB();db.name=str(old.name,100)?old.name:'';db.sector=str(old.sector,100)?old.sector:'';for(const [date,d] of Object.entries(old.days)){if(!validDate(date)||!d||!str(d.name,100)||!str(d.sector,100)||!['in','out'].every(s=>Array.isArray(d[s])&&d[s].length===48&&d[s].every(p=>p&&Array.isArray(p.items)&&p.items.length===6&&p.items.every(v=>typeof v==='boolean')&&typeof p.reviewed==='boolean'&&str(p.note)&&stamp(p.time))))throw Error('Backup antigo inválido');db.days[date]={name:d.name,sector:d.sector,pas:d.out.map((p,i)=>({...blankPA(),...(p.reviewed||p.items.some(Boolean)||p.note?p:d.in[i]),items:[...(p.reviewed||p.items.some(Boolean)||p.note?p:d.in[i]).items]})),legacy:d};}if(!validDB(db))throw Error('Backup inválido');return db;}
function importDB(raw){if(raw?.version===2){if(!validDB(raw))throw Error('Backup inválido');return raw;}return migrate(raw);}
function syncTickets(db,date,index,now=new Date().toISOString()){
const p=db.days[date].pas[index];if(!p.reviewed)return;const specs=[];const pa=pad(index+1),found=label(p,index)==='unknown'?'sem etiqueta':`etiqueta PA ${label(p,index)}`;
if(!p.items[5])specs.push({kind:'missing',title:`PA ${pa} · headset ausente`,detail:'Headset não encontrado na conferência.'});
else {if(swapped(p,index))specs.push({kind:'swap',title:`PA ${pa} · ${label(p,index)==='unknown'?'headset sem etiqueta':'headset de outro PA'}`,detail:`Esperado: etiqueta PA ${pa}. Encontrado: ${found}.`});if(hasDefect(p))specs.push({kind:'defect',title:`PA ${pa} · ${DEFECTS[p.defect]}`,detail:`${CONDITIONS[p.condition]} · ${found}.${p.detail?' '+p.detail:''}`});}
for(const spec of specs){const fp=JSON.stringify([index+1,spec.kind,spec.detail]);if(db.tickets.some(t=>t.fingerprint===fp&&(!t.resolvedAt||t.date===date)))continue;db.tickets.push({...spec,id:`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`,date,pa:index+1,fingerprint:fp,createdAt:now,resolvedAt:null,resolution:''});}
}
function confirmPA(db,date,index,all=false,now=new Date().toISOString()){const p=db.days[date].pas[index];if(all)p.items.fill(true);p.reviewed=true;p.time=now;syncTickets(db,date,index,now);}
function resolveTicket(db,id,resolution,now=new Date().toISOString()){const t=db.tickets.find(t=>t.id===id);if(!t||t.resolvedAt||!resolution.trim())return false;t.resolution=resolution.trim().slice(0,500);t.resolvedAt=now;return true;}
function reportTickets(db,date){return db.tickets.filter(t=>t.date<=date&&(!t.resolvedAt||localDate(new Date(t.resolvedAt))>=date));}
const api={ITEMS,CONDITIONS,DEFECTS,pad,localDate,blankPA,blankDB,blankDay,hasDefect,label,swapped,occurrence,stats,validDate,validDB,importDB,migrate,syncTickets,confirmPA,resolveTicket,reportTickets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PAModel=api;
})(typeof window!=='undefined'?window:globalThis);
